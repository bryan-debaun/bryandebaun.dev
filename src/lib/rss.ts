/**
 * Build an RSS 2.0 feed XML string from a list of items.
 *
 * Items are expected to be already-public (the writing feed sources
 * `published` articles from the MCP Articles API, so there are no private
 * entries to filter). Each item provides the full link path relative to the
 * site root via `slug` (e.g. `writing/cptsd`).
 */
export function generateRSS(
    baseUrl: string,
    items: Array<{ title: string; slug: string }>,
) {
    const itemsXml = items
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
