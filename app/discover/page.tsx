"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, type Query } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"
import { formatDate } from "@/lib/activity-utils"

interface Project {
  id: string
  owner_id: string
  title: string
  description: string
  tech_stack: string[]
  github_url: string
  visibility: "public" | "private"
  created_at: any
}

interface UserData {
  [key: string]: {
    username: string
  }
}

const TECH_FILTERS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Vue.js",
  "Node.js",
  "Python",
  "Java",
  "Go",
  "Rust",
  "PostgreSQL",
  "MongoDB",
  "Firebase",
  "AWS",
  "Docker",
]

export default function DiscoverPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [projects, setProjects] = useState<Project[]>([])
  const [userData, setUserData] = useState<UserData>({})
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [selectedTechs, setSelectedTechs] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"recent" | "trending">("recent")
  const [discoverLoading, setDiscoverLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return

    setDiscoverLoading(true)
    let unsubscribe: (() => void) | null = null

    const setupListener = async () => {
      try {
        let q: Query

        if (sortBy === "trending") {
          q = query(
            collection(db, "projects"),
            where("visibility", "==", "public"),
            orderBy("created_at", "desc"),
            limit(100),
          )
        } else {
          q = query(
            collection(db, "projects"),
            where("visibility", "==", "public"),
            orderBy("created_at", "desc"),
            limit(100),
          )
        }

        unsubscribe = onSnapshot(q, async (snapshot) => {
          let projectsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Project[]

          // Filter by search query
          if (searchQuery.trim()) {
            const query_lower = searchQuery.toLowerCase()
            projectsData = projectsData.filter(
              (p) =>
                p.title.toLowerCase().includes(query_lower) ||
                p.description.toLowerCase().includes(query_lower) ||
                p.tech_stack.some((tech) => tech.toLowerCase().includes(query_lower)),
            )
          }

          // Filter by selected technologies
          if (selectedTechs.length > 0) {
            projectsData = projectsData.filter((p) => selectedTechs.some((tech) => p.tech_stack.includes(tech)))
          }

          // Sort by trending (view count or recent activity)
          if (sortBy === "trending") {
            projectsData.sort((a, b) => {
              const aDate = a.created_at?.toDate?.() || new Date(a.created_at)
              const bDate = b.created_at?.toDate?.() || new Date(b.created_at)
              return bDate.getTime() - aDate.getTime()
            })
          }

          setProjects(projectsData)

          // Fetch user data
          const userIds = [...new Set(projectsData.map((p) => p.owner_id))]
          const newUserData: UserData = { ...userData }

          for (const userId of userIds) {
            if (!newUserData[userId]) {
              try {
                const userDocs = await getDocs(query(collection(db, "users")))
                const userDoc = userDocs.docs.find((doc) => doc.id === userId)
                if (userDoc) {
                  newUserData[userId] = {
                    username: userDoc.data().username,
                  }
                }
              } catch (error) {
                console.error("Error fetching user data:", error)
              }
            }
          }

          setUserData(newUserData)
          setDiscoverLoading(false)
        })
      } catch (error) {
        console.error("Error setting up listener:", error)
        setDiscoverLoading(false)
      }
    }

    setupListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [user, searchQuery, selectedTechs, sortBy])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  const toggleTech = (tech: string) => {
    setSelectedTechs((prev) => (prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]))
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/feed" className="text-2xl font-bold text-primary">
            Dev Space
          </Link>
          <div className="flex gap-4">
            <Link href="/feed">
              <Button variant="ghost">Feed</Button>
            </Link>
            <Link href="/projects">
              <Button variant="ghost">Projects</Button>
            </Link>
            <Link href="/discover">
              <Button variant="ghost">Discover</Button>
            </Link>
            <Link href={`/profile/${user.uid}`}>
              <Button variant="ghost">Profile</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Discover Projects</h1>
              <p className="text-muted-foreground">Explore amazing projects from the community</p>
            </div>
            <div className="hidden lg:block">
              <Image
                src="/illustrations/Innovation-amico.png"
                alt="Innovation Illustration"
                width={200}
                height={150}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-bold mb-4">Search</h3>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full"
              />
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-bold mb-4">Sort By</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="recent"
                    checked={sortBy === "recent"}
                    onChange={(e) => setSortBy(e.target.value as "recent" | "trending")}
                  />
                  <span className="text-sm">Most Recent</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="trending"
                    checked={sortBy === "trending"}
                    onChange={(e) => setSortBy(e.target.value as "recent" | "trending")}
                  />
                  <span className="text-sm">Trending</span>
                </label>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-bold mb-4">Technologies</h3>
              <div className="space-y-2">
                {TECH_FILTERS.map((tech) => (
                  <label key={tech} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedTechs.includes(tech)} onChange={() => toggleTech(tech)} />
                    <span className="text-sm">{tech}</span>
                  </label>
                ))}
              </div>
              {selectedTechs.length > 0 && (
                <Button
                  onClick={() => setSelectedTechs([])}
                  variant="outline"
                  className="w-full mt-4 bg-transparent"
                  size="sm"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            {discoverLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Image
                  src="/illustrations/Programming.png"
                  alt="No Projects Found"
                  width={300}
                  height={200}
                  className="mx-auto mb-4 rounded-lg"
                />
                <p>No projects found. Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Found {projects.length} project{projects.length !== 1 ? "s" : ""}
                </p>
                {projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-foreground hover:text-primary">{project.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tech_stack.slice(0, 5).map((tech) => (
                          <span key={tech} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                            {tech}
                          </span>
                        ))}
                        {project.tech_stack.length > 5 && (
                          <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                            +{project.tech_stack.length - 5}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>by {userData[project.owner_id]?.username || "Unknown"}</span>
                        <span>{formatDate(project.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
