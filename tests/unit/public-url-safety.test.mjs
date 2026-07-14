import assert from "node:assert/strict";
import test from "node:test";
import {
  absoluteImageUrl,
  sanitizeExternalHttpsUrl,
  sanitizeImageUrl,
} from "../../scripts/public-url-safety.mjs";

test("external links require credential-free HTTPS", () => {
  assert.equal(sanitizeExternalHttpsUrl("https://example.com/offer"), "https://example.com/offer");
  assert.equal(sanitizeExternalHttpsUrl("http://example.com/offer"), null);
  assert.equal(sanitizeExternalHttpsUrl("javascript:alert(1)"), null);
  assert.equal(sanitizeExternalHttpsUrl("https://user:pass@example.com"), null);
});

test("images allow HTTPS and local absolute paths", () => {
  assert.equal(sanitizeImageUrl("/logo.png"), "/logo.png");
  assert.equal(sanitizeImageUrl("https://cdn.example.com/image.jpg"), "https://cdn.example.com/image.jpg");
  assert.equal(sanitizeImageUrl("data:image/svg+xml,<svg>"), null);
  assert.equal(sanitizeImageUrl("//evil.example/image.jpg"), null);
  assert.equal(
    absoluteImageUrl("https://www.example.com", "/logo.png"),
    "https://www.example.com/logo.png"
  );
});
