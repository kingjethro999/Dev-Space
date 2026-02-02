"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { UniversalNav } from "@/components/universal-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { uploadImage } from "@/lib/cloudinary-utils"

const SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Vue.js",
  "Angular",
  "Node.js",
  "Python",
  "Java",
  "C++",
  "Go",
  "Rust",
  "PHP",
  "Laravel",
  "PostgreSQL",
  "MongoDB",
  "Firebase",
  "AWS",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "REST API",
  "Web3",
  "Machine Learning",
  "DevOps",
  "UI/UX",
]

export default function EditProfilePage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const profileId = params.id as string

  const [bio, setBio] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && user.uid !== profileId) {
      router.push(`/profile/${profileId}`)
      return
    }

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", profileId))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setBio(data.bio || "")
          setSelectedSkills(data.skills || [])
          setAvatarUrl(data.avatar_url || data.photoURL || "")
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setPageLoading(false)
      }
    }

    if (user && profileId) {
      fetchProfile()
    }
  }, [user, profileId, router])

  if (loading || pageLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Upload avatar first if a new file is selected
      let newAvatarUrl = avatarUrl
      if (avatarFile) {
        setUploadingAvatar(true)
        try {
          const res = await uploadImage(avatarFile, 'dev-space/avatars')
          newAvatarUrl = res.secure_url
          setAvatarUrl(newAvatarUrl)
        } finally {
          setUploadingAvatar(false)
        }
      }

      await updateDoc(doc(db, "users", user.uid), {
        bio,
        skills: selectedSkills,
        avatar_url: newAvatarUrl || "",
        updated_at: new Date(),
      })
      router.push(`/profile/${user.uid}`)
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/profile/${user.uid}`} className="text-primary hover:underline">
            Back to Profile
          </Link>
          <Button
            variant="ghost"
            onClick={async () => {
              await logout()
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Edit Profile</h1>
        </div>

        <div className="space-y-6 bg-card border border-border rounded-lg p-6">
          <div>
            <label className="block text-sm font-medium mb-2">Profile Image</label>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarUrl || "/placeholder.svg"} className="object-cover" />
                <AvatarFallback>{(user?.displayName || user?.email || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {avatarFile && (
                  <p className="text-xs text-muted-foreground">Selected: {avatarFile.name}</p>
                )}
                {uploadingAvatar && (
                  <p className="text-xs text-muted-foreground">Uploading image...</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-4">Skills</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SKILLS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${selectedSkills.includes(skill)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-foreground hover:border-primary"
                    }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={saving || uploadingAvatar} className="flex-1">
              {saving ? "Saving..." : uploadingAvatar ? "Uploading..." : "Save Changes"}
            </Button>
            <Link href={`/profile/${user.uid}`} className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
