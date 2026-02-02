#!/usr/bin/env node
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const OPENAPI_URL = process.env.MCP_OPENAPI_URL || 'https://bad-mcp.onrender.com/docs/swagger.json'
const OUT_DIR = path.join(process.cwd(), 'packages', 'mcp-client', 'src')

function spawnCmd(cmd: string, args: string[]) {
    return new Promise<number>((resolve, reject) => {
        const cp = spawn(cmd, args, { shell: true, stdio: 'inherit', env: process.env })
        cp.on('error', (e) => reject(e))
        cp.on('close', (code) => resolve(typeof code === 'number' ? code : 1))
    })
}

async function main(): Promise<void> {
    try {
        if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

        console.log(`Downloading and generating MCP client from: ${OPENAPI_URL}`)

        // Use the installed CLI via npx. Output file will be src/api-client.ts
        const args = ['swagger-typescript-api', 'generate', '-p', OPENAPI_URL, '-o', OUT_DIR, '-n', 'api-client.ts', '--axios']
        const code = await spawnCmd('npx', args)
        if (code !== 0) process.exit(code)

        // Add a small index.ts that re-exports the generated client
        const idx = path.join(OUT_DIR, 'index.ts')
        if (!fs.existsSync(idx)) {
            fs.writeFileSync(idx, `export * from './api-client'
`, 'utf8')
            console.log('Wrote', path.relative(process.cwd(), idx))
        }

        console.log('MCP client generation complete. Output:', OUT_DIR)
        process.exit(0)
    } catch (e) {
        console.error('Failed to generate MCP client', e)
        process.exit(1)
    }
}

if (require.main === module) main()
