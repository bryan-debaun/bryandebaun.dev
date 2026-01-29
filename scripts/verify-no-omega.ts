#!/usr/bin/env node
import { exec } from 'child_process'
import type { ExecException } from 'child_process'

// Run `git grep -n "omega"` and fail if any matches are found.
exec('git grep -n "omega"', { maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' }, (err: ExecException | null, stdout: string) => {
    // git grep exits with code 1 when no matches are found
    if (err && err.code === 1) {
        console.log('No \"omega\" references found.')
        process.exit(0)
    }

    if (err) {
        console.error('Error running git grep:', err)
        process.exit(2)
    }

    if (stdout && stdout.trim().length) {
        // Filter out expected/intentional mentions (docs or this verifier itself)
        const lines = stdout.trim().split('\n')
        const filtered = lines.filter((l) => {
            // Ignore README.md and package.json, and this verifier itself
            if (l.startsWith('README.md:')) return false
            if (l.startsWith('package.json:')) return false
            if (l.startsWith('scripts/verify-no-omega.ts:')) return false
            // Ignore lines that reference the verifier name (script entry)
            if (l.includes('verify:no-omega')) return false
            return true
        })

        if (filtered.length) {
            console.error('Found repository references to "omega":')
            console.error(filtered.join('\n'))
            console.error('\nPlease remove or update these references to use the current wolf assets before merging.')
            process.exit(1)
        }

        console.log('Only intentional/documentation "omega" references were found; no actionable matches.')
        process.exit(0)
    }

    console.log('No "omega" references found.')
    process.exit(0)
})
