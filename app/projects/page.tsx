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
  const pageSize = 9

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice((page-1)*pageSize, page*pageSize).map((project) => (
                <div key={project.id} className="bg-card border border-border rounded-lg p-0 hover:border-primary transition-colors cursor-pointer h-full flex flex-col overflow-hidden group relative">
                  {/* Micro actions top right */}
                  <div className="absolute top-3 right-3 z-10 flex gap-1 bg-card/90 rounded">
                    <Button variant="ghost" size="icon-sm" onClick={() => handleShare(project.id)}><Share2 className="w-4 h-4" /><span className="sr-only">Share to chat</span></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleCopyLink(project.id)}><Copy className="w-4 h-4" /><span className="sr-only">Copy link</span></Button>
                    {user?.uid === project.owner_id && (
                      <>
                        <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/projects/${project.id}/edit`)}><Edit className="w-4 h-4" /><span className="sr-only">Edit</span></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeletingId(project.id)}><Trash2 className="w-4 h-4 text-destructive" /><span className="sr-only">Delete</span></Button>
                      </>
                    )}
                  </div>
                  {/* Confirm delete popover */}
                  {deletingId === project.id && (
                    <div className="absolute top-14 right-3 bg-background border rounded shadow p-3 z-30">
                      <div>Delete this project?</div>
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(project.id)}>Delete</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeletingId("")}>Cancel</Button>
                      </div>
                    </div>
                  )}
                  <Link href={`/projects/${project.id}`}> {/* keep the rest of card clickable */}
                    <div>
                      <div className="w-full aspect-square bg-muted flex items-center justify-center">
                        {project.project_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={project.project_image_url} alt={project.title} className="w-full h-full object-cover" />
                        ) : (
                          <Briefcase className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-2">{project.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 flex-grow">{project.description}</p>
                        <TechBadgeList items={project.tech_stack} max={8} className="mb-4" />
                        <EmojiReactions parentId={project.id} collectionName="projects" />
                        <div className="flex items-center justify-between mt-3">
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
                              className="text-xs text-muted-foreground hover:text-primary cursor-pointer"
                            >
                              {userData[project.owner_id]?.username || "Unknown"}
                            </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
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
                      <PaginationPrevious onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p-1)) }} />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="px-3 text-sm text-muted-foreground">Page {page} of {Math.ceil(projects.length / pageSize)}</span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(Math.ceil(projects.length / pageSize), p+1)) }} />
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
