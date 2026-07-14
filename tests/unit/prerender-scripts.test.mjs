import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SITE_URL,
  rewritePrerenderOrigin,
} from "../../scripts/prerender-origin.mjs";
import { toFinitePrice } from "../../scripts/prerender-product-previews.mjs";

test("prerender origin uses the production default without changing relative assets", () => {
  const localOrigin = "http://localhost:4173";
  const html = [
    `<link rel="canonical" href="${localOrigin}/deskove-hry">`,
    `<meta property="og:url" content="${localOrigin}/deskove-hry">`,
    `<script type="application/ld+json">{"url":"${localOrigin}/deskove-hry"}</script>`,
    '<script type="module" src="/assets/app.js"></script>',
  ].join("");

  const rewritten = rewritePrerenderOrigin(html, localOrigin, DEFAULT_SITE_URL);

  assert.equal(rewritten.includes(localOrigin), false);
  assert.equal(rewritten.match(new RegExp(DEFAULT_SITE_URL, "g"))?.length, 3);
  assert.equal(rewritten.includes('src="/assets/app.js"'), true);
});

test("prerender origin accepts a custom deployment origin", () => {
  const rewritten = rewritePrerenderOrigin(
    '<link rel="canonical" href="http://localhost:4173/">',
    "http://localhost:4173/",
    "https://preview.example.com/"
  );

  assert.equal(
    rewritten,
    '<link rel="canonical" href="https://preview.example.com/">'
  );
});

test("SEO price parsing preserves zero and rejects missing or invalid values", () => {
  assert.equal(toFinitePrice(0), 0);
  assert.equal(toFinitePrice("0"), 0);
  assert.equal(toFinitePrice("499.90"), 499.9);
  assert.equal(toFinitePrice(null), null);
  assert.equal(toFinitePrice(undefined), null);
  assert.equal(toFinitePrice("  "), null);
  assert.equal(toFinitePrice("not-a-price"), null);
  assert.equal(toFinitePrice(-1), null);
});
