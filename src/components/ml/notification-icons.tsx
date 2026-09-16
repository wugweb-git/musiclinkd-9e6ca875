import {
  Calendar,
  Circle,
  MessageSquare,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Store,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { NotificationCategory } from "@/data/notifications";
import { categoryMeta } from "@/data/notifications";

const byName: Record<string, LucideIcon> = {
  target: Target,
  calendar: Calendar,
  message: MessageSquare,
  sliders: SlidersHorizontal,
  shield: ShieldCheck,
  star: Star,
  store: Store,
  settings: Settings,
};

/** The lucide icon a notification category carries. */
export function notificationIcon(category: NotificationCategory): LucideIcon {
  return byName[categoryMeta[category].icon] ?? Circle;
}
