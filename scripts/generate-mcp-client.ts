#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const OPENAPI_URL = process.env.MCP_OPENAPI_URL || 'https://bad-mcp.onrender.com/docs/swagger.json';
const OUT_DIR = path.join(process.cwd(), 'packages', 'mcp-client', 'src');
const LOCAL_SPEC_PATHS = [
    path.join(process.cwd(), 'artifacts', 'openapi', 'bad-mcp.swagger.json'),
    path.join(process.cwd(), 'artifacts', 'openapi', 'bad-mcp.json'),
];

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function spawnCmdCapture(cmd: string, args: string[]) {
    return new Promise<{ code: number; stdout: string; stderr: string }>((resolve, reject) => {
        const cp = spawn(cmd, args, { shell: true, env: process.env });
        let stdout = '';
        let stderr = '';
        cp.stdout?.on('data', (d) => (stdout += d.toString()));
        cp.stderr?.on('data', (d) => (stderr += d.toString()));
        cp.on('error', (e) => reject(e));
        cp.on('close', (code) => resolve({ code: typeof code === 'number' ? code : 1, stdout, stderr }));
    });
}

async function tryGenerate(spec: string) {
    const args = ['exec', 'swagger-typescript-api', 'generate', '-p', spec, '-o', OUT_DIR, '-n', 'api-client.ts', '--axios'];
    return await spawnCmdCapture('pnpm', args);
}

async function downloadSpecWithAuth(url: string, outPath: string) {
    const apiKey = process.env.MCP_API_KEY;
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    console.log(`Fetching OpenAPI spec from ${url} ${apiKey ? '(using MCP_API_KEY header)' : ''}`);
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) throw new Error(`Failed to fetch spec: ${res.status} ${res.statusText}`);
    const text = await res.text();
    fs.writeFileSync(outPath, text, 'utf8');
    return outPath;
}

async function main(): Promise<void> {
    try {
        if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

        console.log(`Downloading and generating MCP client from: ${OPENAPI_URL}`);

        // If OPENAPI_URL is remote and an MCP_API_KEY is available, fetch the spec
        // using Authorization header and pass the local file to the generator.
        const isRemote = /^https?:\/\//i.test(OPENAPI_URL);
        let specToUse = OPENAPI_URL;
        if (isRemote && process.env.MCP_API_KEY) {
            try {
                const tmpPath = path.join(process.cwd(), 'artifacts', 'openapi', 'mcp-remote-spec.json');
                await downloadSpecWithAuth(OPENAPI_URL, tmpPath);
                specToUse = tmpPath;
                console.log('Using downloaded spec for generation:', specToUse);
            } catch (e) {
                console.warn('Failed to download remote spec with auth, will fall back to direct generation attempt:', (e as any).message);
                // fall through to attempt direct generation (existing behavior)
            }
        }

        // Try remote generation with retries (or local downloaded spec)
        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`Attempt ${attempt} of ${maxAttempts} using spec: ${specToUse}...`);
            const res = await tryGenerate(specToUse);
            if (res.code === 0) {
                console.log('MCP client generation complete. Output:', OUT_DIR);
                await ensureIndex();
                process.exit(0);
            }

            console.warn('Generation attempt failed:', res.stderr || res.stdout);
            if (attempt < maxAttempts) await delay(2000 * attempt);
        }

        // If remote generation failed, try local spec fallbacks (if present)
        for (const p of LOCAL_SPEC_PATHS) {
            if (fs.existsSync(p)) {
                console.log(`Remote fetch failed — falling back to local OpenAPI spec at: ${p}`);
                const res = await tryGenerate(p);
                if (res.code === 0) {
                    console.log('MCP client generation complete (from local spec). Output:', OUT_DIR);
                    await ensureIndex();
                    process.exit(0);
                }
                console.warn('Generation attempt failed (local spec):', res.stderr || res.stdout);
            }
        }

        console.error('Failed to generate MCP client after retries and local fallbacks. See previous logs for details.');
        process.exit(1);
    } catch (e) {
        console.error('Failed to generate MCP client', e);
        process.exit(1);
    }
}

async function ensureIndex() {
    const idx = path.join(OUT_DIR, 'index.ts');
    if (!fs.existsSync(idx)) {
        fs.writeFileSync(idx, `export * from './api-client'\n`, 'utf8');
        console.log('Wrote', path.relative(process.cwd(), idx));
    }
}

if (require.main === module) main();
