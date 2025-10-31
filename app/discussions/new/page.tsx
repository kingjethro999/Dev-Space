"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { UniversalNav } from "@/components/universal-nav"
import { Textarea } from "@/components/ui/textarea"
import { uploadImage, uploadVideo } from "@/lib/cloudinary-utils"

const CATEGORIES = ["General", "Help", "Showcase", "Discussion", "Question", "Feedback"]

export default function NewDiscussionPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("General")
  const [tags, setTags] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<{ type: 'image'|'video'; url: string }[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  if (!user) {
    router.push("/auth/login")
    return null
  }

  const onSelectMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setMediaFiles(files)
    const previews = files.map((f) => ({ type: f.type.startsWith('video') ? ('video' as const) : ('image' as const), url: URL.createObjectURL(f) }))
    setMediaPreviews(previews)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("Discussion title is required")
      return
    }

    if (!content.trim()) {
      setError("Discussion content is required")
      return
    }

    setSaving(true)
    setUploadingMedia(true)
    try {
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      // Upload media if any
      const uploadedMedia: { type: 'image'|'video'; url: string }[] = []
      for (const file of mediaFiles) {
        try {
          if (file.type.startsWith('video')) {
            const res = await uploadVideo(file)
            uploadedMedia.push({ type: 'video', url: res.secure_url })
          } else {
            const res = await uploadImage(file)
            uploadedMedia.push({ type: 'image', url: res.secure_url })
          }
        } catch {}
      }

      const docRef = await addDoc(collection(db, "discussions"), {
        creator_id: user.uid,
        title,
        content,
        category,
        tags: tagArray,
        media: uploadedMedia, // optional media
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        view_count: 0,
        comment_count: 0,
      })

      // Add activity
      await addDoc(collection(db, "activities"), {
        user_id: user.uid,
        action_type: "created_discussion",
        related_entity: title,
        created_at: serverTimestamp(),
      })

      router.push(`/discussions/${docRef.id}`)
    } catch (err: any) {
      setError(err.message || "Failed to create discussion")
    } finally {
      setUploadingMedia(false)
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Start a Discussion</h1>
          <p className="text-muted-foreground">Share your thoughts and engage with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-lg p-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Share your thoughts, ask questions, or provide feedback..."
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
            <Input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="react, javascript, help"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Attach media (optional)</label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={onSelectMedia}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {mediaPreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                {mediaPreviews.map((m, idx) => (
                  <div key={idx} className="relative aspect-video overflow-hidden rounded border">
                    {m.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <video src={m.url} className="w-full h-full object-cover" muted controls />
                    )}
                  </div>
                ))}
              </div>
            )}
            {uploadingMedia && (
              <p className="text-xs text-muted-foreground mt-2">Uploading media...</p>
            )}
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Creating..." : "Create Discussion"}
            </Button>
            <Link href="/discussions" className="flex-1">
              <Button type="button" variant="outline" className="w-full bg-transparent">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
