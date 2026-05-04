import { BOARD_GAME_SCENE_ASSETS } from "./boardGameSceneAssets";

interface BoardGameVisualProps {
  variant?: "hero" | "compact";
}

export const BoardGameVisual = ({
  variant = "hero",
}: BoardGameVisualProps) => (
  <img
    src={BOARD_GAME_SCENE_ASSETS.heroTabletop}
    alt=""
    className={`pointer-events-none block select-none object-contain object-right mix-blend-multiply ${
      variant === "hero" ? "h-64 w-full max-w-xl" : "h-36 w-full"
    }`}
    loading="lazy"
  />
);
