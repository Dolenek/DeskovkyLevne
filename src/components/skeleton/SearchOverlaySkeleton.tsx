import { SkeletonBlock } from "./SkeletonBlock";

const SearchOverlaySkeletonRow = () => (
  <li className="rounded-lg border border-line bg-white px-4 py-3 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-14 w-14 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <SkeletonBlock className="h-5 w-48 max-w-full" />
          <SkeletonBlock className="mt-2 h-4 w-28" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-7 w-20 rounded-full" />
        <SkeletonBlock className="h-7 w-24" />
      </div>
    </div>
  </li>
);

export const SearchOverlaySkeleton = () => (
  <div aria-label="Nacitani vysledku vyhledavani" role="status">
    <ul className="space-y-2">
      {Array.from({ length: 4 }, (_, index) => (
        <SearchOverlaySkeletonRow key={index} />
      ))}
    </ul>
  </div>
);
