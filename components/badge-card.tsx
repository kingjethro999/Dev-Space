import * as React from "react"
import type { BadgePathProgress } from "@/lib/badge-utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Hammer, MessageCircle, BookOpen, Flame, Users, Star } from "lucide-react"

type Props = {
  progress: BadgePathProgress
}

function IconForCategory({ category }: { category: BadgePathProgress["category"] }) {
  const cls = "w-6 h-6"
  switch (category) {
    case "builder":
      return <Hammer className={cls} />
    case "social":
      return <MessageCircle className={cls} />
    case "journey":
      return <BookOpen className={cls} />
    case "streak":
      return <Flame className="w-6 h-6 text-orange-500" />
    case "collab":
      return <Users className={cls} />
    case "influence":
      return <Star className={cls} />
    default:
      return null
  }
}

export function BadgeCard({ progress }: Props) {
  const isMax = progress.isMax
  const barBg = isMax ? "bg-yellow-500" : "bg-primary"

  const content = (
    <div className="bg-card border border-border rounded-lg p-3 w-full flex flex-col items-center gap-2">
      <div className="text-sm font-bold text-foreground">{progress.title}</div>
      <div className="flex items-center justify-center rounded-full bg-accent w-12 h-12">
        <IconForCategory category={progress.category} />
      </div>
      <div className="text-xs text-muted-foreground text-center min-h-[1rem]">
        {progress.currentBadgeName || "—"}
      </div>
      <div className="w-full">
        <div className="h-2 w-full bg-accent/40 rounded-full overflow-hidden">
          <div className={`${barBg} h-2`} style={{ width: `${progress.percent}%` }} />
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground text-center break-words">
          {isMax ? (
            <span className="text-yellow-600 font-semibold">MAX</span>
          ) : (
            <>
              <span className="font-semibold text-foreground">{progress.value}</span>
              <span> / {progress.target}</span>
              {progress.nextBadgeName && (
                <span className="block truncate">→ {progress.nextBadgeName}</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )

  if (!isMax) return content

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>{content}</div>
      </TooltipTrigger>
      <TooltipContent>MAX</TooltipContent>
    </Tooltip>
  )
}


