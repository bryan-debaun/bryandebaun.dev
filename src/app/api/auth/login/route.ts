import { NextResponse, type NextRequest } from 'next/server';
import { Api } from '@bryandebaun/mcp-client';
import type { AxiosError } from 'axios';

export async function POST(req: NextRequest) {
    const debug = process.env.DEBUG_AUTH === '1' || (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH !== '0');

    try {
        const body = await req.json();
        const maskedEmail = typeof body?.email === 'string' ? body.email.replace(/(.{2}).+(@.+)/, '$1***$2') : undefined;

        if (debug) {
            console.info('auth.login: attempting password login', { email: maskedEmail });
        }

        // Login endpoint doesn't need cookie forwarding (creates new session)
        const baseURL = (process.env.MCP_BASE_URL || 'https://bad-mcp.onrender.com').replace(/\/+$/u, '');
        const api = new Api({
            baseURL,
            headers: {
                'Accept': 'application/json',
                'User-Agent': process.env.MCP_USER_AGENT || 'bryandebaun.dev'
            }
        });

        if (debug) {
            console.info('auth.login: calling MCP API', { baseURL, endpoint: '/api/auth/password/login' });
        }

        // Call API directly to access response headers
        const response = await api.api.passwordLogin(body);

        if (debug) {
            console.info('auth.login: received response from MCP', { status: response.status });
        }

        // Extract Set-Cookie headers from MCP response
        const setCookieHeader = response.headers['set-cookie'];
        const responseHeaders = new Headers();
        if (setCookieHeader) {
            if (Array.isArray(setCookieHeader)) {
                setCookieHeader.forEach(cookie => responseHeaders.append('Set-Cookie', cookie));
            } else {
                responseHeaders.set('Set-Cookie', setCookieHeader);
            }
        }

        if (debug) {
            console.info('auth.login: login successful', { hasCookie: !!setCookieHeader });
        }

        return NextResponse.json(response.data, { status: response.status, headers: responseHeaders });
    } catch (e) {
        const axiosError = e as AxiosError;
        const status = axiosError.response?.status ?? 502;
        const errorData = axiosError.response?.data ?? { error: 'Failed to login' };

        if (debug) {
            console.error('Auth login proxy failed', {
                status,
                error: axiosError.message,
                data: errorData,
                code: axiosError.code
            });
        } else {
            console.error('Auth login proxy failed', { status, code: axiosError.code });
        }

        return NextResponse.json(errorData, { status });
    }
}
