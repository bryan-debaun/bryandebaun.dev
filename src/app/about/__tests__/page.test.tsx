import { readFileSync } from 'fs'
import path from 'path'
import { describe, it, expect } from 'vitest'

describe('About page static checks', () => {
    it('includes a Why BAD section', () => {
        const filePath = path.resolve(process.cwd(), 'src', 'app', 'about', 'page.tsx')
        const src = readFileSync(filePath, 'utf8')
        expect(src).toContain('Why BAD')
    })
})