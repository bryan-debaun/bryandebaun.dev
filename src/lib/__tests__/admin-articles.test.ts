import { describe, it, expect, vi } from 'vitest';
import {
    isSlugConflictError,
    revalidateArticlePaths,
} from '@/lib/admin-articles';

describe('isSlugConflictError', () => {
    it('detects an Axios 400 response', () => {
        expect(isSlugConflictError({ response: { status: 400 } })).toBe(true);
    });

    it('ignores other statuses and shapes', () => {
        expect(isSlugConflictError({ response: { status: 500 } })).toBe(false);
        expect(isSlugConflictError(new Error('boom'))).toBe(false);
        expect(isSlugConflictError(undefined)).toBe(false);
    });
});

describe('revalidateArticlePaths', () => {
    it('revalidates the index and the slug page', () => {
        const spy = vi.fn();
        revalidateArticlePaths(spy, 'cptsd');
        expect(spy).toHaveBeenCalledWith('/philosophy');
        expect(spy).toHaveBeenCalledWith('/philosophy/cptsd');
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('also revalidates the previous slug on a rename', () => {
        const spy = vi.fn();
        revalidateArticlePaths(spy, 'new', 'old');
        expect(spy).toHaveBeenCalledWith('/philosophy/new');
        expect(spy).toHaveBeenCalledWith('/philosophy/old');
    });

    it('does not double-revalidate when the slug is unchanged', () => {
        const spy = vi.fn();
        revalidateArticlePaths(spy, 'same', 'same');
        expect(spy).toHaveBeenCalledTimes(2);
    });
});
