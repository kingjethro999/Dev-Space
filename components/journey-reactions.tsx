"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  Heart, 
  ThumbsUp, 
  Star, 
  Zap, 
  Trophy, 
  MessageCircle 
} from "lucide-react"
import { JourneyReaction } from "@/lib/journey-schema"
import { addJourneyReaction } from "@/lib/journey-utils"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"

interface JourneyReactionsProps {
  entryId: string
  reactions: JourneyReaction[]
  currentUserId?: string
}

export function JourneyReactions({ entryId, reactions, currentUserId }: JourneyReactionsProps) {
  const [localReactions, setLocalReactions] = useState(reactions)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = query(
      collection(db, "journey_entries", entryId, "reactions"),
      orderBy("timestamp", "desc")
    )
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => d.data() as any)
      setLocalReactions(items as JourneyReaction[])
    })
    return unsub
  }, [entryId])

  const reactionTypes = [
    { type: 'like', icon: ThumbsUp, label: 'Like', color: 'text-blue-500' },
    { type: 'love', icon: Heart, label: 'Love', color: 'text-red-500' },
    { type: 'wow', icon: Star, label: 'Wow', color: 'text-yellow-500' },
    { type: 'inspiring', icon: Zap, label: 'Inspiring', color: 'text-purple-500' },
    { type: 'helpful', icon: MessageCircle, label: 'Helpful', color: 'text-green-500' },
    { type: 'celebrate', icon: Trophy, label: 'Celebrate', color: 'text-orange-500' },
  ] as const

  const handleReaction = async (reactionType: typeof reactionTypes[number]['type']) => {
    if (!currentUserId || loading) return

    setLoading(true)
    try {
      // Check if user already reacted with this type
      const existingReaction = localReactions.find(
        r => r.userId === currentUserId && r.type === reactionType
      )

      if (existingReaction) {
        // Remove reaction
        setLocalReactions(prev => 
          prev.filter(r => !(r.userId === currentUserId && r.type === reactionType))
        )
      } else {
        // Add reaction
        await addJourneyReaction(entryId, currentUserId, reactionType)
        setLocalReactions(prev => [
          ...prev,
          {
            userId: currentUserId,
            type: reactionType,
            timestamp: new Date(),
          }
        ])
      }
    } catch (error) {
      console.error('Error adding reaction:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReactionCount = (type: string) => {
    return localReactions.filter(r => r.type === type).length
  }

  const getUserReaction = () => {
    if (!currentUserId) return null
    return localReactions.find(r => r.userId === currentUserId)
  }

  const userReaction = getUserReaction()

  return (
    <div className="flex items-center space-x-1">
      {reactionTypes.map(({ type, icon: Icon, label, color }) => {
        const count = getReactionCount(type)
        const isActive = userReaction?.type === type

        return (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => handleReaction(type)}
            disabled={loading}
            className={`h-8 px-2 ${
              isActive ? color : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4 mr-1" />
            {count > 0 && (
              <span className="text-xs">{count}</span>
            )}
          </Button>
        )
      })}
    </div>
  )
}

