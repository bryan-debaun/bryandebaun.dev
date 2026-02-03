import { readFileSync } from 'fs'
import path from 'path'
import { describe, it, expect } from 'vitest'

describe('Books page static checks', () => {
    it('fetches from the MCP books API', () => {
        const filePath = path.resolve(process.cwd(), 'src', 'app', 'books', 'page.tsx')
        const src = readFileSync(filePath, 'utf8')
        expect(src).toContain('/api/mcp/books')
    })
})
