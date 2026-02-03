function isPrivateValue(v: unknown): boolean {
    if (v == null) return false;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        return s === 'true' || s === 'yes' || s === '1';
    }
    return false;
}

export function publicOnly<T extends { private?: unknown }>(items: T[]): T[] {
    return items.filter((i) => !isPrivateValue(i.private));
}
