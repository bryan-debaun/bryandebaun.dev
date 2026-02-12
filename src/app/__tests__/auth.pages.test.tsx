import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import RegisterPage from '@/app/register/page';
import LoginPage from '@/app/login/page';
import { describe, it, expect, vi } from 'vitest';
import { AuthContext } from '@/lib/auth';

const pushMock = vi.fn();
// Mock Next app router hook used in pages
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));

describe('Auth pages', () => {
    it('renders register form', () => {
        render(<RegisterPage />);
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    it('renders login form', () => {
        render(<LoginPage />);
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows client validation errors for register and login', async () => {
        render(<RegisterPage />);
        const regBtn = screen.getByTestId('register-submit');
        fireEvent.click(regBtn);
        expect(await screen.findByText(/Email and password are required\./i)).toBeInTheDocument();

        // Clean up before rendering the next page to avoid duplicate messages in DOM
        cleanup();
        render(<LoginPage />);
        const loginBtn = screen.getByTestId('login-submit');
        fireEvent.click(loginBtn);
        expect(await screen.findByText(/Email and password are required\./i)).toBeInTheDocument();
    });

    it('register success redirects to /login', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => ({}) } as any);
        render(<RegisterPage />);
        fireEvent.change(screen.getByTestId('register-email'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('register-password'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByTestId('register-confirm'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByTestId('register-submit'));
        await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login'));
        fetchSpy.mockRestore();
    });

    it('login success calls refresh and redirects to /', async () => {
        const mockRefresh = vi.fn(async () => { });
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => ({}) } as any);
        render(
            <AuthContext.Provider value={{ user: null, refresh: mockRefresh, logout: async () => { }, isAuthenticated: false }}>
                <LoginPage />
            </AuthContext.Provider>
        );
        fireEvent.change(screen.getByTestId('login-email'), { target: { value: 'me@example.com' } });
        fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByTestId('login-submit'));
        await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
        await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'));
        fetchSpy.mockRestore();
    });
});
