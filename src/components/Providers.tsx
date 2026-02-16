"use client";

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/lib/auth';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [client] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={client}>
            <AuthProvider>{children}</AuthProvider>
            {process.env.NODE_ENV === 'development' ? <ReactQueryDevtools initialIsOpen={false} /> : null}
        </QueryClientProvider>
    );
}
