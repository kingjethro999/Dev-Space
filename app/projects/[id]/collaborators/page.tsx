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
  limit,
  setDoc,
  updateDoc,
} from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, X, Search, Github } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { UniversalNav } from "@/components/universal-nav"
import { getRepoCollaborators } from "@/lib/github-utils"
import { approveJourneyEntry, rejectJourneyEntry } from "@/lib/journey-utils"

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
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [syncing, setSyncing] = useState(false)
  const [pendingEntries, setPendingEntries] = useState<any[]>([])
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    const fetchProject = async () => {
      const projectDoc = await getDoc(doc(db, "projects", projectId))
      if (projectDoc.exists()) {
        const projectData = { id: projectDoc.id, ...projectDoc.data() } as any
        setProject(projectData)

        if (user?.uid !== (projectData as any).owner_id) {
          router.push(`/projects/${projectId}`)
        }
        setLastSync((projectData as any).last_github_sync_at?.toDate?.() || null)
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

  useEffect(() => {
    if (!projectId) return

    const qReq = query(collection(db, 'collaboration_requests'), where('project_id', '==', projectId))
    const unsubReq = onSnapshot(qReq, (snap) => {
      setPendingRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })

    const qEntries = query(collection(db, 'journey_entries'), where('projectId', '==', projectId), where('status', '==', 'pending'))
    const unsubEntries = onSnapshot(qEntries, (snap) => {
      setPendingEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })

    return () => { unsubReq(); unsubEntries() }
  }, [projectId])

  const searchUsers = async () => {
    // Skip search if it's a mention (starts with @ and is part of mention autocomplete)
    if (searchQuery.includes("@") && searchQuery.match(/\s@\w/)) {
      return
    }

    // Extract search term (remove @ if present at start)
    const searchTerm = searchQuery.startsWith("@") ? searchQuery.slice(1) : searchQuery
    
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    // Fetch users and filter client-side for substring matching
    // Firestore prefix queries only work for exact prefixes, so we need to fetch and filter
    const usersRef = collection(db, "users")
    const snapshot = await getDocs(usersRef)
    
    const searchLower = searchTerm.toLowerCase().trim()
    const existingCollaboratorIds = collaborators.map((c) => c.user_id)
    
    const results = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as any))
      .filter((u: any) => {
        // Exclude current user and existing collaborators
        if (u.id === user?.uid || u.id === project?.owner_id || existingCollaboratorIds.includes(u.id)) {
          return false
        }
        
        // Case-insensitive substring matching in username, displayName, or email
        const username = (u.username || "").toLowerCase()
        const displayName = (u.displayName || "").toLowerCase()
        const email = (u.email || "").toLowerCase()
        
        return username.includes(searchLower) || 
               displayName.includes(searchLower) || 
               email.includes(searchLower)
      })

    setSearchResults(results)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const addCollaborator = async (userId: string, role: "contributor" | "viewer") => {
    const collabId = `${projectId}_${userId}`
    await setDoc(doc(db, "collaborations", collabId), {
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
    // collabId is `${projectId}_${userId}`
    await updateDoc(doc(db, "collaborations", collabId), { role: newRole })
  }

  const approveRequest = async (requestId: string, requesterId: string) => {
    const collabId = `${projectId}_${requesterId}`
    await setDoc(doc(db, "collaborations", collabId), {
      project_id: projectId,
      user_id: requesterId,
      role: "contributor",
      joined_at: serverTimestamp(),
    })
    await deleteDoc(doc(db, 'collaboration_requests', requestId))
  }

  const declineRequest = async (requestId: string) => {
    await deleteDoc(doc(db, 'collaboration_requests', requestId))
  }

  const syncFromGitHub = async () => {
    if (!project || !user) return
    if (!project.github_repo_full_name && !project.github_url) return
    setSyncing(true)
    try {
      const res = await fetch('/api/github/collaborators/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) })
      const json = await res.json()
      if (json.ok) {
        setLastSync(new Date())
      }
    } catch (e) {
      console.error('GitHub sync failed:', e)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!project || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/projects/${projectId}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Collaborators</h1>
        <p className="text-muted-foreground">Manage who can contribute to {project.title}</p>
        {project.collaboration_type && (
          <p className="text-xs text-muted-foreground mt-1">Mode: <span className="font-medium">{project.collaboration_type}</span></p>
        )}
      </div>

      {project.collaboration_type === 'authorized' && project.collaboration_sync_github && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Sync GitHub Collaborators</h3>
              <p className="text-sm text-muted-foreground">Import collaborators from the linked GitHub repository.</p>
              {lastSync && (
                <p className="text-xs text-muted-foreground mt-1">Last synced: {lastSync.toLocaleString()}</p>
              )}
            </div>
            <Button size="sm" onClick={syncFromGitHub} disabled={syncing}>
              <Github className="w-4 h-4 mr-2" /> {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </Card>
      )}

      {project.collaboration_type === 'authorized' && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending requests</p>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">User</span> requested to collaborate
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveRequest(req.id, req.requester_id)}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => declineRequest(req.id)}>Decline</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {project.collaboration_type !== 'solo' && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Moderation Queue</h2>
          {pendingEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending contributions</p>
          ) : (
            <div className="space-y-3">
              {pendingEntries.map((entry) => (
                <div key={entry.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{entry.title}</div>
                    <div className="text-xs text-muted-foreground">{entry.type}</div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{entry.content}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={async () => { await approveJourneyEntry(entry.id, user!.uid) }}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={async () => { await rejectJourneyEntry(entry.id, user!.uid) }}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Add Collaborator</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10 pointer-events-none" />
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type @username to search or enter a name/email..."
              className="pl-10 w-full"
            />
          </div>
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
    </div>
  )
}
