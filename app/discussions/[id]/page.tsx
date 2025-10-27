"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import {
  doc,
  getDoc,
  collection,
  query,
  addDoc,
  serverTimestamp,
  updateDoc,
  onSnapshot,
  orderBy,
} from "firebase/firestore"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDate } from "@/lib/activity-utils"

interface Discussion {
  id: string
  creator_id: string
  title: string
  content: string
  category: string
  tags: string[]
  created_at: any
  view_count: number
  comment_count: number
}

interface Comment {
  id: string
  user_id: string
  content: string
  created_at: any
  upvotes: number
}

interface UserData {
  [key: string]: {
    username: string
  }
}

export default function DiscussionDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const discussionId = params.id as string

  const [discussion, setDiscussion] = useState<Discussion | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [userData, setUserData] = useState<UserData>({})
  const [commentText, setCommentText] = useState("")
  const [pageLoading, setPageLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        const discussionDoc = await getDoc(doc(db, "discussions", discussionId))
        if (discussionDoc.exists()) {
          const discussionData = { id: discussionDoc.id, ...discussionDoc.data() } as Discussion
          setDiscussion(discussionData)

          // Increment view count
          await updateDoc(doc(db, "discussions", discussionId), {
            view_count: (discussionData.view_count || 0) + 1,
          })

          // Fetch creator info
          const creatorDoc = await getDoc(doc(db, "users", discussionData.creator_id))
          if (creatorDoc.exists()) {
            setUserData((prev) => ({
              ...prev,
              [discussionData.creator_id]: {
                username: creatorDoc.data().username,
              },
            }))
          }
        }
      } catch (error) {
        console.error("Error fetching discussion:", error)
      } finally {
        setPageLoading(false)
      }
    }

    if (user && discussionId) {
      fetchDiscussion()
    }
  }, [user, discussionId])

  useEffect(() => {
    if (!discussionId) return

    let unsubscribe: (() => void) | null = null

    const setupCommentsListener = async () => {
      try {
        const q = query(collection(db, "discussions", discussionId, "comments"), orderBy("created_at", "desc"))

        unsubscribe = onSnapshot(q, async (snapshot) => {
          const commentsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Comment[]

          setComments(commentsData)

          // Fetch user data for comments
          const userIds = [...new Set(commentsData.map((c) => c.user_id))]
          const newUserData: UserData = { ...userData }

          for (const userId of userIds) {
            if (!newUserData[userId]) {
              try {
                const userDoc = await getDoc(doc(db, "users", userId))
                if (userDoc.exists()) {
                  newUserData[userId] = {
                    username: userDoc.data().username,
                  }
                }
              } catch (error) {
                console.error("Error fetching user data:", error)
              }
            }
          }

          setUserData(newUserData)
        })
      } catch (error) {
        console.error("Error setting up comments listener:", error)
      }
    }

    setupCommentsListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [discussionId])

  if (loading || pageLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  if (!discussion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Discussion not found</h1>
          <Link href="/discussions">
            <Button>Back to Discussions</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    setSubmitting(true)

    try {
      await addDoc(collection(db, "discussions", discussionId, "comments"), {
        user_id: user.uid,
        content: commentText,
        created_at: serverTimestamp(),
        upvotes: 0,
      })

      // Update comment count
      await updateDoc(doc(db, "discussions", discussionId), {
        comment_count: (discussion.comment_count || 0) + 1,
      })

      // Add activity
      await addDoc(collection(db, "activities"), {
        user_id: user.uid,
        action_type: "commented_on_discussion",
        related_entity: discussion.title,
        created_at: serverTimestamp(),
      })

      setCommentText("")
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/feed" className="text-2xl font-bold text-primary">
            Dev Space
          </Link>
          <div className="flex gap-4">
            <Link href="/discussions">
              <Button variant="ghost">Discussions</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/discussions" className="text-primary hover:underline mb-6 inline-block">
          Back to Discussions
        </Link>

        <div className="bg-card border border-border rounded-lg p-8 space-y-6 mb-8">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">{discussion.title}</h1>
                <div className="flex gap-2 mb-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded">{discussion.category}</span>
                  {discussion.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-muted-foreground mb-4">
              by{" "}
              <Link href={`/profile/${discussion.creator_id}`} className="text-primary hover:underline">
                {userData[discussion.creator_id]?.username || "Unknown"}
              </Link>{" "}
              • {formatDate(discussion.created_at)}
            </p>

            <div className="prose prose-invert max-w-none">
              <p className="text-foreground whitespace-pre-wrap">{discussion.content}</p>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex gap-6 text-sm text-muted-foreground">
            <span>{discussion.view_count || 0} views</span>
            <span>{comments.length} comments</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-bold mb-4">Add a Comment</h3>
            <form onSubmit={handleAddComment} className="space-y-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
              />
              <Button type="submit" disabled={submitting || !commentText.trim()}>
                {submitting ? "Posting..." : "Post Comment"}
              </Button>
            </form>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg">Comments ({comments.length})</h3>
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No comments yet. Be the first to comment!</div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-2">
                    <Link
                      href={`/profile/${comment.user_id}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {userData[comment.user_id]?.username || "Unknown"}
                    </Link>
                    <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
                  <div className="mt-3 flex gap-4 text-sm">
                    <button className="text-muted-foreground hover:text-primary">
                      Upvote ({comment.upvotes || 0})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
