import React, { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, getDoc
} from "firebase/firestore"
import { createNotification } from "@/lib/notifications-utils"
import { starRepository, unstarRepository, isRepositoryStarred, parseGitHubUrl } from "@/lib/github-utils"
import { Loader2 } from "lucide-react"

interface EmojiConfig {
  key: string
  emoji: string
  label: string
  isGitHubStar?: boolean
}

const EMOJIS: EmojiConfig[] = [
  { key: "github_star", emoji: "⭐", label: "GitHub Star", isGitHubStar: true },
  { key: "like", emoji: "👍", label: "Like" },
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "care", emoji: "🤗", label: "Care" },
  { key: "dislike", emoji: "👎", label: "Dislike" },
  { key: "support", emoji: "🙌", label: "Support" }
]

interface EmojiReactionsProps {
  parentId: string
  collectionName: string
  ownerId?: string // optional owner ID for notifications
  githubUrl?: string // GitHub repo URL for star integration
}

export function EmojiReactions({ parentId, collectionName, ownerId, githubUrl }: EmojiReactionsProps) {
  const { user } = useAuth()
  const [reactions, setReactions] = useState<Record<string, string[]>>({})
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [fetchedOwnerId, setFetchedOwnerId] = useState<string | null>(null)
  const [fetchedGithubUrl, setFetchedGithubUrl] = useState<string | null>(null)
  const [isStarred, setIsStarred] = useState(false)
  const [starLoading, setStarLoading] = useState(false)
  const [starError, setStarError] = useState<string | null>(null)

  // Fetch owner and github URL if not provided
  useEffect(() => {
    if (ownerId) setFetchedOwnerId(ownerId)
    if (githubUrl) setFetchedGithubUrl(githubUrl)

    if (ownerId && githubUrl) return

    const fetchData = async () => {
      try {
        const docRef = doc(db, collectionName, parentId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          if (!ownerId) setFetchedOwnerId(data.owner_id || data.author_id || data.user_id || null)
          if (!githubUrl) setFetchedGithubUrl(data.github_url || data.githubUrl || null)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [parentId, collectionName, ownerId, githubUrl])

  // Check if user has starred the repo on GitHub
  useEffect(() => {
    const checkGitHubStar = async () => {
      const repoUrl = githubUrl || fetchedGithubUrl
      if (!repoUrl || !user) return

      const parsed = parseGitHubUrl(repoUrl)
      if (!parsed) return

      try {
        const starred = await isRepositoryStarred(parsed.owner, parsed.repo, user.uid)
        setIsStarred(starred)
      } catch {
        // Ignore errors, just don't show as starred
      }
    }
    checkGitHubStar()
  }, [user, githubUrl, fetchedGithubUrl])

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

  const handleGitHubStar = async () => {
    if (!user) return

    const repoUrl = githubUrl || fetchedGithubUrl
    if (!repoUrl) {
      setStarError("No GitHub repository linked to this project")
      setTimeout(() => setStarError(null), 3000)
      return
    }

    const parsed = parseGitHubUrl(repoUrl)
    if (!parsed) {
      setStarError("Invalid GitHub URL")
      setTimeout(() => setStarError(null), 3000)
      return
    }

    setStarLoading(true)
    setStarError(null)

    try {
      if (isStarred) {
        await unstarRepository(parsed.owner, parsed.repo, user.uid)
        setIsStarred(false)
      } else {
        await starRepository(parsed.owner, parsed.repo, user.uid)
        setIsStarred(true)

        // Notify the owner
        const targetOwnerId = fetchedOwnerId
        if (targetOwnerId && targetOwnerId !== user.uid) {
          await createNotification(
            targetOwnerId,
            'reaction',
            `${user.displayName || 'Someone'} starred your project on GitHub!`,
            `Your GitHub repository received a star`,
            parentId,
            collectionName,
            user.uid
          )
        }
      }
    } catch (error: any) {
      setStarError(error.message || "Failed to star repository")
      setTimeout(() => setStarError(null), 5000)
    } finally {
      setStarLoading(false)
    }
  }

  const handleReact = async (emojiKey: string, isGitHubStar?: boolean) => {
    if (!user) return

    // Special handling for GitHub star
    if (isGitHubStar) {
      await handleGitHubStar()
      return
    }

    const ref = doc(db, collectionName, parentId, "reactions", user.uid)

    if (userReaction === emojiKey) {
      await deleteDoc(ref)
    } else {
      await setDoc(ref, { emoji: emojiKey, userId: user.uid })

      // Notify the owner (only if it's not the user themselves)
      const targetOwnerId = fetchedOwnerId
      if (targetOwnerId && targetOwnerId !== user.uid) {
        const emojiLabel = EMOJIS.find(e => e.key === emojiKey)?.label || emojiKey
        await createNotification(
          targetOwnerId,
          'reaction',
          `${user.displayName || 'Someone'} reacted to your ${collectionName.slice(0, -1)}`,
          `They reacted with ${emojiLabel}`,
          parentId,
          collectionName,
          user.uid
        )
      }
    }
  }

  const effectiveGithubUrl = githubUrl || fetchedGithubUrl

  return (
    <div className="flex flex-col gap-1 mt-2">
      <div className="flex gap-2 flex-wrap">
        {EMOJIS.map(({ key, emoji, label, isGitHubStar }) => {
          // For GitHub star, show differently
          if (isGitHubStar) {
            return (
              <Button
                key={key}
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => handleReact(key, true)}
                disabled={starLoading || !effectiveGithubUrl}
                title={!effectiveGithubUrl ? "No GitHub repo linked" : isStarred ? "Unstar on GitHub" : "Star on GitHub"}
                className={`transition-all rounded-full text-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/60 hover:bg-yellow-400/20 px-2 py-1 flex flex-col items-center justify-center ${isStarred ? "bg-yellow-400/30 scale-110 text-yellow-500" : ""
                  } ${!effectiveGithubUrl ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label={label}
              >
                {starLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className={isStarred ? "drop-shadow-[0_0_4px_rgba(250,204,21,0.8)]" : ""}>{emoji}</span>
                )}
                <span className="text-[10px] mt-0.5 font-medium">
                  {effectiveGithubUrl ? (isStarred ? "Starred" : "Star") : "N/A"}
                </span>
              </Button>
            )
          }

          return (
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
          )
        })}
      </div>
      {starError && (
        <p className="text-xs text-destructive mt-1">{starError}</p>
      )}
    </div>
  )
}
