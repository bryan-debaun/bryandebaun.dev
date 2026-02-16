import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

async function run(url: string, outPath: string) {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(url, { waitUntil: 'networkidle' });
    // Stabilize fonts/layout a little
    await page.waitForTimeout(200);
    const buffer = await page.screenshot({ fullPage: true });
    await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
    await fs.promises.writeFile(outPath, buffer);
    await browser.close();
    console.log('Wrote baseline to', outPath);
}

if (require.main === module) {
    const url = process.argv[2] || 'http://localhost:3000/visual-snap';
    const out = process.argv[3] || 'tests/visual/baselines/visual-snap-desktop-light.png';
    run(url, out).catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
