const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const serializeJsonLd = (value) =>
  JSON.stringify(value).replace(/</g, "\\u003c");

const tag = (name, attrs) => {
  const attributes = Object.entries(attrs)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(" ");
  return `  <${name} ${attributes}>`;
};

const buildSeoHeadTags = (metadata) => {
  const imageAlt = metadata.imageUrl ? metadata.label : null;
  return [
    `  <title>${escapeHtml(metadata.title)}</title>`,
    tag("meta", { name: "description", content: metadata.description }),
    tag("meta", { name: "robots", content: "index,follow" }),
    tag("link", { rel: "canonical", href: metadata.canonicalUrl }),
    tag("meta", { property: "og:title", content: metadata.title }),
    tag("meta", { property: "og:description", content: metadata.description }),
    tag("meta", { property: "og:type", content: "product" }),
    tag("meta", { property: "og:url", content: metadata.canonicalUrl }),
    tag("meta", { property: "og:site_name", content: "Deskovky Levně" }),
    tag("meta", { property: "og:image", content: metadata.imageUrl }),
    tag("meta", { property: "og:image:alt", content: imageAlt }),
    tag("meta", { property: "og:locale", content: "cs_CZ" }),
    tag("meta", {
      name: "twitter:card",
      content: metadata.imageUrl ? "summary_large_image" : "summary",
    }),
    tag("meta", { name: "twitter:title", content: metadata.title }),
    tag("meta", { name: "twitter:description", content: metadata.description }),
    tag("meta", { name: "twitter:image", content: metadata.imageUrl }),
    tag("meta", { name: "twitter:image:alt", content: imageAlt }),
    `  <script type="application/ld+json" id="seo-jsonld">${serializeJsonLd(
      metadata.structuredData
    )}</script>`,
  ].join("\n");
};

const removeExistingSeoTags = (html) =>
  html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/\s*<meta\s+(?:name|property)=["'](?:description|keywords|robots|twitter:[^"']+|og:[^"']+)["'][^>]*>\s*/gi, "")
    .replace(/\s*<link\s+rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/\s*<script\s+type=["']application\/ld\+json["']\s+id=["']seo-jsonld["'][\s\S]*?<\/script>\s*/gi, "");

export const injectSeoTags = (html, metadata) => {
  const withoutSeo = removeExistingSeoTags(html);
  return withoutSeo.replace("</head>", `${buildSeoHeadTags(metadata)}\n</head>`);
};
