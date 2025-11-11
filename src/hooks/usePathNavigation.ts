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
  return trimmed.replace(/\/+$/, "");
};

const readPath = (): string => {
  if (typeof window === "undefined") {
    return "/";
  }
  return normalizePath(window.location.pathname);
};

export const usePathNavigation = () => {
  const [path, setPath] = useState<string>(() => readPath());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handlePopState = () => setPath(readPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback(
    (target: string, options?: NavigateOptions) => {
      const normalized = normalizePath(target);
      if (typeof window === "undefined") {
        setPath(normalized);
        return;
      }

      if (options?.replace) {
        window.history.replaceState({}, "", normalized);
      } else {
        window.history.pushState({}, "", normalized);
      }
      setPath(normalized);
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
      });
    },
    []
  );

  const goBack = useCallback(() => {
    if (typeof window === "undefined") {
      setPath("/");
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate("/", { replace: true });
  }, [navigate]);

  return { path, navigate, goBack };
};
