import { readFileSync } from 'fs'
import path from 'path'
import { describe, it, expect } from 'vitest'

describe('Blog page static checks', () => {
    it('filters out private posts', () => {
        const filePath = path.resolve(process.cwd(), 'src', 'app', 'blog', 'page.tsx')
        const src = readFileSync(filePath, 'utf8')
        expect(src).toContain('publicOnly(allPosts)')
    })
})
