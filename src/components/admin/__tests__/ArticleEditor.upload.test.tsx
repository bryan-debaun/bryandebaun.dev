import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Keep the editor test focused on upload-and-insert: stub the data hook,
// the router, and the heavy Markdown preview.
vi.mock('@/lib/hooks/useAdminArticles', () => ({
    useAdminArticles: () => ({
        createMutation: { isPending: false, mutateAsync: vi.fn() },
        updateMutation: { isPending: false, mutateAsync: vi.fn() },
    }),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/components/ArticleBody', () => ({
    default: ({ body }: { body: string }) => (
        <div data-testid="preview">{body}</div>
    ),
}));

import ArticleEditor from '../ArticleEditor';

function getBody() {
    return screen.getByLabelText(/Body \(Markdown\)/) as HTMLTextAreaElement;
}

describe('ArticleEditor image upload', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('uploads a chosen file and inserts the Markdown image at the cursor', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                url: 'https://storage.example.com/article-assets/2026/abc.png',
            }),
        });
        vi.stubGlobal('fetch', fetchMock);

        render(<ArticleEditor mode="create" />);

        const body = getBody();
        fireEvent.change(body, { target: { value: 'before after' } });
        body.setSelectionRange(6, 6); // caret between "before " and "after"

        const file = new File(['x'], 'my-cool_pic.png', { type: 'image/png' });
        const input = document.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                '/api/admin/upload',
                expect.objectContaining({ method: 'POST' }),
            );
        });

        await waitFor(() => {
            // Alt text derived from filename (extension dropped, separators -> spaces).
            expect(body.value).toContain(
                '![my cool pic](https://storage.example.com/article-assets/2026/abc.png)',
            );
        });
        // Inserted at the caret, between the two words.
        expect(body.value.startsWith('before')).toBe(true);
        expect(body.value.trimEnd().endsWith('after')).toBe(true);
    });

    it('uploads a light + dark pair once and inserts a #themed image', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                url: 'https://storage.example.com/article-assets/2026/abc.svg',
                darkUrl:
                    'https://storage.example.com/article-assets/2026/abc_dark.svg',
                themed: true,
            }),
        });
        vi.stubGlobal('fetch', fetchMock);

        render(<ArticleEditor mode="create" />);

        const light = new File(['l'], 'foo.svg', { type: 'image/svg+xml' });
        const dark = new File(['d'], 'foo_dark.svg', { type: 'image/svg+xml' });
        const input = document.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;
        fireEvent.change(input, { target: { files: [light, dark] } });

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        // The single request carried BOTH files under file + dark.
        const body = fetchMock.mock.calls[0][1].body as FormData;
        expect((body.get('file') as File).name).toBe('foo.svg');
        expect((body.get('dark') as File).name).toBe('foo_dark.svg');

        await waitFor(() => {
            expect(getBody().value).toContain(
                '![foo](https://storage.example.com/article-assets/2026/abc.svg#themed)',
            );
        });
    });

    it('treats a lone image as a single upload (no #themed marker)', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                url: 'https://storage.example.com/article-assets/2026/solo.png',
            }),
        });
        vi.stubGlobal('fetch', fetchMock);

        render(<ArticleEditor mode="create" />);

        const file = new File(['x'], 'solo.png', { type: 'image/png' });
        const input = document.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            const body = fetchMock.mock.calls[0][1].body as FormData;
            expect(body.get('dark')).toBeNull();
        });

        await waitFor(() => {
            expect(getBody().value).toContain(
                '![solo](https://storage.example.com/article-assets/2026/solo.png)',
            );
        });
        expect(getBody().value).not.toContain('#themed');
    });

    it('surfaces the server error message and inserts nothing on failure', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Image is too large (max 5 MB).' }),
        });
        vi.stubGlobal('fetch', fetchMock);

        render(<ArticleEditor mode="create" />);

        const file = new File(['x'], 'big.png', { type: 'image/png' });
        const input = document.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(
                screen.getByText('Image is too large (max 5 MB).'),
            ).toBeInTheDocument();
        });
        expect(getBody().value).toBe('');
    });
});
