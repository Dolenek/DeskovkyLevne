import { useEffect, useMemo } from "react";
import type { LocaleKey } from "../i18n/translations";
import { buildAbsoluteUrl } from "../utils/urls";

interface SeoProps {
  title: string;
  description?: string | null;
  path?: string;
  imageUrl?: string | null;
  type?: "website" | "article" | "product";
  locale?: LocaleKey;
  noIndex?: boolean;
  keywords?: string[];
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE_NAME = "Deskovky Levně";
const JSON_LD_ID = "seo-jsonld";

const updateMetaTag = (
  attribute: "name" | "property",
  key: string,
  content?: string | null
): void => {
  if (typeof document === "undefined") {
    return;
  }
  const selector = `meta[${attribute}="${key}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (!content) {
    existing?.remove();
    return;
  }
  const element = existing ?? document.createElement("meta");
  element.setAttribute(attribute, key);
  element.setAttribute("content", content);
  if (!existing) {
    document.head.appendChild(element);
  }
};

const updateLinkTag = (rel: string, href?: string | null): void => {
  if (typeof document === "undefined") {
    return;
  }
  const selector = `link[rel="${rel}"]`;
  const existing = document.head.querySelector<HTMLLinkElement>(selector);
  if (!href) {
    existing?.remove();
    return;
  }
  const element = existing ?? document.createElement("link");
  element.setAttribute("rel", rel);
  element.setAttribute("href", href);
  if (!existing) {
    document.head.appendChild(element);
  }
};

const updateJsonLd = (
  data?: Record<string, unknown> | Record<string, unknown>[]
): void => {
  if (typeof document === "undefined") {
    return;
  }
  const existing = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
  if (!data) {
    existing?.remove();
    return;
  }
  const script = existing ?? document.createElement("script");
  script.type = "application/ld+json";
  script.id = JSON_LD_ID;
  script.text = JSON.stringify(data);
  if (!existing) {
    document.head.appendChild(script);
  }
};

const toOgLocale = (locale?: LocaleKey): string =>
  locale === "en" ? "en_US" : "cs_CZ";

interface MetaConfig {
  title: string;
  description?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  type: SeoProps["type"];
  locale: LocaleKey;
  noIndex: boolean;
  keywordContent?: string | null;
  structuredData?: SeoProps["structuredData"];
}

const useApplySeoTags = ({
  title,
  description,
  canonicalUrl,
  ogImage,
  type,
  locale,
  noIndex,
  keywordContent,
  structuredData,
}: MetaConfig) => {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.title = title;
    updateMetaTag("name", "description", description ?? null);
    updateMetaTag("name", "keywords", keywordContent);
    updateMetaTag("name", "robots", noIndex ? "noindex,nofollow" : "index,follow");
    updateLinkTag("canonical", canonicalUrl);

    updateMetaTag("property", "og:title", title);
    updateMetaTag("property", "og:description", description ?? null);
    updateMetaTag("property", "og:type", type);
    updateMetaTag("property", "og:url", canonicalUrl);
    updateMetaTag("property", "og:site_name", SITE_NAME);
    updateMetaTag("property", "og:image", ogImage);
    updateMetaTag("property", "og:locale", toOgLocale(locale));

    updateMetaTag("name", "twitter:card", ogImage ? "summary_large_image" : "summary");
    updateMetaTag("name", "twitter:title", title);
    updateMetaTag("name", "twitter:description", description ?? null);
    updateMetaTag("name", "twitter:image", ogImage);

    updateJsonLd(structuredData);
  }, [
    canonicalUrl,
    description,
    keywordContent,
    locale,
    noIndex,
    ogImage,
    structuredData,
    title,
    type,
  ]);
};

const useDocumentLanguage = (locale: LocaleKey) => {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.lang = locale === "en" ? "en" : "cs";
  }, [locale]);
};

export const Seo = ({
  title,
  description,
  path,
  imageUrl,
  type = "website",
  locale = "cs",
  noIndex = false,
  keywords,
  structuredData,
}: SeoProps) => {
  const canonicalUrl = useMemo(() => buildAbsoluteUrl(path ?? "/"), [path]);
  const ogImage = useMemo(() => buildAbsoluteUrl(imageUrl ?? null), [imageUrl]);
  const keywordContent = useMemo(() => {
    if (!keywords?.length) {
      return null;
    }
    return keywords
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .join(", ");
  }, [keywords]);

  useApplySeoTags({
    title,
    description,
    canonicalUrl,
    ogImage,
    type,
    locale,
    noIndex,
    keywordContent,
    structuredData,
  });

  useDocumentLanguage(locale);

  return null;
};
