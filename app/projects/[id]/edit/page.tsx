"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { UniversalNav } from "@/components/universal-nav"
import { ProjectImageUploadButton } from "@/components/ProjectImageUploadButton"
import { Briefcase, X } from "lucide-react"
import { TECH_FILTERS } from "@/lib/constants"



export default function EditProjectPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [liveUrl, setLiveUrl] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private">("public")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [pageLoading, setPageLoading] = useState(true)
  const [projectImageUrl, setProjectImageUrl] = useState<string>("")
  const [projectImagePublicId, setProjectImagePublicId] = useState<string>("")
  const [collaborationType, setCollaborationType] = useState<"solo" | "authorized" | "open">("solo")
  const [syncGithubCollaborators, setSyncGithubCollaborators] = useState(false)

  const [selectedTech, setSelectedTech] = useState<string[]>([])
  const [techSearch, setTechSearch] = useState("")
  const filteredTechs = TECH_FILTERS.filter(t => t.toLowerCase().includes(techSearch.toLowerCase()))

  const toggleTech = (tech: string) => {
    setSelectedTech((prev) => (prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]))
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectDoc = await getDoc(doc(db, "projects", projectId))
        if (projectDoc.exists()) {
          const data = projectDoc.data()
          if (data.owner_id !== user?.uid) {
            router.push("/projects")
            return
          }
          setTitle(data.title)
          setDescription(data.description)
          setGithubUrl(data.github_url || "")
          setLiveUrl(data.live_url || "")
          setVisibility(data.visibility)
          setProjectImageUrl(data.project_image_url || "")
          setProjectImagePublicId(data.project_image_public_id || "")
          setCollaborationType(data.collaboration_type || "solo")
          setSyncGithubCollaborators(!!data.collaboration_sync_github)
          setSelectedTech(data.tech_stack || [])
        }
      } catch (error) {
        console.error("Error fetching project:", error)
      } finally {
        setPageLoading(false)
      }
    }

    if (user && projectId) {
      fetchProject()
    }
  }, [user, projectId, router])

  if (loading || pageLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("Project title is required")
      return
    }

    setSaving(true)

    try {
      await updateDoc(doc(db, "projects", projectId), {
        title,
        description,
        github_url: githubUrl,
        live_url: liveUrl,
        visibility,
        project_image_url: projectImageUrl || null,
        project_image_public_id: projectImagePublicId || null,
        tech_stack: selectedTech,
        collaboration_type: collaborationType,
        collaboration_sync_github: collaborationType === "authorized" ? syncGithubCollaborators : false,
        updated_at: new Date(),
      })

      // Sync GitHub collaborators if enabled (non-blocking)
      if (collaborationType === "authorized" && syncGithubCollaborators) {
        fetch('/api/github/collaborators/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId })
        }).catch(err => console.error('Background GitHub sync failed:', err))
      }

      router.push(`/projects/${projectId}`)
    } catch (err: any) {
      setError(err.message || "Failed to update project")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Link href={`/projects/${projectId}`} className="text-primary hover:underline mb-6 inline-block">
          Back to Project
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Edit Project</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-lg p-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Project Title</label>
            <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={5}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">GitHub URL</label>
            <Input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Live URL</label>
            <Input type="url" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} />
          </div>



          <div>
            <label className="block text-sm font-medium mb-2">Technologies & Frameworks (Optional)</label>
            <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-4">
              <Input
                type="text"
                placeholder="Search technologies..."
                value={techSearch}
                onChange={(e) => setTechSearch(e.target.value)}
                className="h-9 text-sm"
              />
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                {filteredTechs.map((tech) => (
                  <label key={tech} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedTech.includes(tech)} onChange={() => toggleTech(tech)} />
                    <span className="text-sm hover:text-primary transition-colors">{tech}</span>
                  </label>
                ))}
                {filteredTechs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No technologies found.</p>
                )}
              </div>
              {selectedTech.length > 0 && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm font-medium mb-2">Selected ({selectedTech.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTech.map((tech) => (
                      <span key={tech} className="bg-primary/20 text-primary whitespace-nowrap px-2 py-1 rounded text-xs flex items-center gap-1">
                        {tech}
                        <button type="button" onClick={() => toggleTech(tech)} className="hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Project Image</label>
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                {projectImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={projectImageUrl} alt="Project" className="w-full h-full object-cover" />
                ) : (
                  <Briefcase className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <ProjectImageUploadButton onUploaded={({ url, publicId }) => { setProjectImageUrl(url); setProjectImagePublicId(publicId); }}>
                Upload (1:1 crop)
              </ProjectImageUploadButton>
              {projectImageUrl && (
                <Button type="button" variant="ghost" onClick={() => { setProjectImageUrl(""); setProjectImagePublicId("") }}>Remove</Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Users crop manually with a 1:1 ratio in the upload dialog.</p>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">Collaboration</label>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="solo"
                  checked={collaborationType === "solo"}
                  onChange={(e) => setCollaborationType(e.target.value as any)}
                />
                <div>
                  <span className="font-medium">Solo (default)</span>
                  <p className="text-xs text-muted-foreground">Only you can contribute.</p>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="authorized"
                  checked={collaborationType === "authorized"}
                  onChange={(e) => setCollaborationType(e.target.value as any)}
                />
                <div>
                  <span className="font-medium">Authorized Collaboration</span>
                  <p className="text-xs text-muted-foreground">Only approved collaborators can contribute.</p>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="open"
                  checked={collaborationType === "open"}
                  onChange={(e) => setCollaborationType(e.target.value as any)}
                />
                <div>
                  <span className="font-medium">Open Collaboration</span>
                  <p className="text-xs text-muted-foreground">Any user can contribute.</p>
                </div>
              </label>

              {collaborationType === "authorized" && (
                <label className="flex items-start gap-3 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={syncGithubCollaborators}
                    onChange={(e) => setSyncGithubCollaborators(e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <span className="block text-sm font-medium mb-1">Sync from GitHub collaborators/team</span>
                    <span className="block text-xs text-muted-foreground">Enable to sync repo collaborators from GitHub.</span>
                  </div>
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Visibility</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="public"
                  checked={visibility === "public"}
                  onChange={(e) => setVisibility(e.target.value as "public" | "private")}
                />
                <span>Public</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="private"
                  checked={visibility === "private"}
                  onChange={(e) => setVisibility(e.target.value as "public" | "private")}
                />
                <span>Private</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Link href={`/projects/${projectId}`} className="flex-1">
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
