import { Icon } from "./Icon";

interface BoardGameVisualProps {
  imageUrls?: string[];
  variant?: "hero" | "compact";
}

const pieceClasses = [
  "left-10 top-12 rotate-12 bg-primary text-white",
  "left-28 top-20 -rotate-12 bg-accent text-white",
  "right-16 top-8 rotate-6 bg-white text-navy",
  "bottom-8 right-28 -rotate-3 bg-emerald-100 text-primary",
];

export const BoardGameVisual = ({
  imageUrls = [],
  variant = "hero",
}: BoardGameVisualProps) => (
  <div
    className={`relative overflow-hidden rounded-lg border border-line bg-white shadow-sm ${
      variant === "hero" ? "h-56 w-full max-w-md" : "h-40 w-full"
    }`}
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(7,148,85,0.08),transparent_32%),radial-gradient(circle_at_80%_35%,rgba(249,115,22,0.10),transparent_30%)]" />
    {imageUrls.slice(0, 4).map((url, index) => (
      <img
        key={`${url}-${index}`}
        src={url}
        alt=""
        className={`absolute h-24 w-24 rounded-lg object-cover shadow-xl ${
          index === 0
            ? "left-12 top-10 -rotate-12"
            : index === 1
              ? "left-36 top-20 rotate-6"
              : index === 2
                ? "right-16 top-8 rotate-6"
                : "bottom-8 right-36 -rotate-3"
        }`}
      />
    ))}
    {imageUrls.length === 0
      ? pieceClasses.map((className, index) => (
          <span
            key={className}
            className={`absolute flex h-20 w-20 items-center justify-center rounded-lg shadow-xl ${className}`}
          >
            <Icon name={index === 2 ? "box" : "dice"} className="h-10 w-10" />
          </span>
        ))
      : null}
  </div>
);
