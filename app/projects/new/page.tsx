"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RepositorySelector } from "@/components/repository-selector"
import Link from "next/link"
import { Github, ExternalLink, Star, GitFork, Eye, Lock, Globe, AlertCircle, Briefcase, Search, X, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { UniversalNav } from "@/components/universal-nav"
import { ProjectImageUploadButton } from "@/components/ProjectImageUploadButton"

const TECH_OPTIONS = [
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
]

interface Repository {
  id: number
  name: string
  fullName: string
  description: string
  language: string
  stars: number
  forks: number
  watchers: number
  private: boolean
  url: string
  cloneUrl: string
  defaultBranch: string
  updatedAt: string
  createdAt: string
}

export default function NewProjectPage() {
  const { user, loading, signInWithGitHub } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTech, setSelectedTech] = useState<string[]>([])
  const [liveUrl, setLiveUrl] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private">("public")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [githubConnected, setGithubConnected] = useState(false)
  const [checkingGithub, setCheckingGithub] = useState(true)
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)
  const [showRepositorySelector, setShowRepositorySelector] = useState(false)
  const [enableJourney, setEnableJourney] = useState(false)
  const [projectImageUrl, setProjectImageUrl] = useState<string>("")
  const [projectImagePublicId, setProjectImagePublicId] = useState<string>("")
  const [collaborationType, setCollaborationType] = useState<"solo" | "authorized" | "open">("solo")
  const [syncGithubCollaborators, setSyncGithubCollaborators] = useState(false)
  const [showAllTech, setShowAllTech] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [manualCollaborators, setManualCollaborators] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const searchUsers = async (queryText: string) => {
    if (!queryText.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Fetch users and filter client-side for substring matching
      // Firestore prefix queries only work for exact prefixes
      const usersRef = collection(db, "users")
      const snapshot = await getDocs(usersRef)

      const searchLower = queryText.toLowerCase().trim()

      const results = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as any))
        .filter((u: any) => {
          // Exclude current user and already selected collaborators
          if (u.id === user?.uid || manualCollaborators.some(c => c.id === u.id)) {
            return false
          }

          const username = (u.username || "").toLowerCase()
          const displayName = (u.displayName || "").toLowerCase()
          const email = (u.email || "").toLowerCase()

          return username.includes(searchLower) ||
            displayName.includes(searchLower) ||
            email.includes(searchLower)
        })
        .slice(0, 5) // Limit results

      setSearchResults(results)
    } catch (error) {
      console.error("Error searching users:", error)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, manualCollaborators])

  const addManualCollaborator = (user: any) => {
    setManualCollaborators([...manualCollaborators, user])
    setSearchQuery("")
    setSearchResults([])
  }

  const removeManualCollaborator = (userId: string) => {
    setManualCollaborators(manualCollaborators.filter(c => c.id !== userId))
  }

  useEffect(() => {
    const checkGithubConnection = async () => {
      if (!user) return

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setGithubConnected(!!userData.githubConnected && !!userData.githubAccessToken)
        }
      } catch (error) {
        console.error('Error checking GitHub connection:', error)
      } finally {
        setCheckingGithub(false)
      }
    }

    checkGithubConnection()
  }, [user])

  if (loading || checkingGithub) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push("/auth/login")
    return null
  }

  // Show GitHub connection required for Google users
  if (!githubConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                GitHub Required
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                To create projects on DevSpace, you need to connect your GitHub account.
                This allows you to select repositories directly and showcase your work seamlessly.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">What you'll get:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Select repositories from your GitHub account</li>
                  <li>• Automatic project details and stats</li>
                  <li>• Real-time repository updates</li>
                  <li>• Seamless integration with your workflow</li>
                </ul>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={async () => {
                    try {
                      await signInWithGitHub()
                      // Refresh the page to update GitHub connection status
                      window.location.reload()
                    } catch (error) {
                      console.error('GitHub connection failed:', error)
                    }
                  }}
                  className="flex-1"
                >
                  <Github className="w-4 h-4 mr-2" />
                  Connect GitHub
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/discover')}
                  className="flex-1"
                >
                  Go to Feed
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const toggleTech = (tech: string) => {
    setSelectedTech((prev) => (prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("Project title is required")
      return
    }

    if (!selectedRepository) {
      setError("Please select a GitHub repository")
      return
    }

    setSaving(true)

    try {
      const projectData = {
        owner_id: user.uid,
        title,
        description,
        tech_stack: selectedTech,
        github_url: selectedRepository.url,
        github_repo_id: selectedRepository.id,
        github_repo_name: selectedRepository.name,
        github_repo_full_name: selectedRepository.fullName,
        github_repo_description: selectedRepository.description,
        github_repo_language: selectedRepository.language,
        github_repo_stars: selectedRepository.stars,
        github_repo_forks: selectedRepository.forks,
        github_repo_watchers: selectedRepository.watchers,
        github_repo_private: selectedRepository.private,
        github_repo_default_branch: selectedRepository.defaultBranch,
        live_url: liveUrl,
        visibility,
        hasJourney: enableJourney,
        project_image_url: projectImageUrl || null,
        project_image_public_id: projectImagePublicId || null,
        collaboration_type: collaborationType,
        collaboration_sync_github: collaborationType === "authorized" ? syncGithubCollaborators : false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }

      const projectRef = await addDoc(collection(db, "projects"), projectData)

      // Link GitHub repository
      await addDoc(collection(db, "github_repos"), {
        projectId: projectRef.id,
        githubUrl: selectedRepository.url,
        repoName: selectedRepository.name,
        owner: selectedRepository.fullName.split('/')[0],
        stars: selectedRepository.stars,
        forks: selectedRepository.forks,
        watchers: selectedRepository.watchers,
        language: selectedRepository.language,
        description: selectedRepository.description,
        lastSynced: new Date(),
        createdAt: new Date(),
      })

      // Sync GitHub collaborators if enabled (non-blocking)
      if (collaborationType === "authorized" && syncGithubCollaborators) {
        fetch('/api/github/collaborators/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: projectRef.id })
        }).catch(err => console.error('Background GitHub sync failed:', err))
      }

      // Add manual collaborators
      if (collaborationType === "authorized" && manualCollaborators.length > 0) {
        Promise.all(manualCollaborators.map(collaborator =>
          addDoc(collection(db, "collaborations"), {
            project_id: projectRef.id,
            user_id: collaborator.id,
            role: "contributor",
            joined_at: serverTimestamp(),
            entry_type: 'manual_addition'
          })
        )).catch(err => console.error('Failed to add manual collaborators:', err))
      }

      // Add activity
      await addDoc(collection(db, "activities"), {
        user_id: user.uid,
        action_type: "created_project",
        related_entity: title,
        created_at: serverTimestamp(),
      })

      router.push("/projects")
    } catch (err: any) {
      setError(err.message || "Failed to create project")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New Project</h1>
          <p className="text-muted-foreground">Share your amazing work with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-lg p-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              {error}
            </div>
          )}

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

          <div>
            <label className="block text-sm font-medium mb-2">Project Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Project"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project, what it does, and why it's awesome..."
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={5}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">GitHub Repository</label>
            {selectedRepository ? (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {selectedRepository.name}
                        </h3>
                        {selectedRepository.private ? (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Globe className="w-4 h-4 text-muted-foreground" />
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {selectedRepository.language}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {selectedRepository.description || 'No description available'}
                      </p>

                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3" />
                          <span>{selectedRepository.stars}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <GitFork className="w-3 h-3" />
                          <span>{selectedRepository.forks}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{selectedRepository.watchers}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRepository(null)}
                      >
                        Change
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(selectedRepository.url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRepositorySelector(true)}
                className="w-full h-20 border-dashed border-2 border-border hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="text-center">
                  <Github className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Select GitHub Repository</p>
                  <p className="text-xs text-muted-foreground">Choose from your repositories</p>
                </div>
              </Button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Live URL (Optional)</label>
            <Input
              type="url"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://myproject.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-4">Technology Stack</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(showAllTech ? TECH_OPTIONS : TECH_OPTIONS.slice(0, 9)).map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => toggleTech(tech)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${selectedTech.includes(tech)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-foreground hover:border-primary"
                    }`}
                >
                  {tech}
                </button>
              ))}
            </div>
            {!showAllTech && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAllTech(true)}
                className="mt-3 w-full text-muted-foreground hover:text-foreground"
              >
                See more options...
              </Button>
            )}
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
                    <span className="block text-xs text-muted-foreground">When enabled, we can sync repo collaborators later from project settings.</span>
                  </div>
                </label>
              )}

              {collaborationType === "authorized" && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <label className="block text-sm font-medium mb-2">Add Contributors manually</label>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name, username, email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mb-4 bg-background border border-border rounded-lg overflow-hidden shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.photoURL || user.avatar_url} />
                              <AvatarFallback>{(user.displayName || user.username || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{user.displayName || user.username}</p>
                              <p className="text-xs text-muted-foreground">@{user.username}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => addManualCollaborator(user)}
                            className="h-8"
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Collaborators */}
                  {manualCollaborators.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Selected Contributors:</p>
                      <div className="flex flex-wrap gap-2">
                        {manualCollaborators.map((user) => (
                          <div key={user.id} className="flex items-center gap-2 bg-background border border-border rounded-full pl-1 pr-3 py-1">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={user.photoURL || user.avatar_url} />
                              <AvatarFallback className="text-[10px]">{(user.displayName || user.username || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{user.displayName || user.username}</span>
                            <button
                              type="button"
                              onClick={() => removeManualCollaborator(user.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableJourney}
                onChange={(e) => setEnableJourney(e.target.checked)}
                className="mt-1"
              />
              <div>
                <span className="block text-sm font-medium mb-1">Enable Project Journey</span>
                <span className="block text-xs text-muted-foreground">
                  Track and document your development journey as you build this project. This is perfect for projects you're starting from scratch or want to document your progress.
                </span>
              </div>
            </label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Creating..." : "Create Project"}
            </Button>
            <Link href="/projects" className="flex-1">
              <Button type="button" variant="outline" className="w-full bg-transparent">
                Cancel
              </Button>
            </Link>
          </div>
        </form>

        {/* Repository Selector Modal */}
        <RepositorySelector
          isOpen={showRepositorySelector}
          onClose={() => setShowRepositorySelector(false)}
          onSelect={setSelectedRepository}
          selectedRepository={selectedRepository}
        />
      </main>
    </div>
  )
}
