import { readFileSync } from 'fs'
import path from 'path'
import { describe, it, expect } from 'vitest'

describe('global styles', () => {
    it('ensures h2 headings are uppercase', () => {
        const filePath = path.resolve(process.cwd(), 'src', 'app', 'globals.css')
        const src = readFileSync(filePath, 'utf8')
        expect(src).toContain('h2')
        expect(src).toContain('text-transform: uppercase')
    })
})
