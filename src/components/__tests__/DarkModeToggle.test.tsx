import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DarkModeToggle from '../DarkModeToggle'
import { describe, it, expect, beforeEach } from 'vitest'

describe('DarkModeToggle', () => {
    beforeEach(() => {
        // Clear storage and classes
        if (typeof window !== 'undefined' && window.localStorage) window.localStorage.clear()
        if (typeof document !== 'undefined') document.documentElement.classList.remove('dark', 'light')
    })

    it('initializes from document class when present', async () => {
        document.documentElement.classList.add('dark')
        render(<DarkModeToggle />)
        const btn = screen.getByRole('switch')
        // state is applied in useEffect; wait for it
        const { waitFor } = await import('@testing-library/react')
        await waitFor(() => expect(btn).toHaveAttribute('aria-checked', 'true'))
    })

    it('clicking toggles document class and localStorage', async () => {
        const user = userEvent.setup()
        render(<DarkModeToggle />)
        const btn = screen.getByRole('switch')
        expect(btn).toHaveAttribute('aria-checked', 'false')

        const { waitFor } = await import('@testing-library/react')

        await user.click(btn)
        await waitFor(() => expect(btn).toHaveAttribute('aria-checked', 'true'))
        await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBeTruthy())
        expect(window.localStorage.getItem('theme')).toBe('dark')

        await user.click(btn)
        await waitFor(() => expect(btn).toHaveAttribute('aria-checked', 'false'))
        await waitFor(() => expect(document.documentElement.classList.contains('light')).toBeTruthy())
        expect(window.localStorage.getItem('theme')).toBe('light')
    })

    it('knob adds translate-x class when dark', async () => {
        const user = userEvent.setup()
        const { container } = render(<DarkModeToggle />)
        const btn = screen.getByRole('switch')
        const knob = container.querySelector('span.w-4') as Element
        expect(knob?.className).toContain('translate-x-0')

        const { waitFor } = await import('@testing-library/react')
        await user.click(btn)
        // knob should no longer have the zero-translate class and should contain some translate-x value
        await waitFor(() => expect(knob?.className).not.toContain('translate-x-0'))
        await waitFor(() => expect(knob?.className).toContain('translate-x-'))
    })

    it('syncs across multiple instances via themechange event', async () => {
        const user = userEvent.setup()
        render(
            <div>
                <DarkModeToggle />
                <DarkModeToggle />
            </div>
        )
        const switches = screen.getAllByRole('switch')
        expect(switches[0]).toHaveAttribute('aria-checked', 'false')
        expect(switches[1]).toHaveAttribute('aria-checked', 'false')

        const { waitFor } = await import('@testing-library/react')
        await user.click(switches[0])
        // the second switch should update in response to the event
        await waitFor(() => expect(switches[1]).toHaveAttribute('aria-checked', 'true'))
    })
})
