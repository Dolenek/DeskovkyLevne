import { saveScrollPosition, useScrollRestoration } from "./useScrollRestoration";
import { useCallback, useEffect, useState } from "react";

interface NavigateOptions {
  replace?: boolean;
}

const normalizePath = (value: string): string => {
  if (!value) {
    return "/";
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }
  const [pathname, search] = trimmed.split(/\?(.*)/s);
  return (pathname.replace(/\/+$/, "") || "/") + (search === undefined ? "" : `?${search}`);
};

const readPath = (): string => {
  if (typeof window === "undefined") {
    return "/";
  }
  return normalizePath(window.location.pathname + window.location.search);
};

export const usePathNavigation = () => {
  const [path, setPath] = useState<string>(() => readPath());
  const [navigationKey, setNavigationKey] = useState(0);
  useScrollRestoration(navigationKey);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handlePopState = () => {
      setPath(readPath());
      setNavigationKey((current) => current + 1);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((target: string, options?: NavigateOptions) => {
    const normalized = normalizePath(target);
    setNavigationKey((current) => current + 1);
    if (typeof window === "undefined") {
      setPath(normalized);
      return;
    }

    if (options?.replace) {
      window.history.replaceState(window.history.state, "", normalized);
    } else {
      saveScrollPosition();
      window.history.pushState({ scrollY: 0 }, "", normalized);
    }
    setPath(normalized);
  }, []);

  return { path, navigate, navigationKey };
};
