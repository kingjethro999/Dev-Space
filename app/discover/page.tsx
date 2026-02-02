"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit, onSnapshot, type Query } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { formatDate } from "@/lib/activity-utils"
import { doc, getDoc } from "firebase/firestore"
import { UniversalNav } from "@/components/universal-nav"
import { Code2, MessageSquare, BookOpen, Users, TrendingUp, Lock, Grid3x3 } from "lucide-react"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { TechBadgeList } from "@/components/tech-badge-list"

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

interface Discussion {
  id: string
  creator_id: string
  title: string
  content: string
  category: string
  tags: string[]
  created_at: any
  view_count: number
  comment_count: number
}

interface JourneyEntry {
  id: string
  projectId: string
  userId: string
  title: string
  content: string
  tags: string[]
  timestamp: any
}

interface UserProfile {
  id: string
  username: string
  displayName?: string
  bio?: string
  avatar_url?: string
  skills?: string[]
  created_at?: any
}

interface UserData {
  [key: string]: {
    username: string
    avatar_url?: string
    photoURL?: string
  }
}

type ContentType = "all" | "projects" | "discussions" | "journeys" | "people" | "languages"

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
  "PHP",
  "Laravel",
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

  const [activeTab, setActiveTab] = useState<ContentType>("all")
  const [projects, setProjects] = useState<Project[]>([])
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [journeyEntries, setJourneyEntries] = useState<JourneyEntry[]>([])
  const [people, setPeople] = useState<UserProfile[]>([])
  const [trendingLanguages, setTrendingLanguages] = useState<{ language: string; count: number }[]>([])
  const [userData, setUserData] = useState<UserData>({})
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [selectedTechs, setSelectedTechs] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"recent" | "trending">("recent")
  const [discoverLoading, setDiscoverLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => { setPage(1) }, [activeTab])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  // Fetch projects
  useEffect(() => {
    if (!user || (activeTab !== "projects" && activeTab !== "all")) return

    setDiscoverLoading(true)
    let unsubscribe: (() => void) | null = null

    const setupListener = async () => {
      try {
        const q = query(
          collection(db, "projects"),
          where("visibility", "==", "public"),
          orderBy("created_at", "desc"),
          firestoreLimit(100),
        )

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
                const userDoc = await getDoc(doc(db, "users", userId))
                if (userDoc.exists()) {
                  const userDocData = userDoc.data()
                  newUserData[userId] = {
                    username: userDocData.username,
                    avatar_url: userDocData.avatar_url,
                    photoURL: userDocData.photoURL,
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
  }, [user, searchQuery, selectedTechs, sortBy, activeTab])

  // Fetch discussions
  useEffect(() => {
    if (!user || (activeTab !== "discussions" && activeTab !== "all")) return

    setDiscoverLoading(true)
    const loadDiscussions = async () => {
      try {
        const q = query(
          collection(db, "discussions"),
          orderBy("created_at", "desc"),
          firestoreLimit(50),
        )
        const snapshot = await getDocs(q)
        let discussionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Discussion[]

        // Filter by search query
        if (searchQuery.trim()) {
          const query_lower = searchQuery.toLowerCase()
          discussionsData = discussionsData.filter(
            (d) =>
              d.title.toLowerCase().includes(query_lower) ||
              d.content.toLowerCase().includes(query_lower) ||
              d.tags.some((tag) => tag.toLowerCase().includes(query_lower)),
          )
        }

        // Filter by selected technologies
        if (selectedTechs.length > 0) {
          discussionsData = discussionsData.filter((d) =>
            selectedTechs.some((tech) => d.tags.includes(tech)),
          )
        }

        setDiscussions(discussionsData)

        // Fetch user data
        const userIds = [...new Set(discussionsData.map((d) => d.creator_id))]
        const newUserData: UserData = { ...userData }

        for (const userId of userIds) {
          if (!newUserData[userId]) {
            try {
              const userDoc = await getDoc(doc(db, "users", userId))
              if (userDoc.exists()) {
                const userDocData = userDoc.data()
                newUserData[userId] = {
                  username: userDocData.username,
                  avatar_url: userDocData.avatar_url,
                  photoURL: userDocData.photoURL,
                }
              }
            } catch (error) {
              console.error("Error fetching user data:", error)
            }
          }
        }

        setUserData(newUserData)
        setDiscoverLoading(false)
      } catch (error) {
        console.error("Error fetching discussions:", error)
        setDiscoverLoading(false)
      }
    }

    loadDiscussions()
  }, [user, searchQuery, selectedTechs, activeTab])

  // Fetch journey entries
  useEffect(() => {
    if (!user || (activeTab !== "journeys" && activeTab !== "all")) return

    setDiscoverLoading(true)
    const loadJourneys = async () => {
      try {
        const q = query(
          collection(db, "journey_entries"),
          where("isPublic", "==", true),
          orderBy("timestamp", "desc"),
          firestoreLimit(50),
        )
        const snapshot = await getDocs(q)
        let entriesData = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
          }
        }) as JourneyEntry[]

        // Filter by search query
        if (searchQuery.trim()) {
          const query_lower = searchQuery.toLowerCase()
          entriesData = entriesData.filter(
            (e) =>
              e.title.toLowerCase().includes(query_lower) ||
              e.content.toLowerCase().includes(query_lower) ||
              e.tags.some((tag) => tag.toLowerCase().includes(query_lower)),
          )
        }

        // Filter by selected technologies
        if (selectedTechs.length > 0) {
          entriesData = entriesData.filter((e) =>
            selectedTechs.some((tech) => e.tags.includes(tech)),
          )
        }

        setJourneyEntries(entriesData)

        // Fetch user data
        const userIds = [...new Set(entriesData.map((e) => e.userId))]
        const newUserData: UserData = { ...userData }

        for (const userId of userIds) {
          if (!newUserData[userId]) {
            try {
              const userDoc = await getDoc(doc(db, "users", userId))
              if (userDoc.exists()) {
                const userDocData = userDoc.data()
                newUserData[userId] = {
                  username: userDocData.username,
                  avatar_url: userDocData.avatar_url,
                  photoURL: userDocData.photoURL,
                }
              }
            } catch (error) {
              console.error("Error fetching user data:", error)
            }
          }
        }

        setUserData(newUserData)
        setDiscoverLoading(false)
      } catch (error) {
        console.error("Error fetching journey entries:", error)
        setDiscoverLoading(false)
      }
    }

    loadJourneys()
  }, [user, searchQuery, selectedTechs, activeTab])

  // Fetch people
  useEffect(() => {
    if (!user || (activeTab !== "people" && activeTab !== "all")) return

    setDiscoverLoading(true)
    const loadPeople = async () => {
      try {
        const q = query(collection(db, "users"), firestoreLimit(100))
        const snapshot = await getDocs(q)
        let peopleData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((p: any) => p.username) as UserProfile[]

        // Filter by search query
        if (searchQuery.trim()) {
          const query_lower = searchQuery.toLowerCase()
          peopleData = peopleData.filter(
            (p) =>
              p.username.toLowerCase().includes(query_lower) ||
              p.displayName?.toLowerCase().includes(query_lower) ||
              p.bio?.toLowerCase().includes(query_lower) ||
              p.skills?.some((skill) => skill.toLowerCase().includes(query_lower)),
          )
        }

        // Filter by selected technologies (skills)
        if (selectedTechs.length > 0) {
          peopleData = peopleData.filter((p) =>
            selectedTechs.some((tech) => p.skills?.includes(tech)),
          )
        }

        setPeople(peopleData)
        setDiscoverLoading(false)
      } catch (error) {
        console.error("Error fetching people:", error)
        setDiscoverLoading(false)
      }
    }

    loadPeople()
  }, [user, searchQuery, selectedTechs, activeTab])

  // Calculate trending languages
  useEffect(() => {
    if (!user || activeTab !== "languages") return

    setDiscoverLoading(true)
    const calculateTrendingLanguages = async () => {
      try {
        const q = query(
          collection(db, "projects"),
          where("visibility", "==", "public"),
          firestoreLimit(500),
        )
        const snapshot = await getDocs(q)
        const languageCount: Record<string, number> = {}

        snapshot.docs.forEach((doc) => {
          const project = doc.data() as Project
          if (project.tech_stack) {
            project.tech_stack.forEach((tech) => {
              languageCount[tech] = (languageCount[tech] || 0) + 1
            })
          }
        })

        const trending = Object.entries(languageCount)
          .map(([language, count]) => ({ language, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20)

        setTrendingLanguages(trending)
        setDiscoverLoading(false)
      } catch (error) {
        console.error("Error calculating trending languages:", error)
        setDiscoverLoading(false)
      }
    }

    calculateTrendingLanguages()
  }, [user, activeTab])

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
      <UniversalNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Discover</h1>
              <p className="text-muted-foreground">Explore projects, discussions, journeys, people, and more</p>
            </div>
          </div>

          {/* Content Type Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto scrollbar-hide pb-px -mb-px">
            <Button
              variant="ghost"
              onClick={() => setActiveTab("all")}
              className={`rounded-none border-b-2 shrink-0 text-sm ${activeTab === "all" ? "border-primary" : "border-transparent"
                }`}
            >
              <Grid3x3 className="w-4 h-4 mr-1.5" />
              All
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab("projects")}
              className={`rounded-none border-b-2 shrink-0 text-sm ${activeTab === "projects" ? "border-primary" : "border-transparent"
                }`}
            >
              <Code2 className="w-4 h-4 mr-1.5" />
              Projects
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab("discussions")}
              className={`rounded-none border-b-2 shrink-0 text-sm ${activeTab === "discussions" ? "border-primary" : "border-transparent"
                }`}
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              Discussions
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab("journeys")}
              className={`rounded-none border-b-2 shrink-0 text-sm ${activeTab === "journeys" ? "border-primary" : "border-transparent"
                }`}
            >
              <BookOpen className="w-4 h-4 mr-1.5" />
              Journeys
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab("people")}
              className={`rounded-none border-b-2 shrink-0 text-sm ${activeTab === "people" ? "border-primary" : "border-transparent"
                }`}
            >
              <Users className="w-4 h-4 mr-1.5" />
              People
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab("languages")}
              className={`rounded-none border-b-2 shrink-0 text-sm whitespace-nowrap ${activeTab === "languages" ? "border-primary" : "border-transparent"
                }`}
            >
              <TrendingUp className="w-4 h-4 mr-1.5" />
              Trending
            </Button>
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
                placeholder={
                  activeTab === "all"
                    ? "Search all content..."
                    : activeTab === "projects"
                      ? "Search projects..."
                      : activeTab === "discussions"
                        ? "Search discussions..."
                        : activeTab === "journeys"
                          ? "Search journeys..."
                          : activeTab === "people"
                            ? "Search people..."
                            : "Search..."
                }
                className="w-full"
              />
            </div>

            {(activeTab === "projects" || activeTab === "all") && (
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
            )}

            {(activeTab === "all" || activeTab === "projects" || activeTab === "discussions" || activeTab === "journeys" || activeTab === "people") && (
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
            )}
          </div>

          <div className="lg:col-span-3">
            {discoverLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading {activeTab}...
              </div>
            ) : activeTab === "all" ? (
              <div className="space-y-12">
                {/* Projects Section */}
                {projects.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Code2 className="w-5 h-5 text-primary" />
                      <h2 className="text-2xl font-bold text-foreground">Projects</h2>
                      <span className="text-sm text-muted-foreground">({projects.length})</span>
                    </div>
                    <div className="space-y-4">
                      {projects.slice(0, 4).map((project) => (
                        <Link key={project.id} href={`/projects/${project.id}`}>
                          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-bold text-foreground hover:text-primary">{project.title}</h3>
                              {project.visibility === "private" && <Lock className="w-4 h-4 text-muted-foreground" />}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                            <TechBadgeList items={project.tech_stack} max={5} className="mb-4" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={(userData[project.owner_id]?.avatar_url || userData[project.owner_id]?.photoURL) || "/placeholder.svg"} />
                                  <AvatarFallback>{(userData[project.owner_id]?.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/profile/${project.owner_id}`)
                                  }}
                                  className="hover:text-primary cursor-pointer"
                                >
                                  by {userData[project.owner_id]?.username || "Unknown"}
                                </span>
                              </div>
                              <span>{formatDate(project.created_at)}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {projects.length > 4 && (
                      <div className="mt-4">
                        <Button
                          variant="ghost"
                          onClick={() => setActiveTab("projects")}
                          className="w-full"
                        >
                          View All Projects ({projects.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Discussions Section */}
                {discussions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <h2 className="text-2xl font-bold text-foreground">Discussions</h2>
                      <span className="text-sm text-muted-foreground">({discussions.length})</span>
                    </div>
                    <div className="space-y-4">
                      {discussions.slice(0, 4).map((discussion) => (
                        <Link key={discussion.id} href={`/discussions/${discussion.id}`}>
                          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-bold text-foreground hover:text-primary">{discussion.title}</h3>
                              <Badge variant="secondary">{discussion.category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{discussion.content}</p>
                            {Array.isArray((discussion as any).media) && (discussion as any).media.length > 0 && (
                              <div className="mb-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                                {((discussion as any).media as { type: 'image' | 'video'; url: string }[]).slice(0, 6).map((m, i) => (
                                  <div key={i} className="relative aspect-video overflow-hidden rounded border">
                                    {m.type === 'image' ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={m.url} alt="media" className="w-full h-full object-cover" />
                                    ) : (
                                      <video src={m.url} className="w-full h-full object-cover" muted controls />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {discussion.tags.slice(0, 5).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-5 h-5">
                                    <AvatarImage src={(userData[discussion.creator_id]?.avatar_url || userData[discussion.creator_id]?.photoURL) || "/placeholder.svg"} />
                                    <AvatarFallback>{(userData[discussion.creator_id]?.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push(`/profile/${discussion.creator_id}`)
                                    }}
                                    className="hover:text-primary cursor-pointer"
                                  >
                                    {userData[discussion.creator_id]?.username || "Unknown"}
                                  </span>
                                </div>
                                <span>{discussion.comment_count || 0} comments</span>
                                <span>{discussion.view_count || 0} views</span>
                              </div>
                              <span>{formatDate(discussion.created_at)}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {discussions.length > 4 && (
                      <div className="mt-4">
                        <Button
                          variant="ghost"
                          onClick={() => setActiveTab("discussions")}
                          className="w-full"
                        >
                          View All Discussions ({discussions.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Journey Entries Section */}
                {journeyEntries.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <h2 className="text-2xl font-bold text-foreground">Journey Entries</h2>
                      <span className="text-sm text-muted-foreground">({journeyEntries.length})</span>
                    </div>
                    <div className="space-y-4">
                      {journeyEntries.slice(0, 4).map((entry) => (
                        <Link key={entry.id} href={`/projects/${entry.projectId}/journey`}>
                          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-bold text-foreground hover:text-primary">{entry.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{entry.content}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {entry.tags.slice(0, 5).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={(userData[entry.userId]?.avatar_url || userData[entry.userId]?.photoURL) || "/placeholder.svg"} />
                                  <AvatarFallback>{(userData[entry.userId]?.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/profile/${entry.userId}`)
                                  }}
                                  className="hover:text-primary cursor-pointer"
                                >
                                  {userData[entry.userId]?.username || "Unknown"}
                                </span>
                              </div>
                              <span>{formatDate(entry.timestamp)}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {journeyEntries.length > 4 && (
                      <div className="mt-4">
                        <Button
                          variant="ghost"
                          onClick={() => setActiveTab("journeys")}
                          className="w-full"
                        >
                          View All Journey Entries ({journeyEntries.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* People Section */}
                {people.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-primary" />
                      <h2 className="text-2xl font-bold text-foreground">People</h2>
                      <span className="text-sm text-muted-foreground">({people.length})</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {people.slice(0, 6).map((person) => (
                        <Link key={person.id} href={`/profile/${person.id}`}>
                          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                            <div className="flex items-start gap-4 mb-3">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={person.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>{(person.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-bold text-foreground hover:text-primary">
                                  {person.displayName || person.username}
                                </h3>
                                <p className="text-sm text-muted-foreground">@{person.username}</p>
                              </div>
                            </div>
                            {person.bio && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{person.bio}</p>
                            )}
                            {person.skills && person.skills.length > 0 && (
                              <TechBadgeList items={person.skills} max={8} />
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                    {people.length > 6 && (
                      <div className="mt-4">
                        <Button
                          variant="ghost"
                          onClick={() => setActiveTab("people")}
                          className="w-full"
                        >
                          View All People ({people.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {projects.length === 0 && discussions.length === 0 && journeyEntries.length === 0 && people.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Grid3x3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No content found. Try adjusting your filters or search query.</p>
                  </div>
                )}
              </div>
            ) : activeTab === "projects" ? (
              projects.length === 0 ? (
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
                  {projects.slice((page - 1) * pageSize, page * pageSize).map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-foreground hover:text-primary">{project.title}</h3>
                          {project.visibility === "private" && <Lock className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                        <TechBadgeList items={project.tech_stack} max={9} className="mb-4" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={(userData[project.owner_id]?.avatar_url || userData[project.owner_id]?.photoURL) || "/placeholder.svg"} />
                              <AvatarFallback>{(userData[project.owner_id]?.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/profile/${project.owner_id}`)
                              }}
                              className="hover:text-primary cursor-pointer"
                            >
                              by {userData[project.owner_id]?.username || "Unknown"}
                            </span>
                          </div>
                          <span>{formatDate(project.created_at)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {Math.ceil(projects.length / pageSize) > 1 && (
                    <div className="pt-4">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)) }} />
                          </PaginationItem>
                          <PaginationItem>
                            <span className="px-3 text-sm text-muted-foreground">Page {page} of {Math.ceil(projects.length / pageSize)}</span>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationNext onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(Math.ceil(projects.length / pageSize), p + 1)) }} />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </div>
              )
            ) : activeTab === "discussions" ? (
              discussions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No discussions found. Try adjusting your filters or search query.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Found {discussions.length} discussion{discussions.length !== 1 ? "s" : ""}
                  </p>
                  {discussions.slice((page - 1) * pageSize, page * pageSize).map((discussion) => (
                    <Link key={discussion.id} href={`/discussions/${discussion.id}`}>
                      <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-foreground hover:text-primary">{discussion.title}</h3>
                          <Badge variant="secondary">{discussion.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{discussion.content}</p>
                        {Array.isArray((discussion as any).media) && (discussion as any).media.length > 0 && (
                          <div className="mb-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                            {((discussion as any).media as { type: 'image' | 'video'; url: string }[]).slice(0, 6).map((m, i) => (
                              <div key={i} className="relative aspect-video overflow-hidden rounded border">
                                {m.type === 'image' ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={m.url} alt="media" className="w-full h-full object-cover" />
                                ) : (
                                  <video src={m.url} className="w-full h-full object-cover" muted controls />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {discussion.tags.slice(0, 5).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={(userData[discussion.creator_id]?.avatar_url || userData[discussion.creator_id]?.photoURL) || "/placeholder.svg"} />
                                <AvatarFallback>{(userData[discussion.creator_id]?.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/profile/${discussion.creator_id}`)
                                }}
                                className="hover:text-primary cursor-pointer"
                              >
                                {userData[discussion.creator_id]?.username || "Unknown"}
                              </span>
                            </div>
                            <span>{discussion.comment_count || 0} comments</span>
                            <span>{discussion.view_count || 0} views</span>
                          </div>
                          <span>{formatDate(discussion.created_at)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {Math.ceil(discussions.length / pageSize) > 1 && (
                    <div className="pt-4">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)) }} />
                          </PaginationItem>
                          <PaginationItem>
                            <span className="px-3 text-sm text-muted-foreground">Page {page} of {Math.ceil(discussions.length / pageSize)}</span>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationNext onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(Math.ceil(discussions.length / pageSize), p + 1)) }} />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </div>
              )
            ) : activeTab === "journeys" ? (
              journeyEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No journey entries found. Try adjusting your filters or search query.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Found {journeyEntries.length} journey entr{journeyEntries.length !== 1 ? "ies" : "y"}
                  </p>
                  {journeyEntries.map((entry) => (
                    <Link key={entry.id} href={`/projects/${entry.projectId}/journey`}>
                      <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-foreground hover:text-primary">{entry.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{entry.content}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {entry.tags.slice(0, 5).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={(userData[entry.userId]?.avatar_url || userData[entry.userId]?.photoURL) || "/placeholder.svg"} />
                              <AvatarFallback>{(userData[entry.userId]?.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/profile/${entry.userId}`)
                              }}
                              className="hover:text-primary cursor-pointer"
                            >
                              {userData[entry.userId]?.username || "Unknown"}
                            </span>
                          </div>
                          <span>{formatDate(entry.timestamp)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : activeTab === "people" ? (
              people.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No people found. Try adjusting your filters or search query.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Found {people.length} person{people.length !== 1 ? "s" : ""}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {people.map((person) => (
                      <Link key={person.id} href={`/profile/${person.id}`}>
                        <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                          <div className="flex items-start gap-4 mb-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={person.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>{(person.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-bold text-foreground hover:text-primary">
                                {person.displayName || person.username}
                              </h3>
                              <p className="text-sm text-muted-foreground">@{person.username}</p>
                            </div>
                          </div>
                          {person.bio && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{person.bio}</p>
                          )}
                          {person.skills && person.skills.length > 0 && (
                            <TechBadgeList items={person.skills} max={8} />
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            ) : activeTab === "languages" ? (
              trendingLanguages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No trending languages found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Top {trendingLanguages.length} trending programming languages
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trendingLanguages.map((item, index) => (
                      <div
                        key={item.language}
                        className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                            <h3 className="text-lg font-bold text-foreground">{item.language}</h3>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Used in {item.count} project{item.count !== 1 ? "s" : ""}
                        </p>
                        <div className="mt-3 w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{
                              width: `${(item.count / trendingLanguages[0].count) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
