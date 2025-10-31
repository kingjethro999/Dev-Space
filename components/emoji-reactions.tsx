import React, { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import {
  collection, doc, onSnapshot, setDoc, deleteDoc
} from "firebase/firestore"

const EMOJIS = [
  { key: "like", emoji: "👍", label: "Like" },
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "care", emoji: "🤗", label: "Care" },
  { key: "dislike", emoji: "👎", label: "Dislike" },
  { key: "support", emoji: "🙌", label: "Support" }
]

interface EmojiReactionsProps {
  parentId: string
  collectionName: string
}

export function EmojiReactions({ parentId, collectionName }: EmojiReactionsProps) {
  const { user } = useAuth()
  const [reactions, setReactions] = useState<Record<string, string[]>>({})
  const [userReaction, setUserReaction] = useState<string | null>(null)

  useEffect(() => {
    const ref = collection(db, collectionName, parentId, "reactions")
    const unsub = onSnapshot(ref, snap => {
      const r: Record<string, string[]> = {}
      snap.forEach(doc => {
        const data = doc.data() as { emoji: string; userId: string }
        if (!r[data.emoji]) r[data.emoji] = []
        r[data.emoji].push(data.userId)
        if (user && user.uid === data.userId) setUserReaction(data.emoji)
      })
      setReactions(r)
      if (!snap.docs.some(d => (d.data() as any).userId === (user && user.uid))) setUserReaction(null)
    })
    return () => unsub()
  }, [parentId, collectionName, user])

  const handleReact = async (emojiKey: string) => {
    if (!user) return
    const ref = doc(db, collectionName, parentId, "reactions", user.uid)

    if (userReaction === emojiKey) {
      await deleteDoc(ref)
    } else {
      await setDoc(ref, { emoji: emojiKey, userId: user.uid })
    }
  }

  return (
    <div className="flex gap-2 mt-2">
      {EMOJIS.map(({ key, emoji, label }) => (
        <Button
          key={key}
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => handleReact(key)}
          className={`transition-all rounded-full text-xl focus:outline-none focus:ring-2 focus:ring-primary/60 hover:bg-accent/30 px-2 py-1 flex flex-col items-center justify-center ${userReaction === key ? "bg-accent scale-110" : ""}`}
          aria-label={label}
        >
          <span>{emoji}</span>
          <span className="text-xs mt-0.5">
            {(reactions[key]?.length ?? 0) || null}
          </span>
        </Button>
      ))}
    </div>
  )
}
