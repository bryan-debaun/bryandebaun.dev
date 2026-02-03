import { NextResponse } from 'next/server'
import { Api, ListAuthorsResponse } from '@bryandebaun/mcp-client'

export function createApi() {
    const baseURL = process.env.MCP_BASE_URL || 'https://bad-mcp.onrender.com'
    return new Api({ baseURL })
}

export async function GET() {
    // Import the module namespace dynamically so tests can spy on the exported `createApi` function.
    const mod = await import('./route')
    const api = mod.createApi()

    try {
        const res = await api.api.listAuthors()
        // The generated client returns an AxiosResponse — use the generated ListAuthorsResponse type
        const payload = ((res as unknown) as { data?: ListAuthorsResponse }).data ?? (res as unknown)
        return NextResponse.json(payload)
    } catch (e) {
        console.error('MCP: failed to fetch authors', e)
        return NextResponse.json({ error: 'Failed to fetch authors' }, { status: 502 })
    }
}
