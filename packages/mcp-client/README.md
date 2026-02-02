# MCP Client (generated)

This package will contain a generated, typed client for the MCP server OpenAPI spec.

Usage (after generation):

```ts
import { Api } from '@bryandebaun/mcp-client/src'

const api = new Api({ baseURL: 'https://bad-mcp.onrender.com' })
await api.books.getBooks()
```

To generate the client locally:

```bash
npm run generate:mcp-client
```

To customize the OpenAPI URL for testing, set `MCP_OPENAPI_URL` environment variable.
