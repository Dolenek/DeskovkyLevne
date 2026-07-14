import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import {
  DEFAULT_SITE_URL,
  rewritePrerenderOrigin,
} from "./prerender-origin.mjs";
import { generateProductPreviewPages } from "./prerender-product-previews.mjs";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  process.env.DATABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = (process.env.VITE_SITE_URL || DEFAULT_SITE_URL)
  .replace(/\/$/, "");
const PORT = Number(process.env.VITE_PRERENDER_PORT ?? "4173");
const HAS_SUPABASE_CREDENTIALS = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!HAS_SUPABASE_CREDENTIALS) {
  console.warn(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY; prerendering static routes only."
  );
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const client = HAS_SUPABASE_CREDENTIALS
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })
  : null;

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
      const stream = createReadStream(filePath);
      stream.on("error", () => {
        const fallbackPath = path.join(distDir, "index.html");
        res.writeHead(200, { "Content-Type": "text/html" });
        createReadStream(fallbackPath).pipe(res);
      });
      stream.on("open", () => {
        res.writeHead(200, {
          "Content-Type": mimeTypes[ext] ?? "application/octet-stream",
        });
      });
      stream.pipe(res);
    });
    server.listen(PORT, () => resolve(server));
  });

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

const prerenderStaticRoutes = async () => {
  const server = await serveDist();
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const prerenderOrigin = `http://localhost:${PORT}`;

  try {
    for (const routePath of ["/", "/levne-deskovky", "/deskove-hry"]) {
      const url = `${prerenderOrigin}${routePath}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForFunction(() => {
        const robots = document.querySelector('meta[name="robots"]');
        return robots?.getAttribute("content") === "index,follow";
      }, { timeout: 60000 });
      const html = rewritePrerenderOrigin(
        await page.content(),
        prerenderOrigin,
        SITE_URL
      );
      await writeHtmlForRoute(routePath, html);
      console.log(`Prerendered ${routePath}`);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
};

const prerender = async () => {
  const shellHtml = await readFile(path.join(distDir, "index.html"), "utf8");
  await prerenderStaticRoutes();
  await generateProductPreviewPages({
    client,
    distDir,
    shellHtml,
    siteUrl: SITE_URL,
  });
};

prerender().catch((error) => {
  console.error("Prerender failed:", error);
  process.exit(1);
});
