import { beforeEach, describe, expect, it, vi } from 'vitest';

const getResume = vi.fn();
const getResumeFull = vi.fn();
const putResume = vi.fn();
const createApi = vi.fn((_token?: string) => ({
    api: { getResume, getResumeFull, putResume },
}));

vi.mock('@/lib/mcp', () => ({
    createApi: (token?: string) => createApi(token),
}));

import {
    getFullResume,
    getPublicResume,
    updateResume,
} from '@/lib/services/resume';

const DOC = {
    basics: {
        name: 'Bryan DeBaun',
        label: 'Senior Software Engineer',
        url: 'https://bryandebaun.dev',
        summary: 'A real summary.',
        profiles: [],
    },
    work: [],
    education: [],
    skills: [],
    projects: [],
};

const FULL_DOC = {
    ...DOC,
    basics: {
        ...DOC.basics,
        privateContact: { email: 'brn.dbn@example.com', phone: '(913) 555' },
    },
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('getPublicResume', () => {
    it('unwraps the document envelope from the public endpoint', async () => {
        getResume.mockResolvedValue({ data: { document: DOC } });
        const result = await getPublicResume();
        expect(getResume).toHaveBeenCalled();
        expect(result?.basics.name).toBe('Bryan DeBaun');
        // The public endpoint strips privateContact; we never add it back.
        expect(result?.basics.privateContact).toBeUndefined();
    });

    it('returns null when the API throws', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        getResume.mockRejectedValue(new Error('MCP down'));
        expect(await getPublicResume()).toBeNull();
    });
});

describe('getFullResume', () => {
    it('returns the full document including private contact', async () => {
        getResumeFull.mockResolvedValue({ data: { document: FULL_DOC } });
        const result = await getFullResume();
        expect(getResumeFull).toHaveBeenCalled();
        expect(result?.basics.privateContact?.email).toBe(
            'brn.dbn@example.com',
        );
    });

    it('returns null when the API throws', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        getResumeFull.mockRejectedValue(new Error('MCP down'));
        expect(await getFullResume()).toBeNull();
    });
});

describe('updateResume', () => {
    it('forwards the token to createApi and the doc to putResume', async () => {
        putResume.mockResolvedValue({ data: { document: FULL_DOC } });
        const result = await updateResume(
            'jwt-token',
            FULL_DOC as unknown as Parameters<typeof updateResume>[1],
        );
        expect(createApi).toHaveBeenCalledWith('jwt-token');
        expect(putResume).toHaveBeenCalledWith(FULL_DOC);
        expect(result.basics.name).toBe('Bryan DeBaun');
    });

    it('propagates errors (route maps them)', async () => {
        putResume.mockRejectedValue(new Error('backend 500'));
        await expect(
            updateResume(
                'jwt-token',
                DOC as unknown as Parameters<typeof updateResume>[1],
            ),
        ).rejects.toThrow('backend 500');
    });
});
