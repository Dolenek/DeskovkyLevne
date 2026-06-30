import { SkeletonBlock } from "./SkeletonBlock";

const ProductDetailTopSkeleton = () => (
  <section className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_260px]">
    <div>
      <SkeletonBlock className="aspect-[4/3] w-full" />
      <div className="mt-4 flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonBlock key={index} className="h-20 w-24 flex-shrink-0" />
        ))}
      </div>
    </div>
    <section>
      <SkeletonBlock className="h-4 w-56 max-w-full" />
      <SkeletonBlock className="mt-5 h-11 w-4/5" />
      <SkeletonBlock className="mt-3 h-7 w-2/3" />
      <SkeletonBlock className="mt-5 h-4 w-full" />
      <SkeletonBlock className="mt-2 h-4 w-11/12" />
      <SkeletonBlock className="mt-6 h-28 w-full" />
      <SkeletonBlock className="mt-6 h-12 w-full" />
    </section>
    <aside className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <SkeletonBlock className="h-5 w-32" />
      <SkeletonBlock className="mt-5 h-8 w-24" />
      <SkeletonBlock className="mt-4 h-4 w-full" />
      <SkeletonBlock className="mt-3 h-4 w-3/4" />
    </aside>
  </section>
);

const ProductDetailLowerSkeleton = () => (
  <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
    {Array.from({ length: 3 }, (_, index) => (
      <article key={index} className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <SkeletonBlock className="h-7 w-48 max-w-full" />
        <SkeletonBlock className="mt-5 h-4 w-full" />
        <SkeletonBlock className="mt-3 h-4 w-11/12" />
        <SkeletonBlock className="mt-3 h-4 w-3/4" />
      </article>
    ))}
  </section>
);

export const ProductDetailSkeleton = () => (
  <div aria-label="Nacitani detailu produktu" role="status" className="flex flex-col gap-8">
    <ProductDetailTopSkeleton />
    <SkeletonBlock className="h-[360px] w-full" />
    <section>
      <SkeletonBlock className="mb-5 h-8 w-64 max-w-full" />
      <SkeletonBlock className="h-52 w-full" />
    </section>
    <ProductDetailLowerSkeleton />
  </div>
);
