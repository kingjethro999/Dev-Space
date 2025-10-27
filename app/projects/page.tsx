"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

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

export default function ProjectsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)

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
        setProjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Project))
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
            <Link href="/discussions">
              <Button variant="ghost">Discussions</Button>
            </Link>
            <Link href={`/profile/${user.uid}`}>
              <Button variant="ghost">Profile</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Projects</h1>
              <p className="text-muted-foreground">Discover amazing projects from the community</p>
            </div>
            <div className="hidden lg:block">
              <Image
                src="/illustrations/Programming-amico.png"
                alt="Projects Illustration"
                width={200}
                height={150}
                className="rounded-lg"
              />
            </div>
          </div>
          <Link href="/projects/new">
            <Button>Create Project</Button>
          </Link>
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer h-full flex flex-col">
                  <h3 className="text-lg font-bold text-foreground mb-2">{project.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-grow">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tech_stack.slice(0, 3).map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                        {tech}
                      </span>
                    ))}
                    {project.tech_stack.length > 3 && (
                      <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                        +{project.tech_stack.length - 3}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {project.created_at?.toDate?.()?.toLocaleDateString() || "Recently"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
