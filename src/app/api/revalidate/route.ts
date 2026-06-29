import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Secret-protected on-demand revalidation hook.
 *
 * The MCP server (or an admin tool) POSTs here after publishing/updating an
 * article so the writing list — and, if a slug is provided, the matching
 * detail page — refresh immediately instead of waiting for the ISR window.
 *
 * Security model:
 *  - If `REVALIDATE_SECRET` is unset, the endpoint is disabled (503). We never
 *    allow unauthenticated revalidation.
 *  - The caller must present the secret via the `x-revalidate-secret` header or
 *    a `?secret=` query param; otherwise 401.
 */
export async function POST(req: NextRequest) {
    const configuredSecret = process.env.REVALIDATE_SECRET;
    if (!configuredSecret) {
        return NextResponse.json(
            { error: 'Revalidation is not configured.' },
            { status: 503 },
        );
    }

    const headerSecret = req.headers.get('x-revalidate-secret');
    const querySecret = req.nextUrl.searchParams.get('secret');
    const providedSecret = headerSecret ?? querySecret;

    if (!providedSecret || providedSecret !== configuredSecret) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    let slug: string | undefined;
    try {
        const body = (await req.json()) as { slug?: unknown };
        if (typeof body?.slug === 'string' && body.slug.length > 0) {
            slug = body.slug;
        }
    } catch {
        // Body is optional — a bare POST revalidates the list only.
    }

    revalidatePath('/writing');
    if (slug) {
        revalidatePath(`/writing/${slug}`);
    }

    return NextResponse.json({ revalidated: true });
}
