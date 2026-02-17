import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  process.env.DATABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = (process.env.VITE_SITE_URL || "https://www.deskovkylevne.com")
  .replace(/\/$/, "");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY for sitemap generation."
  );
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const PAGE_SIZE = 1000;
const TABLE_NAME = "catalog_slug_summary";

const formatLastmod = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

const buildUrl = (pathname) => `${SITE_URL}${pathname}`;

const fetchAllSlugs = async () => {
  const rows = [];
  let offset = 0;
  while (true) {
    const { data, error } = await client
      .from(TABLE_NAME)
      .select("product_name_normalized, latest_scraped_at")
      .order("product_name_normalized", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      throw new Error(error.message);
    }
    if (!data || data.length === 0) {
      break;
    }
    rows.push(...data);
    if (data.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }
  return rows;
};

const buildSitemapXml = (entries) => {
  const body = entries
    .map(({ loc, lastmod }) => {
      if (lastmod) {
        return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
      }
      return `  <url><loc>${loc}</loc></url>`;
    })
    .join("\n");
  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n` +
    `<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n` +
    `${body}\n` +
    `</urlset>\n`;
};

const run = async () => {
  const slugRows = await fetchAllSlugs();
  const entries = [];
  const staticPaths = ["/", "/levne-deskovky", "/deskove-hry"];
  staticPaths.forEach((pathname) => {
    entries.push({ loc: buildUrl(pathname), lastmod: null });
  });

  slugRows.forEach((row) => {
    const slug = row.product_name_normalized?.trim();
    if (!slug) {
      return;
    }
    const loc = buildUrl(`/deskove-hry/${encodeURIComponent(slug)}`);
    entries.push({ loc, lastmod: formatLastmod(row.latest_scraped_at) });
  });

  const xml = buildSitemapXml(entries);
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(__dirname, "..");
  const publicDir = path.join(rootDir, "public");
  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, "sitemap.xml"), xml, "utf8");
  console.log(`Sitemap generated with ${entries.length} URLs.`);
};

run().catch((error) => {
  console.error("Failed to generate sitemap:", error);
  process.exit(1);
});
