import type { Translator } from "../../types/i18n";
import type { ProductSeries } from "../../types/product";

interface ProductDataSummaryProps {
  product: ProductSeries;
  t: Translator;
}

export const ProductDataSummary = ({ product, t }: ProductDataSummaryProps) => (
  <article className="rounded-lg border border-line bg-white p-6 shadow-sm">
    <h2 className="text-xl font-extrabold text-navy">{t("detailDataSummaryTitle")}</h2>
    <ul className="mt-4 list-disc space-y-3 pl-5 text-sm font-semibold text-muted">
      <li>{t("detailDataSummaryImages", { count: product.galleryImages?.length ?? 0 })}</li>
      <li>{t("detailDataSummarySellers", { count: product.sellers.length })}</li>
      <li>{t("detailDataSummaryCategories", { count: product.categoryTags.length })}</li>
    </ul>
  </article>
);
