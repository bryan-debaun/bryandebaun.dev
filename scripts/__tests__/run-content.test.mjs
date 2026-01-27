import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'



beforeEach(() => {
    vi.restoreAllMocks()
})

afterEach(() => {
    vi.unmock('child_process')
    vi.restoreAllMocks()
})

function createManualProcess() {
    let dataCb
    let stdErrCb
    let errorCb
    let closeCb
    const cp = {
        stdout: { on: (ev, cb) => { if (ev === 'data') dataCb = cb } },
        stderr: { on: (ev, cb) => { if (ev === 'data') stdErrCb = cb } },
        on: (ev, cb) => {
            if (ev === 'close') closeCb = cb
            if (ev === 'error') errorCb = cb
        }
    }
    cp._emitData = (d) => { if (dataCb) dataCb(Buffer.from(d)) }
    cp._emitStderr = (d) => { if (stdErrCb) stdErrCb(Buffer.from(d)) }
    cp._emitError = (e) => { if (errorCb) errorCb(e) }
    cp._emitClose = (code) => { if (closeCb) closeCb(code) }
    return cp
}

describe('runContent', () => {
    it('resolves when index file contains docs', async () => {
        const cp = createManualProcess()
        vi.spyOn(fs, 'existsSync').mockReturnValue(true)
        vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify([{}]))
        const mod = await import('../run-content.js')
        const { runContentWithSpawn } = mod.default || mod
        const p = runContentWithSpawn(() => cp)
        cp._emitClose(0)
        await expect(p).resolves.toBe(0)
    })

    it('rejects when no docs and non-zero exit', async () => {
        const cp = createManualProcess()
        vi.spyOn(fs, 'existsSync').mockReturnValue(false)
        const mod = await import('../run-content.js')
        const { runContentWithSpawn } = mod.default || mod
        const p = runContentWithSpawn(() => cp)
        cp._emitClose(2)
        await expect(p).rejects.toMatchObject({ code: 2 })
    })

    it('rejects on spawn error', async () => {
        const err = new Error('spawn failed')
        const cp = createManualProcess()
        const mod = await import('../run-content.js')
        const { runContentWithSpawn } = mod.default || mod
        const p = runContentWithSpawn(() => cp)
        cp._emitError(err)
        await expect(p).rejects.toMatchObject({ code: 1 })
    })
})