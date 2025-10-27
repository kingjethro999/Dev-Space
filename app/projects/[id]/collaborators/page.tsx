"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, X, Search } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

interface Collaborator {
  id: string
  project_id: string
  user_id: string
  role: "owner" | "contributor" | "viewer"
  joined_at: any
}

interface UserData {
  username: string
  avatar_url?: string
  email?: string
}

export default function CollaboratorsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<any>(null)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [userData, setUserData] = useState<{ [key: string]: UserData }>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      const projectDoc = await getDoc(doc(db, "projects", projectId))
      if (projectDoc.exists()) {
        const projectData = { id: projectDoc.id, ...projectDoc.data() }
        setProject(projectData)

        if (user?.uid !== projectData.owner_id) {
          router.push(`/projects/${projectId}`)
        }
      }
      setLoading(false)
    }
    fetchProject()
  }, [projectId, user, router])

  useEffect(() => {
    if (!projectId) return

    const q = query(collection(db, "collaborations"), where("project_id", "==", projectId))

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const collabsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Collaborator[]
      setCollaborators(collabsData)

      const userIds = [...new Set(collabsData.map((c) => c.user_id))]
      if (project?.owner_id) {
        userIds.push(project.owner_id)
      }

      const newUserData: { [key: string]: UserData } = { ...userData }
      for (const userId of userIds) {
        if (!newUserData[userId]) {
          const userDoc = await getDoc(doc(db, "users", userId))
          if (userDoc.exists()) {
            newUserData[userId] = userDoc.data() as UserData
          }
        }
      }
      setUserData(newUserData)
    })

    return () => unsubscribe()
  }, [projectId, project])

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const usersRef = collection(db, "users")
    const q = query(usersRef, where("username", ">=", searchQuery), where("username", "<=", searchQuery + "\uf8ff"))
    const snapshot = await getDocs(q)

    const existingCollaboratorIds = collaborators.map((c) => c.user_id)
    const results = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((u) => u.id !== user?.uid && u.id !== project?.owner_id && !existingCollaboratorIds.includes(u.id))

    setSearchResults(results)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const addCollaborator = async (userId: string, role: "contributor" | "viewer") => {
    await addDoc(collection(db, "collaborations"), {
      project_id: projectId,
      user_id: userId,
      role,
      joined_at: serverTimestamp(),
    })

    await addDoc(collection(db, "activities"), {
      user_id: user?.uid,
      action_type: "added_collaborator",
      related_entity: `${project?.title}`,
      created_at: serverTimestamp(),
    })

    setSearchQuery("")
    setSearchResults([])
  }

  const removeCollaborator = async (collabId: string) => {
    await deleteDoc(doc(db, "collaborations", collabId))
  }

  const updateRole = async (collabId: string, newRole: "contributor" | "viewer") => {
    const collabRef = doc(db, "collaborations", collabId)
    await deleteDoc(collabRef)
    const collab = collaborators.find((c) => c.id === collabId)
    if (collab) {
      await addDoc(collection(db, "collaborations"), {
        project_id: projectId,
        user_id: collab.user_id,
        role: newRole,
        joined_at: serverTimestamp(),
      })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!project || !user) {
    return null
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/projects/${projectId}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Collaborators</h1>
        <p className="text-muted-foreground">Manage who can contribute to {project.title}</p>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Collaborator</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((foundUser) => (
              <div key={foundUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={foundUser.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{foundUser.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{foundUser.username}</p>
                    <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => addCollaborator(foundUser.id, "contributor")}>
                    Add as Contributor
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addCollaborator(foundUser.id, "viewer")}>
                    Add as Viewer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Current Collaborators</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={userData[project.owner_id]?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{userData[project.owner_id]?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{userData[project.owner_id]?.username}</p>
                <p className="text-sm text-muted-foreground">Project Owner</p>
              </div>
            </div>
            <Badge>Owner</Badge>
          </div>

          {collaborators.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No collaborators yet</p>
          ) : (
            collaborators.map((collab) => {
              const collabUser = userData[collab.user_id]
              return (
                <div key={collab.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={collabUser?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{collabUser?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{collabUser?.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined {collab.joined_at?.toDate?.()?.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={collab.role} onValueChange={(value) => updateRole(collab.id, value as any)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contributor">Contributor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" onClick={() => removeCollaborator(collab.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}
