import { render, screen } from '@testing-library/react'
import WorkPassions from '../WorkPassions'
import { describe, it, expect } from 'vitest'

describe('WorkPassions component', () => {
    it('renders heading and descriptive paragraph', () => {
        render(<WorkPassions />)
        const heading = screen.getByRole('heading', { name: /Work & Passions/i })
        expect(heading).toBeInTheDocument()
        const paragraph = screen.getByText(/Selected work, passions, and advocacy are surfaced in the sections below\./i)
        expect(paragraph).toBeInTheDocument()
    })
})
