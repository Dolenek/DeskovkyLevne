import type { ProductRow, ProductSeries } from "../../types/product";
import { compareSellerDrafts, updateDraftsWithRow } from "./draftBuilder";
import { finalizeProductDraft } from "./finalize";
import type { ProductDraft } from "./types";

const sortSeriesByLabel = (left: ProductSeries, right: ProductSeries) =>
  left.label.localeCompare(right.label, "cs");

export const buildProductSeries = (rows: ProductRow[]): ProductSeries[] => {
  const productDrafts = new Map<string, ProductDraft>();

  rows.forEach((row) => {
    updateDraftsWithRow(productDrafts, row);
  });

  const seriesList: ProductSeries[] = [];
  productDrafts.forEach((productDraft) => {
    const sortedSellers = Array.from(productDraft.sellers.values()).sort(
      compareSellerDrafts
    );
    const finalizedSeries = finalizeProductDraft(productDraft, sortedSellers);
    if (finalizedSeries) {
      seriesList.push(finalizedSeries);
    }
  });

  return seriesList.sort(sortSeriesByLabel);
};
