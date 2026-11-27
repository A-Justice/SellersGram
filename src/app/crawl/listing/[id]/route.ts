import { getListingOgFields } from "@/lib/server/listing-og-meta";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Minimal HTML with OG tags in the real head.
 * Social crawlers are rewritten here — App Router can stream meta after
 * head closes (loading.tsx / Suspense), which Facebook ignores.
 */
export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const og = await getListingOgFields(id);
  const title = escapeHtml(`${og.title} · Vendors Gram`);
  const description = escapeHtml(og.description);
  const url = escapeHtml(og.url);
  const image = escapeHtml(og.image);
  const alt = escapeHtml(og.alt);

  const html = `<!DOCTYPE html>
<html lang="en-GH">
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<meta name="description" content="${description}"/>
<link rel="canonical" href="${url}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="Vendors Gram"/>
<meta property="og:locale" content="en_GH"/>
<meta property="og:url" content="${url}"/>
<meta property="og:title" content="${escapeHtml(og.title)}"/>
<meta property="og:description" content="${description}"/>
<meta property="og:image" content="${image}"/>
<meta property="og:image:secure_url" content="${image}"/>
<meta property="og:image:type" content="image/jpeg"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="${alt}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${escapeHtml(og.title)}"/>
<meta name="twitter:description" content="${description}"/>
<meta name="twitter:image" content="${image}"/>
</head>
<body>
<a href="${url}">View listing on Vendors Gram</a>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=300",
    },
  });
}
