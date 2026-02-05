import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';



beforeEach(() => {
    vi.restoreAllMocks();
});

afterEach(() => {
    vi.unmock('child_process');
    vi.restoreAllMocks();
});

function createManualProcess() {
    let dataCb;
    let stdErrCb;
    let errorCb;
    let closeCb;
    const cp = {
        stdout: { on: (ev, cb) => { if (ev === 'data') dataCb = cb; } },
        stderr: { on: (ev, cb) => { if (ev === 'data') stdErrCb = cb; } },
        on: (ev, cb) => {
            if (ev === 'close') closeCb = cb;
            if (ev === 'error') errorCb = cb;
        }
    };
    cp._emitData = (d) => { if (dataCb) dataCb(Buffer.from(d)); };
    cp._emitStderr = (d) => { if (stdErrCb) stdErrCb(Buffer.from(d)); };
    cp._emitError = (e) => { if (errorCb) errorCb(e); };
    cp._emitClose = (code) => { if (closeCb) closeCb(code); };
    return cp;
}

describe('runContent', () => {
    it('resolves when index file contains docs', async () => {
        const cp = createManualProcess();
        vi.spyOn(fs, 'existsSync').mockReturnValue(true);
        vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify([{}]));
        const mod = await import('../run-content.ts');
        vi.spyOn(mod.default || mod, 'normalizeContentFiles').mockReturnValue({ files: [], applied: [] });
        const { runContentWithSpawn } = mod.default || mod;
        const p = runContentWithSpawn(() => cp, { normalizeFn: () => ({ files: [], applied: [] }) });
        cp._emitClose(0);
        await expect(p).resolves.toBe(0);
    });

    it('rejects when no docs and non-zero exit', async () => {
        const cp = createManualProcess();
        vi.spyOn(fs, 'existsSync').mockReturnValue(false);
        const mod = await import('../run-content.ts');
        vi.spyOn(mod.default || mod, 'normalizeContentFiles').mockReturnValue({ files: [], applied: [] });
        const { runContentWithSpawn } = mod.default || mod;
        const p = runContentWithSpawn(() => cp, { normalizeFn: () => ({ files: [], applied: [] }) });
        cp._emitClose(2);
        await expect(p).rejects.toMatchObject({ code: 2 });
    });

    it('rejects on spawn error', async () => {
        const err = new Error('spawn failed');
        const cp = createManualProcess();
        const mod = await import('../run-content.ts');
        vi.spyOn(mod.default || mod, 'normalizeContentFiles').mockReturnValue({ files: [], applied: [] });
        const { runContentWithSpawn } = mod.default || mod;
        const p = runContentWithSpawn(() => cp, { normalizeFn: () => ({ files: [], applied: [] }) });
        cp._emitError(err);
        await expect(p).rejects.toMatchObject({ code: 1 });
    });

    it('does a dry-run by default and does not modify files', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mdx-test-'));
        const file = path.join(tmp, 'test.mdx');
        // Intentional CRLF and trailing spaces in YAML/value
        const content = '---\ntitle: "X"\nprivate: false \r\n---\r\n# Hello\r\n';
        fs.writeFileSync(file, content, 'utf8');
        const mod = await import('../run-content.ts');
        const { normalizeContentFiles } = mod.default || mod;
        // dry-run: should detect files but NOT modify
        const res = normalizeContentFiles(tmp, { apply: false, backup: true });
        expect(res.files.length).toBeGreaterThan(0);
        const s = fs.readFileSync(file, 'utf8');
        expect(s).toContain('\r');
        // apply changes explicitly
        const res2 = normalizeContentFiles(tmp, { apply: true, backup: true });
        expect(res2.applied.length).toBeGreaterThan(0);
        const s2 = fs.readFileSync(file, 'utf8');
        expect(s2).not.toContain('\r');
        // backup exists
        const bakGlob = fs.readdirSync(tmp).find((n) => n.endsWith('.bak'));
        expect(bakGlob).toBeTruthy();
        // cleanup
        fs.rmSync(tmp, { recursive: true, force: true });
    });

    it('rejects when normalization is required (dry-run) and no apply flag is set', async () => {
        const cp = createManualProcess();
        const mod = await import('../run-content.ts');
        // Force normalization to report change but not applied
        vi.spyOn(mod.default || mod, 'normalizeContentFiles').mockReturnValue({ files: ['src/content/philosophy/cptsd.mdx'], applied: [] });
        const { runContentWithSpawn } = mod.default || mod;
        // Force normalization required via explicit override
        const p = runContentWithSpawn(() => cp, { normalizeFn: () => ({ files: ['src/content/philosophy/cptsd.mdx'], applied: [] }) });
        await expect(p).rejects.toMatchObject({ code: 3 });
    });
});