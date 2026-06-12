"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, getDocs, where, doc, getDoc, deleteDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import Image from "next/image"
import { ShareToChatDialog } from "@/components/share-to-chat-dialog"
import { Edit, Trash2, Share2, Copy } from "lucide-react"
import { EmojiReactions } from "@/components/emoji-reactions"
import { Briefcase } from "lucide-react"
import { UniversalNav } from "@/components/universal-nav"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { TechStackStrip } from "@/components/tech-stack-strip"
import { TechBadgeList } from "@/components/tech-badge-list"
interface Project {
  id: string
  owner_id: string
  title: string
  description: string
  tech_stack: string[]
  repo_languages?: Record<string, number>
  github_url: string
  visibility: "public" | "private"
  created_at: any
  project_image_url?: string
}

interface UserData {
  [key: string]: {
    username: string
    avatar_url?: string
  }
}

export default function ProjectsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [userData, setUserData] = useState<UserData>({})
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareText, setShareText] = useState("")
  const [deletingId, setDeletingId] = useState<string>("")
  const [page, setPage] = useState(1)
  const pageSize = 8

  const handleShare = (projectId: string) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/projects/${projectId}` : `/projects/${projectId}`
    setShareText(`Check out this project: ${url}`)
    setShareOpen(true)
  }
  const handleCopyLink = (projectId: string) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/projects/${projectId}` : `/projects/${projectId}`
    navigator.clipboard.writeText(url)
  }
  const handleDelete = async (projectId: string) => {
    await deleteDoc(doc(db, "projects", projectId))
    setProjects(projects.filter(p => p.id !== projectId))
    setDeletingId("")
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const q = query(
          collection(db, "projects"),
          where("visibility", "==", "public"),
          orderBy("created_at", "desc"),
          limit(50),
        )
        const snapshot = await getDocs(q)
        const projectsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Project)
        setProjects(projectsData)

        // Fetch user data for owners
        const userIds = [...new Set(projectsData.map((p) => p.owner_id))]
        const newUserData: UserData = {}
        for (const userId of userIds) {
          try {
            const userDoc = await getDoc(doc(db, "users", userId))
            if (userDoc.exists()) {
              const userDocData = userDoc.data()
              newUserData[userId] = {
                username: userDocData.username,
                avatar_url: userDocData.avatar_url,
              }
            }
          } catch (error) {
            console.error("Error fetching user data:", error)
          }
        }
        setUserData(newUserData)
      } catch (error) {
        console.error("Error fetching projects:", error)
      } finally {
        setProjectsLoading(false)
      }
    }

    if (user) {
      fetchProjects()
    }
  }, [user])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Projects</h1>
              <p className="text-muted-foreground">Discover amazing projects from the community</p>
            </div>

          </div>
          <Link href="/projects/new">
            <Button>Create Project</Button>
          </Link>
        </div>

        {/* Tech strip removed per strategic usage request */}

        {projectsLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Image
              src="/illustrations/Startup-life.png"
              alt="No Projects"
              width={300}
              height={200}
              className="mx-auto mb-4 rounded-lg"
            />
            <p>No projects yet. Be the first to create one!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {projects.slice((page - 1) * pageSize, page * pageSize).map((project) => (
                <div key={project.id} className="bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl p-0 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden group relative h-full">
                  {/* Micro actions top right */}
                  <div className="absolute top-3 right-3 z-10 flex gap-1 bg-slate-900/85 backdrop-blur-sm border border-white/10 rounded-lg p-0.5 shadow">
                    <Button variant="ghost" size="icon-sm" onClick={() => handleShare(project.id)}><Share2 className="w-3.5 h-3.5" /><span className="sr-only">Share to chat</span></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleCopyLink(project.id)}><Copy className="w-3.5 h-3.5" /><span className="sr-only">Copy link</span></Button>
                    {user?.uid === project.owner_id && (
                      <>
                        <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/projects/${project.id}/edit`)}><Edit className="w-3.5 h-3.5" /><span className="sr-only">Edit</span></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeletingId(project.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /><span className="sr-only">Delete</span></Button>
                      </>
                    )}
                  </div>
                  {/* Confirm delete popover */}
                  {deletingId === project.id && (
                    <div className="absolute top-14 right-3 bg-slate-950 border border-white/10 rounded-xl shadow-lg p-3 z-30 text-xs">
                      <div className="text-white font-medium mb-2">Delete this project?</div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="destructive" size="sm" className="h-7 px-3 text-[10px]" onClick={() => handleDelete(project.id)}>Delete</Button>
                        <Button variant="ghost" size="sm" className="h-7 px-3 text-[10px]" onClick={() => setDeletingId("")}>Cancel</Button>
                      </div>
                    </div>
                  )}
                  <Link href={`/projects/${project.id}`} className="flex flex-col flex-1 h-full">
                    <div className="flex flex-col flex-grow justify-between h-full">
                      <div>
                        <div className="w-full aspect-video bg-muted/40 flex items-center justify-center overflow-hidden border-b border-border/40">
                          {project.project_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={project.project_image_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <Briefcase className="w-8 h-8 text-muted-foreground/60" />
                          )}
                        </div>
                        <div className="p-5">
                          <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">{project.title}</h3>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{project.description}</p>
                          <TechBadgeList items={project.tech_stack || (project.repo_languages ? Object.keys(project.repo_languages) : [])} max={3} className="mb-3" />
                        </div>
                      </div>
                      
                      <div className="px-5 pb-5 pt-0">
                        <EmojiReactions parentId={project.id} collectionName="projects" />
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={userData[project.owner_id]?.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>{(userData[project.owner_id]?.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/profile/${project.owner_id}`)
                              }}
                              className="text-[10px] text-muted-foreground hover:text-primary cursor-pointer font-medium"
                            >
                              {userData[project.owner_id]?.username || "Unknown"}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {project.created_at?.toDate?.()?.toLocaleDateString() || "Recently"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
            {Math.ceil(projects.length / pageSize) > 1 && (
              <div className="pt-6">
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
          </>
        )}
      </main>
      <ShareToChatDialog open={shareOpen} onOpenChange={setShareOpen} initialText={shareText} />
    </div>
  )
}
