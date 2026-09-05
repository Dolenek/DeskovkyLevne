import { useMemo } from "react";
import SearchPage from "./pages/SearchPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { usePathNavigation } from "./hooks/usePathNavigation";
import { LandingPage } from "./pages/landing/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { buildProductDetailPath, parseRoute, type AppRoute } from "./routing/routes";

type RouteNavigation = Pick<ReturnType<typeof usePathNavigation>, "path" | "navigate">;

const ProductDetailRoute = ({ slug, path, navigate }: RouteNavigation & { slug: string }) => (
  <ProductDetailPage
    productSlug={slug}
    onNavigateToProduct={(productSlug) => navigate(buildProductDetailPath(productSlug))}
    onNavigateHome={() => navigate("/")}
    onNavigatePath={navigate}
    onReplacePath={(targetPath) => navigate(targetPath, { replace: true })}
    activePath={path}
  />
);

const RouteContent = ({ route, path, navigate }: RouteNavigation & { route: AppRoute }) => {
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
    return <ProductDetailRoute slug={route.slug} path={path} navigate={navigate} />;
  }

  if (route.kind === "not-found") {
    return (
      <NotFoundPage
        path={route.path}
        onNavigateHome={() => navigate("/", { replace: true })}
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

const App = () => {
  const navigation = usePathNavigation();
  const route = useMemo(() => parseRoute(navigation.path), [navigation.path]);
  return <RouteContent route={route} {...navigation} />;
};

export default App;
