import { useEffect, useRef, useState, type ImgHTMLAttributes, type SyntheticEvent } from "react";
import { SkeletonBlock } from "./SkeletonBlock";
import { sanitizeImageUrl } from "../../utils/urls";

interface SkeletonImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  skeletonClassName?: string;
}

const combineClassNames = (...classNames: Array<string | undefined>) =>
  classNames.filter(Boolean).join(" ");

export const SkeletonImage = ({
  className,
  skeletonClassName,
  onError,
  onLoad,
  src,
  ...imageProps
}: SkeletonImageProps) => {
  const [imageSettled, setImageSettled] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const safeSource = typeof src === "string" ? sanitizeImageUrl(src) ?? undefined : undefined;

  useEffect(() => {
    setImageSettled(!safeSource);
    const currentImage = imageRef.current;
    if (safeSource && currentImage?.complete) {
      setImageSettled(true);
    }
  }, [safeSource]);

  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    setImageSettled(true);
    onLoad?.(event);
  };

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    setImageSettled(true);
    onError?.(event);
  };

  return (
    <>
      {!imageSettled ? <SkeletonBlock className={combineClassNames("absolute inset-0", skeletonClassName)} /> : null}
      <img
        {...imageProps}
        ref={imageRef}
        src={safeSource}
        onError={handleImageError}
        onLoad={handleImageLoad}
        className={combineClassNames(
          "transition-opacity duration-200",
          imageSettled ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </>
  );
};
