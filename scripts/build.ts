#!/usr/bin/env node
import { spawn } from 'child_process';

function spawnCmd(cmd: string, args: string[]) {
    return new Promise<number>((resolve, reject) => {
        const env = { ...(process.env as NodeJS.ProcessEnv), NODE_ENV: 'production' } as NodeJS.ProcessEnv;
        const cp = spawn(cmd, args, { shell: true, stdio: 'inherit', env });
        cp.on('error', (e) => reject(e));
        cp.on('close', (code) => resolve(typeof code === 'number' ? code : 1));
    });
}

export async function main(): Promise<void> {
    // Ensure the build runs with NODE_ENV=production for consistency across environments
    // Use an explicit cast to NodeJS.ProcessEnv to satisfy TypeScript and ESLint
    Object.assign(process.env as NodeJS.ProcessEnv, { NODE_ENV: 'production' });

    try {
        // Verify that required devDependencies are present (tsx, etc.) so the build won't fail if devDependencies were skipped.
        let code = await spawnCmd('pnpm', ['exec', 'tsx', 'scripts/check-dev-deps.ts']);
        if (code !== 0) process.exit(code);

        // Use pnpm exec to prefer the local next binary.
        // SPIKE #82: Turbopack for the production build.
        code = await spawnCmd('pnpm', ['exec', 'next', 'build', '--turbopack']);
        process.exit(code);
    } catch (e) {
        console.error('Build wrapper failed', e);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
