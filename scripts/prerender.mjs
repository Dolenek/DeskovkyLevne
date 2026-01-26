import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = (process.env.VITE_SITE_URL || "https://www.deskovkylevne.com")
  .replace(/\/$/, "");
const PRERENDER_LIMIT = Number(process.env.VITE_PRERENDER_LIMIT ?? "200");
const TABLE_NAME = "product_catalog_index";
const PORT = Number(process.env.VITE_PRERENDER_PORT ?? "4173");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY for prerender."
  );
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const serveDist = () =>
  new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
      let filePath = path.join(distDir, url.pathname);
      if (url.pathname.endsWith("/")) {
        filePath = path.join(filePath, "index.html");
      }

      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] ?? "application/octet-stream";
      const stream = createReadStream(filePath);
      stream.on("error", () => {
        const fallbackPath = path.join(distDir, "index.html");
        res.writeHead(200, { "Content-Type": "text/html" });
        createReadStream(fallbackPath).pipe(res);
      });
      stream.on("open", () => {
        res.writeHead(200, { "Content-Type": contentType });
      });
      stream.pipe(res);
    });
    server.listen(PORT, () => resolve(server));
  });

const fetchPrerenderSlugs = async () => {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await client
    .from(TABLE_NAME)
    .select("product_name_normalized, latest_scraped_at")
    .order("latest_scraped_at", { ascending: false })
    .limit(PRERENDER_LIMIT);
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? [])
    .map((row) => row.product_name_normalized?.trim())
    .filter(Boolean);
};

const buildRoutes = async () => {
  const slugs = await fetchPrerenderSlugs();
  const routes = ["/", "/levne-deskovky", "/deskove-hry"];
  slugs.forEach((slug) => {
    routes.push(`/deskove-hry/${encodeURIComponent(slug)}`);
  });
  return routes;
};

const ensureDir = async (targetPath) => {
  await mkdir(path.dirname(targetPath), { recursive: true });
};

const writeHtmlForRoute = async (routePath, html) => {
  const normalizedPath = routePath.replace(/^\/+/, "");
  const targetPath =
    routePath === "/"
      ? path.join(distDir, "index.html")
      : path.join(distDir, normalizedPath, "index.html");
  await ensureDir(targetPath);
  await writeFile(targetPath, html, "utf8");
};

const prerender = async () => {
  const routes = await buildRoutes();
  const server = await serveDist();
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();

  for (const routePath of routes) {
    const url = `http://localhost:${PORT}${routePath}`;
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const robots = document.querySelector('meta[name="robots"]');
      if (!robots) {
        return false;
      }
      return robots.getAttribute("content") === "index,follow";
    });
    const html = await page.content();
    await writeHtmlForRoute(routePath, html);
    console.log(`Prerendered ${routePath}`);
  }

  await browser.close();
  await new Promise((resolve) => server.close(resolve));
};

prerender().catch((error) => {
  console.error("Prerender failed:", error);
  process.exit(1);
});
