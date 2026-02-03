import { NextResponse } from 'next/server';
import { Api, ListRatingsResponse } from '@bryandebaun/mcp-client';
import { unwrapApiResponse } from '../../../../lib/api-response';

export function createApi() {
    const baseURL = process.env.MCP_BASE_URL || 'https://bad-mcp.onrender.com';
    return new Api({ baseURL });
}

export async function GET() {
    // Import the module namespace dynamically so tests can spy on the exported `createApi` function.
    const mod = await import('./route');
    const api = mod.createApi();

    try {
        const res = await api.api.listRatings();
        // The generated client returns an AxiosResponse — normalize to the expected payload shape
        const payload = unwrapApiResponse<ListRatingsResponse>(res);
        return NextResponse.json(payload);
    } catch (e) {
        console.error('MCP: failed to fetch ratings', e);
        return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 502 });
    }
}
