import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { SkeletonBlock } from "./SkeletonBlock";

interface CatalogSkeletonProps {
  itemCount?: number;
}

export const CatalogSkeleton = ({ itemCount = 8 }: CatalogSkeletonProps) => (
  <section aria-label="Nacitani produktu" role="status" className="flex flex-col gap-5">
    <div>
      <SkeletonBlock className="h-7 w-72 max-w-full" />
      <div className="mt-3 flex flex-wrap gap-2">
        <SkeletonBlock className="h-9 w-28" />
        <SkeletonBlock className="h-9 w-24" />
        <SkeletonBlock className="h-9 w-32" />
      </div>
    </div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: itemCount }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
    <SkeletonBlock className="h-12 w-full border border-dashed border-line" />
  </section>
);
