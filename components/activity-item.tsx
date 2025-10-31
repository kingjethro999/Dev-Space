"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getActivityMessage, formatDate } from "@/lib/activity-utils"

interface ActivityItemProps {
  activity: any
  user: any
}

export function ActivityItem({ activity, user }: ActivityItemProps) {
  if (!user) return null

  return (
    <div className="p-4 border border-border rounded-lg hover:bg-secondary transition-colors">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
          <AvatarFallback>{(user.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Link href={`/profile/${activity.user_id}`} className="font-semibold text-foreground hover:text-primary">
            {user.username}
          </Link>
          <p className="text-sm text-muted-foreground mt-1">{getActivityMessage(activity)}</p>
          <p className="text-xs text-muted-foreground mt-2">{formatDate(activity.created_at)}</p>
        </div>
      </div>
    </div>
  )
}
