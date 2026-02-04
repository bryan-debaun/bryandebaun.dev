import { NextResponse } from 'next/server';
import { fetchByIsbn } from '@/lib/services/openLibrary';
import { normalizeIsbn } from '@/lib/isbn';

export async function GET(request: Request, context: { params: { isbn: string } | Promise<{ isbn: string }> }) {
    const params = 'then' in context.params ? await context.params : context.params;
    const { isbn } = params as { isbn: string };

    const normalized = normalizeIsbn(isbn);
    if (!normalized) {
        return NextResponse.json({ message: 'Invalid ISBN provided' }, { status: 400 });
    }

    try {
        const data = await fetchByIsbn(normalized);
        if (!data) return NextResponse.json({ message: `No data found on OpenLibrary for ISBN ${normalized}` }, { status: 404 });
        return NextResponse.json({ normalizedIsbn: normalized, ...data });
    } catch (e) {
        return NextResponse.json({ message: 'Failed to fetch metadata' }, { status: 502 });
    }
}
