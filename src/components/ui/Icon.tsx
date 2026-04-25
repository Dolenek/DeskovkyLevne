import {
  ArrowRight,
  BarChart3,
  Bell,
  Box,
  Check,
  ChevronDown,
  Clock,
  Dice5,
  ExternalLink,
  Filter,
  Grid2X2,
  Heart,
  Info,
  List,
  Package,
  RefreshCw,
  Search,
  Shield,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Tag,
  ThumbsUp,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import type { SVGProps } from "react";

export type IconName =
  | "arrowRight"
  | "barChart"
  | "bell"
  | "box"
  | "cart"
  | "check"
  | "chevronDown"
  | "clock"
  | "dice"
  | "external"
  | "filter"
  | "grid"
  | "heart"
  | "info"
  | "list"
  | "package"
  | "refresh"
  | "search"
  | "shield"
  | "spark"
  | "star"
  | "store"
  | "tag"
  | "thumbsUp"
  | "trash"
  | "trophy"
  | "users";

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

const iconMap = {
  arrowRight: ArrowRight,
  barChart: BarChart3,
  bell: Bell,
  box: Box,
  cart: ShoppingCart,
  check: Check,
  chevronDown: ChevronDown,
  clock: Clock,
  dice: Dice5,
  external: ExternalLink,
  filter: Filter,
  grid: Grid2X2,
  heart: Heart,
  info: Info,
  list: List,
  package: Package,
  refresh: RefreshCw,
  search: Search,
  shield: Shield,
  spark: Sparkles,
  star: Star,
  store: Store,
  tag: Tag,
  thumbsUp: ThumbsUp,
  trash: Trash2,
  trophy: Trophy,
  users: Users,
} satisfies Record<IconName, typeof ArrowRight>;

export const Icon = ({ name, className = "", ...props }: IconProps) => {
  const LucideIcon = iconMap[name];

  return <LucideIcon className={className} aria-hidden="true" {...props} />;
};
