import { useMemo } from "react";
import SearchPage from "./pages/SearchPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { usePathNavigation } from "./hooks/usePathNavigation";

const DETAIL_ROUTE = /^\/deskove-hry\/([^/]+)\/?$/i;

const buildDetailPath = (slug: string) =>
  `/deskove-hry/${encodeURIComponent(slug)}`;

const App = () => {
  const { path, navigate } = usePathNavigation();

  const productSlug = useMemo(() => {
    const match = path.match(DETAIL_ROUTE);
    return match ? decodeURIComponent(match[1]) : null;
  }, [path]);

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
