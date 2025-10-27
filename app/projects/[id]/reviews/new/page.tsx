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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"

const LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
  "HTML",
  "CSS",
  "SQL",
  "Other",
]

export default function NewCodeReviewPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [codeSnippet, setCodeSnippet] = useState("")
  const [language, setLanguage] = useState("JavaScript")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim() || !codeSnippet.trim()) return

    setLoading(true)
    try {
      await addDoc(collection(db, "code_reviews"), {
        project_id: projectId,
        title: title.trim(),
        description: description.trim(),
        code_snippet: codeSnippet.trim(),
        language,
        author_id: user.uid,
        status: "pending",
        created_at: serverTimestamp(),
      })

      await addDoc(collection(db, "activities"), {
        user_id: user.uid,
        action_type: "requested_code_review",
        related_entity: title.trim(),
        created_at: serverTimestamp(),
      })

      router.push(`/projects/${projectId}/reviews`)
    } catch (error) {
      console.error("Error creating code review:", error)
      alert("Failed to create code review")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <p className="text-muted-foreground">Please log in to request code reviews</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/projects/${projectId}/reviews`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Reviews
        </Link>
      </Button>

      <Card className="p-8">
        <h1 className="text-3xl font-bold mb-6">Request Code Review</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Review Title</Label>
            <Input
              id="title"
              placeholder="e.g., Authentication logic review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What would you like feedback on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Code Snippet</Label>
            <Textarea
              id="code"
              placeholder="Paste your code here..."
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              required
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading || !title.trim() || !codeSnippet.trim()}>
              {loading ? "Submitting..." : "Request Review"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/projects/${projectId}/reviews`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
