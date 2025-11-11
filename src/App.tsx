import { useMemo } from "react";
import SearchPage from "./pages/SearchPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { usePathNavigation } from "./hooks/usePathNavigation";

const DETAIL_ROUTE = /^\/deskove-hry\/([^/]+)\/?$/i;

const buildDetailPath = (code: string) =>
  `/deskove-hry/${encodeURIComponent(code)}`;

const App = () => {
  const { path, navigate, goBack } = usePathNavigation();

  const productCode = useMemo(() => {
    const match = path.match(DETAIL_ROUTE);
    return match ? decodeURIComponent(match[1]) : null;
  }, [path]);

  if (productCode) {
    return (
      <ProductDetailPage
        productCode={productCode}
        onBack={goBack}
        onNavigateHome={() => navigate("/")}
      />
    );
  }

  return (
    <SearchPage
      onProductNavigate={(code) => navigate(buildDetailPath(code))}
    />
  );
};

export default App;
