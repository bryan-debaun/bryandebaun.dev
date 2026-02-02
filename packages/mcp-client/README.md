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

To build the package for consumption by the main app (produces `dist/`):

```bash
cd packages/mcp-client
npm run build
```

To customize the OpenAPI URL for testing, set `MCP_OPENAPI_URL` environment variable.

CI validation

This repository includes a GitHub Actions workflow (`.github/workflows/verify-mcp-client.yml`) which runs on pull requests and ensures the generated files in `packages/mcp-client/src` are up-to-date. If the generated client would change, the workflow fails and asks contributors to run `npm run generate:mcp-client` and commit the changes.
