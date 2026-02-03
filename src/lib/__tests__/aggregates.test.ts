import { describe, it, expect } from 'vitest'
import { averageByKey } from '../aggregates'

describe('averageByKey', () => {
    it('computes average grouped by key', () => {
        const items = [
            { bookId: 1, rating: 10 },
            { bookId: 1, rating: 8 },
            { bookId: 2, rating: 7 },
        ]

        const map = averageByKey(items, x => x.bookId, x => x.rating)
        expect(map.get(1)).toBe(9)
        expect(map.get(2)).toBe(7)
    })

    it('ignores non-numeric values', () => {
        const items = [
            { id: 'a', value: 5 },
            { id: 'a', value: NaN as unknown as number },
            { id: 'b', value: 3 },
        ] as unknown as Array<{ id: string; value?: number }>

        const map = averageByKey(items, x => x.id, x => x.value)
        expect(map.get('a')).toBe(5)
        expect(map.get('b')).toBe(3)
    })
})
