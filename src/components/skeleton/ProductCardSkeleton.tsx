import { SkeletonBlock } from "./SkeletonBlock";

export const ProductCardSkeleton = () => (
  <article className="flex h-full flex-col rounded-lg border border-line bg-white p-4 shadow-sm">
    <SkeletonBlock className="aspect-[4/3] w-full" />
    <div className="mt-4 flex flex-1 flex-col">
      <SkeletonBlock className="h-5 w-5/6" />
      <SkeletonBlock className="mt-2 h-5 w-3/5" />
      <SkeletonBlock className="mt-4 h-4 w-2/3" />
      <SkeletonBlock className="mt-4 h-4 w-1/2" />
      <SkeletonBlock className="mt-4 h-8 w-2/3" />
      <SkeletonBlock className="mt-2 h-4 w-1/3" />
      <SkeletonBlock className="mt-5 h-10 w-full" />
    </div>
  </article>
);
