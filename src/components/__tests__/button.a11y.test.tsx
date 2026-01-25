/* @vitest-environment jsdom */
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import axe from 'axe-core'
import Button from '../Button'

describe('Button accessibility', () => {
    it('has no a11y violations', async () => {
        const { container } = render(<Button>Test</Button>)
        const results = await axe.run(container)
        expect(results.violations).toHaveLength(0)
    })
})
