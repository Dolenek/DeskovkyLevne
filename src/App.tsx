import { useMemo } from "react";
import SearchPage from "./pages/SearchPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { usePathNavigation } from "./hooks/usePathNavigation";
import { LandingPage } from "./pages/landing/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { buildProductDetailPath, parseRoute } from "./routing/routes";

const App = () => {
  const { path, navigate } = usePathNavigation();
  const route = useMemo(() => parseRoute(path), [path]);

  if (route.kind === "home" || route.kind === "landing-levne") {
    return (
      <LandingPage
        variant="levne"
        onNavigateToProduct={(slug) => navigate(buildProductDetailPath(slug))}
        onNavigateHome={() => navigate("/")}
        onNavigatePath={navigate}
        activePath={path}
      />
    );
  }

  if (route.kind === "detail") {
    return (
      <ProductDetailPage
        productSlug={route.slug}
        onNavigateToProduct={(slug) => navigate(buildProductDetailPath(slug))}
        onNavigateHome={() => navigate("/")}
        onNavigatePath={navigate}
        activePath={path}
      />
    );
  }

  if (route.kind === "not-found") {
    return (
      <NotFoundPage
        path={route.path}
        onNavigateHome={() => navigate("/", { replace: true })}
      />
    );
  }

  if (route.kind === "catalog") {
    return (
      <SearchPage
        onProductNavigate={(slug) => navigate(buildProductDetailPath(slug))}
        onNavigatePath={navigate}
        activePath={path}
      />
    );
  }

  return (
    <SearchPage
      onProductNavigate={(slug) => navigate(buildProductDetailPath(slug))}
      onNavigatePath={navigate}
      activePath={path}
    />
  );
};

export default App;
