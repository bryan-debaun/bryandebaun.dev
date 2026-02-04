export function normalizeIsbn(raw?: string | null): string | null {
    if (!raw) return null;
    const s = String(raw).replace(/[^0-9Xx]/g, '').toUpperCase();
    if (s.length === 10) return toIsbn13(s);
    if (s.length === 13) return s;
    return null;
}

function toIsbn13(isbn10: string): string | null {
    if (!isValidIsbn10(isbn10)) return null;
    const core = '978' + isbn10.slice(0, 9);
    const check = computeIsbn13CheckDigit(core);
    return core + String(check);
}

function computeIsbn13CheckDigit(prefix12: string): number {
    const sum = prefix12.split('').map(Number).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
    const mod = sum % 10;
    return mod === 0 ? 0 : 10 - mod;
}

export function isValidIsbn10(isbn10: string): boolean {
    if (!/^[0-9]{9}[0-9X]$/.test(isbn10)) return false;
    const sum = isbn10.split('').map((c, i) => {
        const v = c === 'X' ? 10 : Number(c);
        return v * (10 - i);
    }).reduce((a, b) => a + b, 0);
    return sum % 11 === 0;
}

export function isValidIsbn13(isbn13: string): boolean {
    if (!/^[0-9]{13}$/.test(isbn13)) return false;
    const sum = isbn13.split('').map(Number).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
    return sum % 10 === 0;
}

export function isValidIsbn(raw?: string | null): boolean {
    const n = normalizeIsbn(raw);
    return !!n && isValidIsbn13(n);
}