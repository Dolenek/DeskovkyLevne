import { useMemo } from "react";
import SearchPage from "./pages/SearchPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { usePathNavigation } from "./hooks/usePathNavigation";
import { LandingPage } from "./pages/landing/LandingPage";

const DETAIL_ROUTE = /^\/deskove-hry\/([^/]+)\/?$/i;
const LEVNE_ROUTE = "/levne-deskovky";
const DESKOVE_ROUTE = "/deskove-hry";

const buildDetailPath = (slug: string) =>
  `/deskove-hry/${encodeURIComponent(slug)}`;

const App = () => {
  const { path, navigate } = usePathNavigation();

  const productSlug = useMemo(() => {
    const match = path.match(DETAIL_ROUTE);
    return match ? decodeURIComponent(match[1]) : null;
  }, [path]);

  if (path === LEVNE_ROUTE) {
    return (
      <LandingPage
        variant="levne"
        onNavigateToProduct={(slug) => navigate(buildDetailPath(slug))}
        onNavigateHome={() => navigate("/")}
      />
    );
  }

  if (path === DESKOVE_ROUTE) {
    return (
      <LandingPage
        variant="deskove"
        onNavigateToProduct={(slug) => navigate(buildDetailPath(slug))}
        onNavigateHome={() => navigate("/")}
      />
    );
  }

  if (productSlug) {
    return (
      <ProductDetailPage
        productSlug={productSlug}
        onNavigateToProduct={(slug) => navigate(buildDetailPath(slug))}
        onNavigateHome={() => navigate("/")}
      />
    );
  }

  return (
    <SearchPage
      onProductNavigate={(slug) => navigate(buildDetailPath(slug))}
    />
  );
};

export default App;
