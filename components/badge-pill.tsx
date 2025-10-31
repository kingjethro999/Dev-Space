import * as React from "react"
import { Badge as UIBadge } from "@/components/ui/badge"
import type { Badge as BadgeType } from "@/lib/badge-utils"
import {
  Hammer,
  MessageCircle,
  BookOpen,
  Flame,
  Users,
  Star,
  Trophy,
} from "lucide-react"

type Props = {
  badge: BadgeType
}

function getIconForBadge(badge: BadgeType) {
  switch (badge.category) {
    case "builder":
      return <Hammer className="w-3 h-3" />
    case "social":
      return <MessageCircle className="w-3 h-3" />
    case "journey":
      return <BookOpen className="w-3 h-3" />
    case "streak":
      return <Flame className="w-3 h-3 text-orange-500" />
    case "collab":
      return <Users className="w-3 h-3" />
    case "influence":
      return <Star className="w-3 h-3" />
    case "achievement":
      return <Trophy className="w-3 h-3" />
    default:
      return null
  }
}

function getVariantForBadge(badge: BadgeType): "default" | "secondary" | "outline" {
  switch (badge.category) {
    case "builder":
      return "default"
    case "social":
      return "secondary"
    case "streak":
      return "default"
    default:
      return "outline"
  }
}

export function BadgePill({ badge }: Props) {
  const icon = getIconForBadge(badge)
  const variant = getVariantForBadge(badge)
  return (
    <UIBadge variant={variant as any}>
      {icon}
      <span>{badge.name}</span>
    </UIBadge>
  )
}


