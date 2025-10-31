"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { UniversalNav } from "@/components/universal-nav"
import { Button } from "@/components/ui/button"

export default function CollaborationSettingsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [project, setProject] = useState<any>(null)
  const [mode, setMode] = useState<"solo"|"authorized"|"open">("solo")
  const [syncGithub, setSyncGithub] = useState(false)
  const [saving, setSaving] = useState(false)
  const [warn, setWarn] = useState<string>("")

  useEffect(() => {
    const run = async () => {
      if (!id || !user) return
      const p = await getDoc(doc(db, 'projects', id as string))
      if (p.exists()) {
        const data = p.data() as any
        if (data.owner_id !== user.uid) {
          router.push(`/projects/${id}`)
          return
        }
        setProject({ id, ...data })
        setMode(data.collaboration_type || 'solo')
        setSyncGithub(!!data.collaboration_sync_github)
      }
    }
    if (!loading && user) run()
  }, [id, user, loading, router])

  const applyWarning = (next: "solo"|"authorized"|"open") => {
    if (mode === next) { setWarn(""); return }
    if (next === 'open') setWarn("Warning: Open mode allows anyone to submit contributions (will require moderation).")
    else if (mode === 'open') setWarn("Switching away from Open will hide pending open contributions.")
    else setWarn("")
  }

  const save = async () => {
    if (!project) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        collaboration_type: mode,
        collaboration_sync_github: mode === 'authorized' ? syncGithub : false,
        updated_at: new Date(),
      })
      router.push(`/projects/${project.id}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !project) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Collaboration Settings</h1>

        <div className="space-y-6 bg-card border border-border rounded-lg p-6">
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" checked={mode === 'solo'} onChange={() => { setMode('solo'); applyWarning('solo') }} />
              <div>
                <div className="font-medium">Solo</div>
                <div className="text-xs text-muted-foreground">Only the owner can contribute.</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" checked={mode === 'authorized'} onChange={() => { setMode('authorized'); applyWarning('authorized') }} />
              <div>
                <div className="font-medium">Authorized</div>
                <div className="text-xs text-muted-foreground">Only approved collaborators can contribute.</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" checked={mode === 'open'} onChange={() => { setMode('open'); applyWarning('open') }} />
              <div>
                <div className="font-medium">Open</div>
                <div className="text-xs text-muted-foreground">Anyone can submit contributions (owner moderates).</div>
              </div>
            </label>
          </div>

          {mode === 'authorized' && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={syncGithub} onChange={(e) => setSyncGithub(e.target.checked)} />
              <div>
                <div className="font-medium">Sync GitHub Collaborators</div>
                <div className="text-xs text-muted-foreground">Import repo collaborators into this project as contributors.</div>
              </div>
            </label>
          )}

          {warn && (
            <div className="p-3 bg-amber-100/10 border border-amber-200/30 rounded text-amber-600 text-sm">
              {warn}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            <Button variant="outline" className="bg-transparent" onClick={() => router.push(`/projects/${project.id}`)}>Cancel</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
