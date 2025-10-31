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
  deleteDoc,
} from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { formatDate } from "@/lib/activity-utils"
import { UniversalNav } from "@/components/universal-nav"
import { Textarea } from "@/components/ui/textarea"
import { EmojiReactions } from "@/components/emoji-reactions"
import { ThreadedComments, ThreadedComment } from "@/components/ThreadedComments"
import { ShareToChatDialog } from "@/components/share-to-chat-dialog"

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
  media?: { type: 'image' | 'video'; url: string }[]
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
    avatar_url?: string
    photoURL?: string
  }
}

export default function DiscussionDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const discussionId = params.id as string

  const [discussion, setDiscussion] = useState<Discussion | null>(null)
  const [allComments, setAllComments] = useState<ThreadedComment[]>([])
  const [userMap, setUserMap] = useState<UserData>({})
  const [commentText, setCommentText] = useState("")
  const [pageLoading, setPageLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareText, setShareText] = useState("")

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
            const creatorData = creatorDoc.data()
            setUserMap((prev) => ({
              ...prev,
              [discussionData.creator_id]: {
                username: creatorData.username,
                avatar_url: creatorData.avatar_url,
                photoURL: creatorData.photoURL,
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

  // Fetch all comments (flat) and userMap for ThreadedComments
  useEffect(() => {
    if (!discussionId) return
    const q = query(collection(db, "discussions", discussionId, "comments"), orderBy("created_at", "asc"))
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const commentData: ThreadedComment[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ThreadedComment)
      setAllComments(commentData)
      // Build userMap
      const userIds = [...new Set(commentData.map(c => c.user_id))]
      const users: UserData = { ...userMap }
      for (const uid of userIds) {
        if (!users[uid]) {
          const uDoc = await getDoc(doc(db, "users", uid))
          if (uDoc.exists()) users[uid] = uDoc.data() as any
        }
      }
      setUserMap(users)
    })
    return () => unsubscribe()
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

  const addComment = async (content: string, parentId?: string|null) => {
    if (!user || !content.trim()) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, "discussions", discussionId, "comments"), {
        user_id: user.uid,
        content: content.trim(),
        created_at: serverTimestamp(),
        upvotes: 0,
        parent_id: parentId || null,
      })
      await updateDoc(doc(db, "discussions", discussionId), { comment_count: (discussion.comment_count || 0) + 1 })
      await addDoc(collection(db, "activities"), { user_id: user.uid, action_type: "commented_on_discussion", related_entity: discussion.title, created_at: serverTimestamp() })
    } finally { setSubmitting(false) }
  }
  const editComment = async (commentId: string, newContent: string) => {
    await updateDoc(doc(db, "discussions", discussionId, "comments", commentId), { content: newContent })
  }
  const deleteComment = async (commentId: string) => {
    // (You may also want to recursively delete children in a real app)
    await deleteDoc(doc(db, "discussions", discussionId, "comments", commentId))
  }
  const shareComment = (commentId: string) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/discussions/${discussionId}#comment-${commentId}` : `/discussions/${discussionId}`
    setShareText(`Check this comment: ${url}`)
    setShareOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
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

            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-8 h-8">
                <AvatarImage src={(userMap[discussion.creator_id]?.avatar_url || userMap[discussion.creator_id]?.photoURL) || "/placeholder.svg"} />
                <AvatarFallback>{(userMap[discussion.creator_id]?.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="text-muted-foreground">
                by{" "}
                <Link href={`/profile/${discussion.creator_id}`} className="text-primary hover:underline">
                  {userMap[discussion.creator_id]?.username || "Unknown"}
                </Link>{" "}
                • {formatDate(discussion.created_at)}
              </p>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-foreground whitespace-pre-wrap">
                {discussion.content}
              </p>
              {Array.isArray((discussion as any).media) && (discussion as any).media.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {((discussion as any).media as { type: 'image' | 'video'; url: string }[]).map((m, idx) => (
                    <div key={idx} className="relative aspect-video overflow-hidden rounded border">
                      {m.type === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt="media" className="w-full h-full object-cover" />
                      ) : (
                        <video src={m.url} className="w-full h-full object-cover" muted controls />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-border flex gap-6 text-sm text-muted-foreground">
            <span>{discussion.view_count || 0} views</span>
            <span>{allComments.length} comments</span>
          </div>
          <EmojiReactions parentId={discussionId} collectionName="discussions" />
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-bold mb-4">Add a Comment</h3>
            <form onSubmit={e => { e.preventDefault(); addComment(commentText); setCommentText(""); }} className="space-y-4">
              <Textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Share your thoughts..." className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" rows={4} />
              <Button type="submit" disabled={submitting || !commentText.trim()}>
                {submitting ? "Posting..." : "Post Comment"}
              </Button>
            </form>
          </div>

          {/* Threaded Comments section */}
          <ThreadedComments
            comments={allComments}
            userMap={userMap}
            currentUserId={user?.uid}
            collectionName="discussion_comments"
            addComment={addComment}
            editComment={editComment}
            deleteComment={deleteComment}
            shareComment={shareComment}
            canDeleteAny={user?.uid === discussion.creator_id}
          />
        </div>
      </main>
      <ShareToChatDialog open={shareOpen} onOpenChange={setShareOpen} initialText={shareText} />
    </div>
  )
}
