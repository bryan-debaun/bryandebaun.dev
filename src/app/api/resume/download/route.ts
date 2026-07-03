import { NextResponse, type NextRequest } from 'next/server';
import {
    getResumeDownloadSignedUrl,
    verifyResumeDownloadLink,
} from '@/lib/resume-download';
import { recordResumeDownload } from '@/lib/services/resume-requests';

// This route mints a fresh, short-lived signed URL per request and must never
// be cached or statically prerendered.
export const dynamic = 'force-dynamic';

/** Terse 404 that reveals nothing about why access was refused. */
function notFoundResponse(): NextResponse {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

/**
 * GET /api/resume/download?t=<token>
 *
 * The public download endpoint linked from the approval email (ADR 0007 Phase
 * 2). It verifies the stateless signed token (`verifyResumeDownloadLink`) and,
 * on success, 302-redirects to a freshly-minted Supabase Storage signed URL for
 * the private résumé PDF. Any verification failure returns a bare 404 so the
 * endpoint reveals nothing about token validity or file existence.
 */
export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('t');

    const verified = verifyResumeDownloadLink(token);
    if (!verified.ok) return notFoundResponse();

    // Mint the signed URL FIRST: if the object is missing/unconfigured we bail
    // before recording, so a broken file never burns one of the user's downloads.
    const result = await getResumeDownloadSignedUrl();
    if (!result.ok) {
        // `unconfigured`/`not_found` → 404 (reveal nothing); transient storage
        // errors → 503 so a retry is meaningful.
        if (result.reason === 'error') {
            return NextResponse.json(
                { error: 'The résumé is temporarily unavailable.' },
                { status: 503 },
            );
        }
        return notFoundResponse();
    }

    // Record the download and enforce the per-approval cap (#145). This is the
    // authoritative gate — the backend atomically increments the count and
    // rejects once the cap/expiry is reached. Only redirect on a recorded 2xx.
    const recorded = await recordResumeDownload(verified.requestId);
    if (!recorded.ok) {
        if (recorded.reason === 'denied') {
            return NextResponse.json(
                {
                    error: 'This download link has reached its limit or expired.',
                },
                { status: 410 },
            );
        }
        return NextResponse.json(
            { error: 'The résumé is temporarily unavailable.' },
            { status: 503 },
        );
    }

    return NextResponse.redirect(result.url, 302);
}
