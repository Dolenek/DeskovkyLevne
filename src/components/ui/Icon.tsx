import {
  ArrowRight,
  BarChart3,
  Bell,
  Box,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  Filter,
  Grid2X2,
  Heart,
  List,
  RefreshCw,
  Search,
  Shield,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Tag,
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
  | "external"
  | "filter"
  | "grid"
  | "heart"
  | "list"
  | "refresh"
  | "search"
  | "shield"
  | "spark"
  | "star"
  | "store"
  | "tag"
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
  external: ExternalLink,
  filter: Filter,
  grid: Grid2X2,
  heart: Heart,
  list: List,
  refresh: RefreshCw,
  search: Search,
  shield: Shield,
  spark: Sparkles,
  star: Star,
  store: Store,
  tag: Tag,
  trash: Trash2,
  trophy: Trophy,
  users: Users,
} satisfies Record<IconName, typeof ArrowRight>;

export const Icon = ({ name, className = "", ...props }: IconProps) => {
  const LucideIcon = iconMap[name];

  return <LucideIcon className={className} aria-hidden="true" {...props} />;
};
