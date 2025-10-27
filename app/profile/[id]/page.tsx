"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface UserProfile {
  username: string
  email: string
  bio: string
  skills: string[]
  avatar_url: string
  social_links: Record<string, string>
  created_at: any
}

interface Project {
  id: string
  title: string
  description: string
  tech_stack: string[]
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const profileId = params.id as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [pageLoading, setPageLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const isOwnProfile = user?.uid === profileId

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", profileId))
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile)
        }

        // Fetch user's projects
        const projectsQuery = query(collection(db, "projects"), where("owner_id", "==", profileId))
        const projectsSnapshot = await getDocs(projectsQuery)
        setProjects(projectsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Project))

        // Check if following
        if (user && !isOwnProfile) {
          const connectionQuery = query(
            collection(db, "connections"),
            where("follower_id", "==", user.uid),
            where("following_id", "==", profileId),
          )
          const connectionSnapshot = await getDocs(connectionQuery)
          setIsFollowing(connectionSnapshot.docs.length > 0)
        }

        // Fetch follower/following counts
        const followersQuery = query(collection(db, "connections"), where("following_id", "==", profileId))
        const followersSnapshot = await getDocs(followersQuery)
        setFollowerCount(followersSnapshot.docs.length)

        const followingQuery = query(collection(db, "connections"), where("follower_id", "==", profileId))
        const followingSnapshot = await getDocs(followingQuery)
        setFollowingCount(followingSnapshot.docs.length)
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setPageLoading(false)
      }
    }

    if (user && profileId) {
      fetchProfile()
    }
  }, [user, profileId, isOwnProfile])

  if (loading || pageLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">User not found</h1>
          <Link href="/feed">
            <Button>Back to Feed</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleFollowToggle = async () => {
    setActionLoading(true)
    try {
      if (isFollowing) {
        // Unfollow
        const connectionQuery = query(
          collection(db, "connections"),
          where("follower_id", "==", user.uid),
          where("following_id", "==", profileId),
        )
        const connectionSnapshot = await getDocs(connectionQuery)
        for (const doc of connectionSnapshot.docs) {
          await deleteDoc(doc.ref)
        }
        setIsFollowing(false)
        setFollowerCount((prev) => prev - 1)
      } else {
        // Follow
        await addDoc(collection(db, "connections"), {
          follower_id: user.uid,
          following_id: profileId,
          created_at: new Date(),
        })

        // Add activity
        await addDoc(collection(db, "activities"), {
          user_id: user.uid,
          action_type: "followed_user",
          related_entity: profile.username,
          created_at: new Date(),
        })

        setIsFollowing(true)
        setFollowerCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    } finally {
      setActionLoading(false)
    }
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
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-lg p-8 space-y-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{profile.username}</h1>
              <p className="text-muted-foreground mb-4">{profile.bio}</p>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-bold text-foreground">{followerCount}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </div>
                <div>
                  <span className="font-bold text-foreground">{followingCount}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </div>
                <div>
                  <span className="font-bold text-foreground">{projects.length}</span>
                  <span className="text-muted-foreground ml-1">Projects</span>
                </div>
              </div>
            </div>
            {!isOwnProfile && (
              <Button
                onClick={handleFollowToggle}
                disabled={actionLoading}
                variant={isFollowing ? "outline" : "default"}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
            {isOwnProfile && (
              <Link href={`/profile/${user.uid}/edit`}>
                <Button>Edit Profile</Button>
              </Link>
            )}
          </div>

          {profile.skills.length > 0 && (
            <div>
              <h3 className="font-bold mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <h3 className="font-bold mb-4">Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                      <h4 className="font-semibold text-foreground mb-2">{project.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {project.tech_stack.slice(0, 3).map((tech) => (
                          <span key={tech} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
