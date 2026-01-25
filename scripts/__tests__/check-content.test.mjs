import { describe, it, expect, beforeEach, vi } from 'vitest'
import fs from 'fs'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('check-content main', () => {
  it('exits with code 1 when index is missing', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)
    const mod = await import('../check-content.js')
    const { main } = mod.default || mod
    const exit = vi.spyOn(process, 'exit').mockImplementation((code) => { throw new Error('exited ' + code) })
    expect(() => main()).toThrow('exited 1')
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('exits with code 1 when index empty', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('[]')
    const mod = await import('../check-content.js')
    const { main } = mod.default || mod
    const exit = vi.spyOn(process, 'exit').mockImplementation((code) => { throw new Error('exited ' + code) })
    expect(() => main()).toThrow('exited 1')
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('prints success when index has posts', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue('[{}]')
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const mod = await import('../check-content.js')
    const { main } = mod.default || mod
    main()
    expect(log).toHaveBeenCalledWith('Content check passed: 1 posts')
  })
})