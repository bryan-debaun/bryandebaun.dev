import { publicOnly } from './content';

export function generateRSS(baseUrl: string, items: Array<{ title: string; slug: string } & { private?: boolean }>) {
    const publicItems = publicOnly(items);
    const itemsXml = publicItems
        .map(
            (i) => `
  <item>
    <title>${i.title}</title>
    <link>${baseUrl}/${i.slug}</link>
  </item>`,
        )
        .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>${itemsXml}
</channel></rss>`;
}
