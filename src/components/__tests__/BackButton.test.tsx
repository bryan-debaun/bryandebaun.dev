import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

const back = vi.fn();
const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ back, push }) }));

import BackButton from '../BackButton';

describe('BackButton', () => {
    afterEach(() => {
        vi.clearAllMocks();
        // Reset history state
        window.history.pushState({}, '', '/');
        // Remove any extra entries by replacing state (cannot easily reduce length)
    });

    it('calls router.back when history length > 1', () => {
        // Add an entry to history so length > 1
        window.history.pushState({}, '', '/foo');
        render(<BackButton fallbackHref="/fallback">Back</BackButton>);
        fireEvent.click(screen.getByRole('button', { name: /go back/i }));
        expect(back).toHaveBeenCalled();
        expect(push).not.toHaveBeenCalled();
    });

    it('pushes fallback when history length <= 1', () => {
        const originalHistory = window.history;
        Object.defineProperty(window, 'history', { value: { ...originalHistory, length: 1 }, configurable: true });
        try {
            render(<BackButton fallbackHref="/fallback">Back</BackButton>);
            fireEvent.click(screen.getByRole('button', { name: /go back/i }));
            expect(push).toHaveBeenCalledWith('/fallback');
            expect(back).not.toHaveBeenCalled();
        } finally {
            Object.defineProperty(window, 'history', { value: originalHistory });
        }
    });
});
