/* @vitest-environment jsdom */
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe, toHaveNoViolations } from 'jest-axe'
import Button from '../Button'

expect.extend(toHaveNoViolations)

describe('Button accessibility', () => {
    it('has no a11y violations', async () => {
        const { container } = render(<Button>Test</Button>)
        const results = await axe(container)
        expect(results).toHaveNoViolations()
    })
})
