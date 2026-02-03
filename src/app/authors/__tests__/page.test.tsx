import { readFileSync } from 'fs'
import path from 'path'
import { describe, it, expect } from 'vitest'

describe('Authors page static checks', () => {
    it('fetches from the MCP authors API', () => {
        const filePath = path.resolve(process.cwd(), 'src', 'app', 'authors', 'page.tsx')
        const src = readFileSync(filePath, 'utf8')
        expect(src).toContain('/api/mcp/authors')
    })
})
