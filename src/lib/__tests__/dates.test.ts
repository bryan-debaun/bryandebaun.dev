import { describe, it, expect } from 'vitest';
import { formatDate } from '../dates';

describe('formatDate', () => {
    it('formats ISO date strings to human readable dates (short month)', () => {
        expect(formatDate('2024-02-03T12:34:56Z')).toBe('Feb 3, 2024');
    });

    it('formats using long month when requested', () => {
        expect(formatDate('2024-02-03T12:34:56Z', { month: 'long' })).toBe('February 3, 2024');
    });

    it('returns dash for falsy or invalid values', () => {
        expect(formatDate('')).toBe('—');
        expect(formatDate(undefined)).toBe('—');
        expect(formatDate('not a date')).toBe('—');
    });
});
