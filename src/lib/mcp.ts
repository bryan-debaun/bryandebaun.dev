import { Api } from '@bryandebaun/mcp-client';

export function createApi() {
    const baseURL = process.env.MCP_BASE_URL || 'https://bad-mcp.onrender.com';
    return new Api({ baseURL });
}
