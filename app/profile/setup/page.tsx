"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { UniversalNav } from "@/components/universal-nav"

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

export default function ProfileSetupPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [bio, setBio] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  if (!user) {
    router.push("/auth/login")
    return null
  }

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db, "users", user.uid), {
        bio,
        skills: selectedSkills,
        updated_at: new Date(),
      })
      router.push("/discover")
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h1>
            <p className="text-muted-foreground">Help other developers get to know you</p>
            <p className="text-xs text-muted-foreground mt-2">Welcome to Dev Space by <span className="text-blue-400 font-semibold">King Jethro</span></p>
          </div>
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

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself, your interests, and what you're working on..."
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-4">Select Your Skills</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SKILLS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    selectedSkills.includes(skill)
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
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Complete Setup"}
            </Button>
            <Button onClick={() => router.push("/discover")} variant="outline" className="flex-1">
              Skip for Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
