interface SkeletonBlockProps {
  className?: string;
}

const combineClassNames = (...classNames: Array<string | undefined>) =>
  classNames.filter(Boolean).join(" ");

export const SkeletonBlock = ({ className }: SkeletonBlockProps) => (
  <div
    aria-hidden="true"
    className={combineClassNames(
      "animate-pulse rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200",
      className
    )}
  />
);
