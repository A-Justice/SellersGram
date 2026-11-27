import { getListingOgFields } from "@/lib/server/listing-og-meta";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Minimal HTML with Open Graph tags in the real &lt;head&gt; (Facebook docs).
 * Used by /crawl/listing/[id] and by proxy for social bots — App Router
 * otherwise streams meta after &lt;/head&gt;, which facebookexternalhit ignores.
 */
export async function renderListingCrawlHtml(id: string): Promise<string> {
  const og = await getListingOgFields(id);
  const title = escapeHtml(`${og.title} · Vendors Gram`);
  const description = escapeHtml(og.description);
  const url = escapeHtml(og.url);
  const image = escapeHtml(og.image);
  const alt = escapeHtml(og.alt);
  const ogTitle = escapeHtml(og.title);

  return `<!DOCTYPE html>
<html lang="en-GH">
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<meta name="description" content="${description}"/>
<link rel="canonical" href="${url}"/>
<meta property="og:url" content="${url}"/>
<meta property="og:type" content="website"/>
<meta property="og:title" content="${ogTitle}"/>
<meta property="og:description" content="${description}"/>
<meta property="og:image" content="${image}"/>
<meta property="og:image:url" content="${image}"/>
<meta property="og:image:secure_url" content="${image}"/>
<meta property="og:image:type" content="image/jpeg"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="${alt}"/>
<meta property="og:site_name" content="Vendors Gram"/>
<meta property="og:locale" content="en_GH"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${ogTitle}"/>
<meta name="twitter:description" content="${description}"/>
<meta name="twitter:image" content="${image}"/>
</head>
<body>
<a href="${url}">View listing on Vendors Gram</a>
</body>
</html>`;
}
