"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Check, X } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { UniversalNav } from "@/components/universal-nav"
import { ThreadedComments, ThreadedComment } from "@/components/ThreadedComments"
import { deleteDoc } from "firebase/firestore"
import { ShareToChatDialog } from "@/components/share-to-chat-dialog"

interface CodeReview {
  id: string
  project_id: string
  title: string
  code_snippet: string
  language: string
  description: string
  author_id: string
  status: "pending" | "approved" | "changes-requested"
  created_at: any
}

interface Comment {
  id: string
  review_id: string
  user_id: string
  content: string
  created_at: any
}

interface UserData {
  username: string
  avatar_url?: string
}

export default function CodeReviewDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const projectId = params.id as string
  const reviewId = params.reviewId as string

  const [review, setReview] = useState<CodeReview | null>(null)
  const [project, setProject] = useState<any>(null)
  const [allComments, setAllComments] = useState<ThreadedComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [userMap, setUserMap] = useState<{ [key: string]: UserData }>({})
  const [loading, setLoading] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareText, setShareText] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reviewDoc = await getDoc(doc(db, "code_reviews", reviewId))
        if (reviewDoc.exists()) {
          const reviewData = { id: reviewDoc.id, ...reviewDoc.data() } as CodeReview
          setReview(reviewData)
          const authorDoc = await getDoc(doc(db, "users", reviewData.author_id))
          if (authorDoc.exists()) {
            const map = { ...userMap }
            map[reviewData.author_id] = authorDoc.data() as UserData
            setUserMap(map)
          }
        }
        const projectDoc = await getDoc(doc(db, "projects", projectId))
        if (projectDoc.exists()) {
          setProject({ id: projectDoc.id, ...projectDoc.data() })
        }
      } catch (error) {
        console.error("Error fetching review:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user, reviewId, projectId])

  useEffect(() => {
    if (!reviewId) return
    const q = query(collection(db, "review_comments"), where("review_id", "==", reviewId), orderBy("created_at", "asc"))
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const commentsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as ThreadedComment)
      setAllComments(commentsData)
      const userIds = [...new Set(commentsData.map(c => c.user_id))]
      const map = { ...userMap }
      for (const uid of userIds) {
        if (!map[uid]) {
          const uDoc = await getDoc(doc(db, "users", uid))
          if (uDoc.exists()) map[uid] = uDoc.data() as UserData
        }
      }
      setUserMap(map)
    })
    return () => unsubscribe()
  }, [reviewId])

  const updateStatus = async (newStatus: "approved" | "changes-requested") => {
    if (!review || !user) return
    await updateDoc(doc(db, "code_reviews", reviewId), {
      status: newStatus,
    })

    await addDoc(collection(db, "activities"), {
      user_id: user.uid,
      action_type: "reviewed_code",
      related_entity: `${review.title} (${newStatus})`,
      created_at: serverTimestamp(),
    })

    setReview({ ...review, status: newStatus })
  }

  const addCommentThreaded = async (content: string, parentId?: string | null) => {
    if (!user || !content.trim()) return
    await addDoc(collection(db, "review_comments"), {
      review_id: reviewId,
      user_id: user.uid,
      content: content.trim(),
      created_at: serverTimestamp(),
      parent_id: parentId || null,
    })
  }
  const editCommentThreaded = async (commentId: string, newContent: string) => {
    await updateDoc(doc(db, "review_comments", commentId), { content: newContent })
  }
  const deleteCommentThreaded = async (commentId: string) => {
    await deleteDoc(doc(db, "review_comments", commentId))
  }
  const shareCommentThreaded = (commentId: string) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/projects/${projectId}/reviews/${reviewId}#comment-${commentId}` : `/projects/${projectId}/reviews/${reviewId}`
    setShareText(`Check this comment: ${url}`)
    setShareOpen(true)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!review || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <p className="text-muted-foreground">Code review not found</p>
        </Card>
      </div>
    )
  }

  const isProjectOwner = user?.uid === project.owner_id
  const author = userMap[review.author_id]

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />
      <div className="max-w-7xl mx-auto py-8 px-4">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/projects/${projectId}/reviews`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Reviews
        </Link>
      </Button>

      <Card className="p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{review.title}</h1>
            <div className="flex items-center gap-3 mb-3">
              <Badge
                variant={
                  review.status === "approved"
                    ? "default"
                    : review.status === "changes-requested"
                      ? "destructive"
                      : "secondary"
                }
              >
                {review.status.replace("-", " ").toUpperCase()}
              </Badge>
              <Badge variant="outline">{review.language}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              by {author?.username} • {review.created_at?.toDate?.()?.toLocaleDateString()}
            </p>
          </div>
        </div>

        {review.description && <p className="text-muted-foreground mb-6">{review.description}</p>}

        <div className="bg-muted rounded-lg p-4 mb-6">
          <pre className="text-sm overflow-x-auto">
            <code>{review.code_snippet}</code>
          </pre>
        </div>

        {isProjectOwner && review.status === "pending" && (
          <div className="flex gap-2">
            <Button onClick={() => updateStatus("approved")} className="gap-2">
              <Check className="w-4 h-4" />
              Approve
            </Button>
            <Button onClick={() => updateStatus("changes-requested")} variant="destructive" className="gap-2">
              <X className="w-4 h-4" />
              Request Changes
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-8">
        <h2 className="text-xl font-bold mb-4">Comments</h2>
        <form onSubmit={(e) => { e.preventDefault(); addCommentThreaded(newComment); setNewComment(""); }} className="mb-6">
          <Textarea placeholder="Add your feedback..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="mb-2" />
          <Button type="submit" disabled={!newComment.trim()}>Post Comment</Button>
        </form>
        <ThreadedComments
          comments={allComments}
          userMap={userMap}
          currentUserId={user?.uid}
          collectionName="review_comments"
          addComment={addCommentThreaded}
          editComment={editCommentThreaded}
          deleteComment={deleteCommentThreaded}
          shareComment={shareCommentThreaded}
          canDeleteAny={user?.uid === project.owner_id}
        />
      </Card>
      <ShareToChatDialog open={shareOpen} onOpenChange={setShareOpen} initialText={shareText} />
      </div>
    </div>
  )
}
