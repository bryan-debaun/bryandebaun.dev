import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import EventEmitter from 'events'
import fs from 'fs'

let spawnMock = vi.fn()
vi.mock('child_process', () => ({ spawn: spawnMock }))

beforeEach(() => {
  spawnMock.mockReset()
})

afterEach(() => {
  vi.unmock('child_process')
  vi.restoreAllMocks()
})

function makeFakeProcess({ stdoutData = '', stderrData = '', closeCode = 0, emitError = null } = {}) {
  const cp = new EventEmitter()
  cp.stdout = new EventEmitter()
  cp.stderr = new EventEmitter()
  process.nextTick(() => {
    if (stdoutData) cp.stdout.emit('data', Buffer.from(stdoutData))
    if (stderrData) cp.stderr.emit('data', Buffer.from(stderrData))
    if (emitError) {
      cp.emit('error', emitError)
      // do not emit close after error to simulate failing spawn
      return
    }
    cp.emit('close', closeCode)
  })
  return cp
}

describe('runContent', () => {
  it('resolves when stdout reports generated docs', async () => {
    const cp = makeFakeProcess({ stdoutData: 'Generated 1 documents in .contentlayer' })
    spawnMock.mockReturnValue(cp)
    const mod = await import('../run-content.js')
    const { runContent } = mod.default || mod
    await expect(runContent()).resolves.toBe(0)
  })

  it('resolves when index file contains docs', async () => {
    const cp = makeFakeProcess({ closeCode: 1 })
    spawnMock.mockReturnValue(cp)
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify([{}]))
    const mod = await import('../run-content.js')
    const { runContent } = mod.default || mod
    await expect(runContent()).resolves.toBe(0)
  })

  it('rejects when no docs and non-zero exit', async () => {
    const cp = makeFakeProcess({ closeCode: 2 })
    spawnMock.mockReturnValue(cp)
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)
    const mod = await import('../run-content.js')
    const { runContent } = mod.default || mod
    await expect(runContent()).rejects.toMatchObject({ code: 2 })
  })

  it('rejects on spawn error', async () => {
    const err = new Error('spawn failed')
    const cp = makeFakeProcess({ emitError: err })
    spawnMock.mockReturnValue(cp)
    const mod = await import('../run-content.js')
    const { runContent } = mod.default || mod
    await expect(runContent()).rejects.toMatchObject({ code: 1 })
  })
})