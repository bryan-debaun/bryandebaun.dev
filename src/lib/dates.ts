export function formatDate(iso?: string | null, { month = 'short' }: { month?: 'short' | 'long' } = {}): string {
    if (!iso) return '—';
    try {
        // Handle bare YYYY-MM-DD prefixes specially to avoid timezone shifts during UTC parsing.
        const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
        let d: Date;
        if (m) {
            const y = Number(m[1]);
            const mo = Number(m[2]);
            const day = Number(m[3]);
            d = new Date(y, mo - 1, day);
        } else {
            d = new Date(iso);
        }
        if (Number.isNaN(d.getTime())) return '—';
        return new Intl.DateTimeFormat('en-US', { year: 'numeric', month, day: 'numeric' }).format(d);
    } catch {
        return '—';
    }
}
