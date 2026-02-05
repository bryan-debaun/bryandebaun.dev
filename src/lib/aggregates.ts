/**
 * Generic helpers for aggregations.
 */

/**
 * Compute averages grouped by a key derived from each item.
 *
 * Example:
 *   averageByKey(items, x => x.bookId, x => x.rating)
 *
 * Returns a Map from key -> average (rounded to 0.1 precision as in `average`).
 */
export function averageByKey<T, K>(
    items: T[],
    keyFn: (item: T) => K,
    valueFn: (item: T) => number | undefined,
): Map<K, number> {
    const map = new Map<K, number[]>();

    for (const item of items) {
        const key = keyFn(item);
        const v = valueFn(item);
        if (typeof v !== 'number' || Number.isNaN(v)) continue;

        const arr = map.get(key) ?? [];
        arr.push(v);
        map.set(key, arr);
    }

    const result = new Map<K, number>();
    for (const [k, arr] of map.entries()) {
        const avg = average(arr);
        if (typeof avg === 'number') result.set(k, avg);
    }

    return result;
}
/**
 * Compute the average of a numeric array (rounded to 0.1 precision).
 */
export function average(values: number[]): number | undefined {
    if (!values || values.length === 0) return undefined;
    const sum = values.reduce((s, v) => s + v, 0);
    return Math.round((sum / values.length) * 10) / 10;
}