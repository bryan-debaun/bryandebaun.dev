'use client';
import React, { createContext, useCallback, useEffect, useState } from 'react';

export type User = { id: number; email: string; isAdmin?: boolean } | null;

export type AuthContextType = {
    user: User;
    refresh: () => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
};

export const isUser = (u: unknown): u is NonNullable<User> =>
    !!u && typeof u === 'object' && typeof (u as Record<string, unknown>).id === 'number' && typeof (u as Record<string, unknown>).email === 'string';

export const AuthContext = createContext<AuthContextType>({
    user: null,
    refresh: async () => { },
    logout: async () => { },
    isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (!res.ok) {
                setUser(null);
                return;
            }
            const payload = await res.json();
            const u = payload?.user;
            setUser(isUser(u) ? u : null);
        } catch {
            setUser(null);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch { /* ignore */ }
        setUser(null);
        try { await refresh(); } catch { /* ignore */ }
    }, [refresh]);

    useEffect(() => {
        // perform an initial refresh on mount. Call async IIFE so state updates
        // occur outside the synchronous effect body and to satisfy lint rules.
        (async () => {
            await refresh();
        })();
    }, [refresh]);

    return (
        <AuthContext.Provider value={{ user, refresh, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}
