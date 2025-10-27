"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"

export default function NewTaskPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim()) return

    setLoading(true)
    try {
      await addDoc(collection(db, "tasks"), {
        project_id: projectId,
        title: title.trim(),
        description: description.trim(),
        status: "todo",
        created_by: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })

      await addDoc(collection(db, "activities"), {
        user_id: user.uid,
        action_type: "created_task",
        related_entity: title.trim(),
        created_at: serverTimestamp(),
      })

      router.push(`/projects/${projectId}`)
    } catch (error) {
      console.error("Error creating task:", error)
      alert("Failed to create task")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <p className="text-muted-foreground">Please log in to create tasks</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/projects/${projectId}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </Link>
      </Button>

      <Card className="p-8">
        <h1 className="text-3xl font-bold mb-6">Create New Task</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/projects/${projectId}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
