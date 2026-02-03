#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const required = ['contentlayer2', 'tsx', 'swagger-typescript-api'];
const missing: string[] = [];
for (const pkg of required) {
    const p = path.join(process.cwd(), 'node_modules', pkg);
    if (!fs.existsSync(p)) missing.push(pkg);
}

if (missing.length > 0) {
    console.error('Missing required devDependencies:', missing.join(', '));
    console.error('\nCommon causes:');
    console.error(" - You have NODE_ENV=production set globally which prevents devDependencies from being installed by npm");
    console.error(" - You haven't run 'npm ci' or 'npm install' yet");

    console.error('\nFixes:');
    console.error(" - Run: npm ci --include=dev");
    console.error(" - Or install missing packages: npm install --save-dev " + missing.join(' '));
    process.exit(1);
}

console.log('All required devDependencies are installed.');
process.exit(0);
