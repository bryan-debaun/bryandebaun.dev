import { publicOnly } from './content'

export function generateSitemap(baseUrl: string, items: Array<{ slug: string } & { private?: boolean }>) {
    const publicItems = publicOnly(items)
    const urls = publicItems.map((p) => `<url><loc>${baseUrl}/${p.slug}</loc></url>`).join('')
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
}
