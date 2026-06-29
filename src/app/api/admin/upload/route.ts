import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { getAdminSupabase } from '@/lib/supabase/admin';

/**
 * POST /api/admin/upload
 *
 * Uploads an image to the public Supabase Storage bucket `article-assets` and
 * returns its public URL for embedding in a Markdown article body.
 *
 * Single mode (default): one `file` field → `{ url, path }`.
 *
 * Pair mode (themed light/dark): a `file` (light) PLUS a `dark` field. Both are
 * validated and must share the SAME MIME so the dark URL is derivable by
 * inserting `_dark` before a single shared extension. The pair is stored under
 * one server-generated uuid (`${year}/${uuid}.${ext}` and
 * `${year}/${uuid}_dark.${ext}`) → `{ url, darkUrl, path, themed: true }`. If
 * the light object uploads but the dark fails, the light is best-effort removed
 * so we never orphan a half-pair.
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

/**
 * Validate a form entry as an accepted image File and return its server-safe
 * extension (derived from the VALIDATED MIME, never the filename), or a 400
 * response describing the failure.
 */
function validateFile(
    entry: FormDataEntryValue | null,
    label: string,
): { file: File; ext: string } | NextResponse {
    if (!entry || typeof entry === 'string') {
        return NextResponse.json(
            { error: `No ${label} file was provided.` },
            { status: 400 },
        );
    }

    const file: File = entry;
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

    return { file, ext };
}

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

    const light = validateFile(formData.get('file'), 'image');
    if (light instanceof NextResponse) return light;

    const darkEntry = formData.get('dark');
    const isPair = darkEntry !== null;

    // Object key is fully server-controlled: a year prefix plus a random UUID
    // and the validated extension. It never contains the raw filename, "..",
    // or a leading slash, so traversal and overwrite are impossible.
    const year = new Date().getUTCFullYear();
    const uuid = crypto.randomUUID();
    const storage = admin.client.storage.from(BUCKET);

    /** Translate a storage upload error into a 502 response. */
    const uploadFailure = (message: string): NextResponse => {
        console.error('Admin: image upload failed', { message });
        const missingBucket = /bucket not found/i.test(message);
        return NextResponse.json(
            {
                error: missingBucket
                    ? `Storage bucket "${BUCKET}" was not found. Create a public bucket named "${BUCKET}" in Supabase Storage.`
                    : 'Failed to upload image.',
            },
            { status: 502 },
        );
    };

    if (isPair) {
        const dark = validateFile(darkEntry, 'dark image');
        if (dark instanceof NextResponse) return dark;

        // Same MIME → the dark URL is derivable by inserting `_dark` before the
        // shared extension. Mismatched types would break that derivation.
        if (light.file.type !== dark.file.type) {
            return NextResponse.json(
                {
                    error: 'The light and dark images must be the same file type.',
                },
                { status: 400 },
            );
        }

        const lightKey = `${year}/${uuid}.${light.ext}`;
        const darkKey = `${year}/${uuid}_dark.${light.ext}`;

        const lightUpload = await storage.upload(lightKey, light.file, {
            contentType: light.file.type,
            upsert: false,
            cacheControl: '31536000',
        });
        if (lightUpload.error) return uploadFailure(lightUpload.error.message);

        const darkUpload = await storage.upload(darkKey, dark.file, {
            contentType: dark.file.type,
            upsert: false,
            cacheControl: '31536000',
        });
        if (darkUpload.error) {
            // Best-effort: remove the light object so we never orphan a half
            // pair (a `_dark` derivation that 404s).
            await storage.remove([lightKey]);
            return uploadFailure(darkUpload.error.message);
        }

        const lightUrl = storage.getPublicUrl(lightKey).data.publicUrl;
        const darkUrl = storage.getPublicUrl(darkKey).data.publicUrl;

        return NextResponse.json(
            { url: lightUrl, darkUrl, path: lightKey, themed: true },
            { status: 200 },
        );
    }

    const key = `${year}/${uuid}.${light.ext}`;

    const { error } = await storage.upload(key, light.file, {
        contentType: light.file.type,
        upsert: false,
        cacheControl: '31536000',
    });

    if (error) return uploadFailure(error.message);

    const { data } = storage.getPublicUrl(key);

    return NextResponse.json(
        { url: data.publicUrl, path: key },
        { status: 200 },
    );
}
