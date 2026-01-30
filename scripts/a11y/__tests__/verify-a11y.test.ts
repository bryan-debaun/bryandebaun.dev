import { describe, it, expect } from 'vitest'
import { pagesToAudit } from '../verify-a11y'

describe('a11y verify script', () => {
    it('exports the expected pages list', () => {
        expect(Array.isArray(pagesToAudit)).toBe(true)
        expect(pagesToAudit).toContain('/')
        expect(pagesToAudit).toContain('/about')
        expect(pagesToAudit).toContain('/philosophy')
    })
})
