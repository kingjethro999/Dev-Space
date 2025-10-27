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
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"

interface Task {
  id: string
  project_id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "done"
  assignee_id?: string
  created_by: string
  created_at: any
  updated_at: any
}

interface Comment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: any
}

interface UserData {
  username: string
  avatar_url?: string
}

export default function TaskDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const taskId = params.taskId as string

  const [task, setTask] = useState<Task | null>(null)
  const [project, setProject] = useState<any>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [userData, setUserData] = useState<{ [key: string]: UserData }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const taskDoc = await getDoc(doc(db, "tasks", taskId))
        if (taskDoc.exists()) {
          setTask({ id: taskDoc.id, ...taskDoc.data() } as Task)
        }

        const projectDoc = await getDoc(doc(db, "projects", projectId))
        if (projectDoc.exists()) {
          setProject({ id: projectDoc.id, ...projectDoc.data() })
        }
      } catch (error) {
        console.error("Error fetching task:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user, taskId, projectId])

  useEffect(() => {
    if (!taskId) return

    const q = query(collection(db, "task_comments"), where("task_id", "==", taskId), orderBy("created_at", "asc"))

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Comment[]
      setComments(commentsData)

      const userIds = [...new Set(commentsData.map((c) => c.user_id))]
      const newUserData: { [key: string]: UserData } = { ...userData }

      for (const userId of userIds) {
        if (!newUserData[userId]) {
          const userDoc = await getDoc(doc(db, "users", userId))
          if (userDoc.exists()) {
            newUserData[userId] = userDoc.data() as UserData
          }
        }
      }
      setUserData(newUserData)
    })

    return () => unsubscribe()
  }, [taskId])

  const updateStatus = async (newStatus: "todo" | "in-progress" | "done") => {
    if (!task || !user) return
    await updateDoc(doc(db, "tasks", taskId), {
      status: newStatus,
      updated_at: serverTimestamp(),
    })

    await addDoc(collection(db, "activities"), {
      user_id: user.uid,
      action_type: "updated_task_status",
      related_entity: `${task.title} (${newStatus})`,
      created_at: serverTimestamp(),
    })

    setTask({ ...task, status: newStatus })
  }

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim() || !task) return

    await addDoc(collection(db, "task_comments"), {
      task_id: taskId,
      user_id: user.uid,
      content: newComment.trim(),
      created_at: serverTimestamp(),
    })

    await addDoc(collection(db, "activities"), {
      user_id: user.uid,
      action_type: "commented_on_task",
      related_entity: task.title,
      created_at: serverTimestamp(),
    })

    setNewComment("")
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!task || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <p className="text-muted-foreground">Task not found</p>
        </Card>
      </div>
    )
  }

  const isProjectOwner = user?.uid === project.owner_id

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/projects/${projectId}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </Link>
      </Button>

      <Card className="p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
            <Badge
              variant={task.status === "done" ? "default" : task.status === "in-progress" ? "secondary" : "outline"}
            >
              {task.status.replace("-", " ").toUpperCase()}
            </Badge>
          </div>
        </div>

        <p className="text-muted-foreground mb-6">{task.description}</p>

        {isProjectOwner && (
          <div className="flex gap-2 mb-6">
            <Button
              size="sm"
              variant={task.status === "todo" ? "default" : "outline"}
              onClick={() => updateStatus("todo")}
            >
              To Do
            </Button>
            <Button
              size="sm"
              variant={task.status === "in-progress" ? "default" : "outline"}
              onClick={() => updateStatus("in-progress")}
            >
              In Progress
            </Button>
            <Button
              size="sm"
              variant={task.status === "done" ? "default" : "outline"}
              onClick={() => updateStatus("done")}
            >
              Done
            </Button>
          </div>
        )}

        <div className="text-sm text-muted-foreground">Created {task.created_at?.toDate?.()?.toLocaleDateString()}</div>
      </Card>

      <Card className="p-8">
        <h2 className="text-xl font-bold mb-4">Comments</h2>

        <form onSubmit={addComment} className="mb-6">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-2"
          />
          <Button type="submit" disabled={!newComment.trim()}>
            Post Comment
          </Button>
        </form>

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No comments yet</p>
          ) : (
            comments.map((comment) => {
              const commentUser = userData[comment.user_id]
              return (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={commentUser?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{commentUser?.username?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{commentUser?.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {comment.created_at?.toDate?.()?.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}
