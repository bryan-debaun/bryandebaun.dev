import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { getAdminSupabase } from '@/lib/supabase/admin';

/**
 * POST /api/admin/upload
 *
 * Uploads an image to the public Supabase Storage bucket `article-assets` and
 * returns its public URL for embedding in a Markdown article body.
 *
 * Authorization: gated by {@link requireAdmin} BEFORE any storage access, so a
 * non-admin can never reach the service-role client. The service-role client
 * bypasses RLS (`getAdminSupabase`), which is why admin-only gating is critical.
 *
 * SVG note: uploads are admin-only (trusted authors). SVGs are served from the
 * Supabase Storage origin — a SEPARATE domain from the app — and embedded via
 * Markdown `<img>` (script-sandboxed, no inline-script execution against our
 * origin), so we accept them without server-side SVG sanitization. Raster
 * formats are the common case.
 */

/** Bucket that must exist (public) in Supabase Storage. */
const BUCKET = 'article-assets';

/** Max upload size: 5 MB. */
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Allowlist of accepted MIME types mapped to the file extension we control.
 *
 * The extension is derived from the VALIDATED MIME type, never from the
 * user-supplied filename. This prevents extension spoofing and path traversal:
 * the object key only ever contains a server-generated UUID plus a known-safe
 * extension from this map.
 */
const MIME_TO_EXT: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
};

export async function POST(request: NextRequest) {
    // Authorize FIRST — before touching the service-role storage client.
    const guard = await requireAdmin();
    if (guard) return guard;

    const admin = getAdminSupabase();
    if (!admin.ok) {
        return NextResponse.json(
            { error: 'Image upload is not configured.' },
            { status: 503 },
        );
    }

    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return NextResponse.json(
            { error: 'Expected multipart/form-data with a "file" field.' },
            { status: 400 },
        );
    }

    const fileEntry = formData.get('file');
    if (!fileEntry || typeof fileEntry === 'string') {
        return NextResponse.json(
            { error: 'No file was provided.' },
            { status: 400 },
        );
    }

    const file: File = fileEntry;

    const ext = MIME_TO_EXT[file.type];
    if (!ext) {
        return NextResponse.json(
            {
                error: `Unsupported image type. Allowed: ${Object.keys(
                    MIME_TO_EXT,
                ).join(', ')}.`,
            },
            { status: 400 },
        );
    }

    if (file.size > MAX_BYTES) {
        return NextResponse.json(
            { error: 'Image is too large (max 5 MB).' },
            { status: 400 },
        );
    }

    // Object key is fully server-controlled: a year prefix plus a random UUID
    // and the validated extension. It never contains the raw filename, "..",
    // or a leading slash, so traversal and overwrite are impossible.
    const key = `${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${ext}`;

    const { error } = await admin.client.storage
        .from(BUCKET)
        .upload(key, file, {
            contentType: file.type,
            upsert: false,
            cacheControl: '31536000',
        });

    if (error) {
        console.error('Admin: image upload failed', { message: error.message });
        const missingBucket = /bucket not found/i.test(error.message);
        return NextResponse.json(
            {
                error: missingBucket
                    ? `Storage bucket "${BUCKET}" was not found. Create a public bucket named "${BUCKET}" in Supabase Storage.`
                    : 'Failed to upload image.',
            },
            { status: 502 },
        );
    }

    const { data } = admin.client.storage.from(BUCKET).getPublicUrl(key);

    return NextResponse.json(
        { url: data.publicUrl, path: key },
        { status: 200 },
    );
}
