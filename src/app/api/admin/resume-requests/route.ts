import { NextResponse, type NextRequest } from 'next/server';
import { ResumeDownloadStatus } from '@bryandebaun/mcp-client';
import type { ResumeDownloadReadStatus } from '@bryandebaun/mcp-client';
import { requireAdmin } from '@/lib/auth-guard';
import { createClient } from '@/lib/supabase/server';
import { listResumeRequests } from '@/lib/services/resume-requests';

/** Valid `?status=` values, mapped to the MCP `ResumeDownloadReadStatus`. */
const VALID_STATUSES: ReadonlySet<string> = new Set([
    'all',
    ResumeDownloadStatus.Pending,
    ResumeDownloadStatus.Approved,
    ResumeDownloadStatus.Denied,
    ResumeDownloadStatus.Fulfilled,
    ResumeDownloadStatus.Expired,
]);

/**
 * GET /api/admin/resume-requests
 *
 * Lists gated-résumé download requests for the admin UI (ADR 0007 Phase 2).
 * Admin-only — the caller's Supabase JWT is forwarded to the MCP server, which
 * authorizes returning every user's requests. Supports an optional `?status=`
 * filter; defaults to `all` so the admin sees the full lifecycle.
 */
export async function GET(req: NextRequest) {
    const guard = await requireAdmin();
    if (guard) return guard;

    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const requested = req.nextUrl.searchParams.get('status');
    const status: ResumeDownloadReadStatus =
        requested && VALID_STATUSES.has(requested)
            ? (requested as ResumeDownloadReadStatus)
            : 'all';

    try {
        const payload = await listResumeRequests(session?.access_token, status);
        return NextResponse.json(payload);
    } catch (e) {
        console.error('Admin: failed to list résumé requests', e);
        return NextResponse.json(
            { error: 'Failed to list résumé requests' },
            { status: 502 },
        );
    }
}
