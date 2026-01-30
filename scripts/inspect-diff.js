import fs from 'fs'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const base = './gh_artifacts/diffs/about-desktop-light-baseline.png'
const cur = './gh_artifacts/diffs/about-desktop-light-current.png'
const diff = './gh_artifacts/diffs/about-desktop-light-diff.png'

const a = PNG.sync.read(fs.readFileSync(base))
const b = PNG.sync.read(fs.readFileSync(cur))

console.log('base size', a.width, a.height)
console.log('cur  size', b.width, b.height)

const width = Math.max(a.width, b.width)
const height = Math.max(a.height, b.height)

function padImage(img, width, height) {
    if (img.width === width && img.height === height) return img
    const outImg = new PNG({ width, height })
    // fill transparent
    for (let i = 0; i < outImg.data.length; i++) outImg.data[i] = 0
    // copy rows
    for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
            const srcIdx = (img.width * y + x) << 2
            const dstIdx = (width * y + x) << 2
            outImg.data[dstIdx] = img.data[srcIdx]
            outImg.data[dstIdx + 1] = img.data[srcIdx + 1]
            outImg.data[dstIdx + 2] = img.data[srcIdx + 2]
            outImg.data[dstIdx + 3] = img.data[srcIdx + 3]
        }
    }
    return outImg
}

const aP = padImage(a, width, height)
const bP = padImage(b, width, height)

const out = new PNG({ width, height })
const mismatched = pixelmatch(aP.data, bP.data, out.data, width, height, { threshold: 0.1 })
const ratio = mismatched / (width * height)
console.log('mismatched', mismatched, 'ratio', ratio)

// compute bounding box of non-transparent pixels in diff
let minX = width, minY = height, maxX = 0, maxY = 0
for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2
        const r = out.data[idx], g = out.data[idx + 1], b = out.data[idx + 2], aC = out.data[idx + 3]
        if (r || g || b || aC) {
            if (x < minX) minX = x
            if (y < minY) minY = y
            if (x > maxX) maxX = x
            if (y > maxY) maxY = y
        }
    }
}
if (minX <= maxX && minY <= maxY) {
    console.log('diff bbox', { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 })
    const rows = new Array(height).fill(0)
    for (let y = 0; y < height; y++) {
        let count = 0
        for (let x = 0; x < width; x++) {
            const idx = (width * y + x) << 2
            if (out.data[idx] || out.data[idx + 1] || out.data[idx + 2] || out.data[idx + 3]) count++
        }
        rows[y] = count
    }
    // print top 10 rows with most diffs
    const top = rows.map((c, i) => ({ row: i, count: c })).sort((a, b) => b.count - a.count).slice(0, 10)
    console.log('top diff rows', top)
} else {
    console.log('no diff bbox found')
}

fs.writeFileSync(diff, PNG.sync.write(out))
console.log('wrote diff to', diff)

