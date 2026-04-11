import { NextResponse, type NextRequest } from 'next/server';
import { Api } from '@bryandebaun/mcp-client';
import type { AxiosError } from 'axios';

export async function GET(req: NextRequest) {
    const debug = process.env.DEBUG_AUTH === '1' || (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH !== '0');

    try {
        const url = new URL(req.url);
        const token = url.searchParams.get('token');
        if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        if (debug) console.info('auth.magic-link.verify: GET verify', { token: `${token.slice(0, 6)}…` });

        // Verify endpoint doesn't need cookies (validates token and creates new session)
        const baseURL = (process.env.MCP_BASE_URL || 'https://bad-mcp.onrender.com').replace(/\/+$/u, '');
        const api = new Api({
            baseURL,
            headers: {
                'Accept': 'application/json',
                'User-Agent': process.env.MCP_USER_AGENT || 'bryandebaun.dev'
            }
        });

        const response = await api.api.verifyGet({ token });

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
            console.info('auth.magic-link.verify: success', { status: response.status });
        }

        return NextResponse.json(response.data, { status: response.status, headers: responseHeaders });
    } catch (e) {
        const axiosError = e as AxiosError;
        const status = axiosError.response?.status ?? 502;
        const errorData = axiosError.response?.data ?? { error: 'Failed to verify' };
        console.error('Auth magic-link verify GET proxy failed', e);
        return NextResponse.json(errorData, { status });
    }
}

export async function POST(req: NextRequest) {
    const debug = process.env.DEBUG_AUTH === '1' || (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH !== '0');

    try {
        const body = await req.json();
        const token = body?.token;
        if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        if (debug) console.info('auth.magic-link.verify: POST verify', { token: `${token.slice(0, 6)}…` });

        // Verify endpoint doesn't need cookies (validates token and creates new session)
        const baseURL = (process.env.MCP_BASE_URL || 'https://bad-mcp.onrender.com').replace(/\/+$/u, '');
        const api = new Api({
            baseURL,
            headers: {
                'Accept': 'application/json',
                'User-Agent': process.env.MCP_USER_AGENT || 'bryandebaun.dev'
            }
        });

        const response = await api.api.verifyPost({ token });

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
            console.info('auth.magic-link.verify: success', { status: response.status });
        }

        return NextResponse.json(response.data, { status: response.status, headers: responseHeaders });
    } catch (e) {
        const axiosError = e as AxiosError;
        const status = axiosError.response?.status ?? 502;
        const errorData = axiosError.response?.data ?? { error: 'Failed to verify' };
        console.error('Auth magic-link verify POST proxy failed', e);
        return NextResponse.json(errorData, { status });
    }
}
