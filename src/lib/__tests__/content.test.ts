import { describe, it, expect } from 'vitest';
import { publicOnly } from '../content';

describe('publicOnly helper', () => {
    it('filters out items with private: true', () => {
        const items = [
            { id: 1, private: false },
            { id: 2, private: true },
            { id: 3 },
        ];
        const res = publicOnly(items);
        expect(res.map((r) => r.id)).toEqual([1, 3]);
    });
});
