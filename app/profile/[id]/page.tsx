"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, orderBy, limit, onSnapshot } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { LogOut, Link2, Users } from "lucide-react"
import { UniversalNav } from "@/components/universal-nav"
import { TechStackStrip } from "@/components/tech-stack-strip"
import { TechBadgeList } from "@/components/tech-badge-list"
import { Switch } from "@/components/ui/switch"
import { Badge as UIBadge } from "@/components/ui/badge"
import { getUserAccomplishments, type Accomplishments, getUserBadgeProgress, type BadgePathProgress } from "@/lib/badge-utils"
import { BadgePill } from "@/components/badge-pill"
import { BadgeCard } from "@/components/badge-card"
import { ActivityItem } from "@/components/activity-item"
import { useTheme } from "next-themes"

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
  const { user, loading, logout } = useAuth()
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
  const [accomplishments, setAccomplishments] = useState<Accomplishments | null>(null)
  const [badgeProgress, setBadgeProgress] = useState<BadgePathProgress[] | null>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [profileUserData, setProfileUserData] = useState<any>(null)

  const isOwnProfile = user?.uid === profileId
  const { theme, setTheme } = useTheme()

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

        // Accomplishments (projects, interactions, journey entries, badges)
        const [acc, prog] = await Promise.all([
          getUserAccomplishments(profileId),
          getUserBadgeProgress(profileId),
        ])
        setAccomplishments(acc)
        setBadgeProgress(prog)

        // Fetch profile user data for activities
        const profileDoc = await getDoc(doc(db, "users", profileId))
        if (profileDoc.exists()) {
          const data = profileDoc.data()
          setProfileUserData({
            username: data.username,
            avatar_url: data.avatar_url,
          })
        }
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

  // Fetch activities for this user only
  useEffect(() => {
    if (!profileId) return

    const activitiesQuery = query(
      collection(db, "activities"),
      where("user_id", "==", profileId),
      orderBy("created_at", "desc"),
      limit(20),
    )

    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      const activitiesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setActivities(activitiesData)
    })

    return () => unsubscribe()
  }, [profileId])

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
          <Link href="/discover">
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
      <UniversalNav />

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar - Profile Info */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4 lg:sticky lg:top-8">
              <div className="flex flex-col items-center">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 mb-4">
                  <AvatarImage src={(profile as any).avatar_url || (profile as any).photoURL || "/placeholder.svg"} className="object-cover" />
                  <AvatarFallback className="text-xl md:text-2xl">{profile.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h1 className="text-xl md:text-2xl font-bold text-foreground text-center">{profile.username}</h1>
                {profile.bio && (
                  <p className="text-sm text-muted-foreground text-center mt-2">{profile.bio}</p>
                )}
              </div>

              {!isOwnProfile && (
                <Button
                  onClick={handleFollowToggle}
                  disabled={actionLoading}
                  variant={isFollowing ? "outline" : "default"}
                  className="w-full"
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
              {isOwnProfile && (
                <Link href={`/profile/${user.uid}/edit`} className="block">
                  <Button className="w-full">Edit Profile</Button>
                </Link>
              )}

              <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 pt-4 border-t border-border">
                <div className="flex flex-col lg:flex-row items-center lg:items-center gap-1 lg:gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{followerCount}</span>
                  <span className="text-muted-foreground text-xs lg:text-sm">followers</span>
                </div>
                <div className="flex flex-col lg:flex-row items-center lg:items-center gap-1 lg:gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{followingCount}</span>
                  <span className="text-muted-foreground text-xs lg:text-sm">following</span>
                </div>
                <div className="flex flex-col lg:flex-row items-center lg:items-center gap-1 lg:gap-2 text-sm">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{projects.length}</span>
                  <span className="text-muted-foreground text-xs lg:text-sm">projects</span>
                </div>
              </div>

              {profile.skills.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold text-sm mb-2">Skills</h3>
                  <TechBadgeList items={profile.skills} max={8} />
                </div>
              )}

              {(profile as any).social_links && Object.keys((profile as any).social_links).length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold text-sm mb-2">Links</h3>
                  <div className="space-y-2">
                    {Object.entries((profile as any).social_links).map(([key, value]: [string, any]) => (
                      <a
                        key={key}
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Link2 className="w-3 h-3" />
                        <span className="truncate">{value}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {isOwnProfile && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Theme</span>
                    <Switch
                      checked={theme !== 'light'}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={async () => {
                      await logout()
                    }}
                  >
                    <LogOut className="w-3 h-3 mr-2" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            {/* Badges Section */}
            {badgeProgress && (
              <div className="bg-card border border-border rounded-lg p-4 md:p-6">
                <h3 className="font-bold mb-4">Badges</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-3 mb-4">
                  {badgeProgress.map((p) => (
                    <BadgeCard key={p.category} progress={p} />
                  ))}
                </div>
                {accomplishments && accomplishments.badges.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Earned</h4>
                    <div className="flex flex-wrap gap-2">
                      {accomplishments.badges.slice(0, 12).map((b) => (
                        <BadgePill key={b.id} badge={b} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Projects Section */}
            {projects.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4 md:p-6">
                <h3 className="font-bold mb-4">Projects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {projects.map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="p-3 md:p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                        <h4 className="font-semibold text-foreground mb-2 text-sm md:text-base">{project.title}</h4>
                        <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                        <TechBadgeList items={project.tech_stack} max={6} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Feed Section */}
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <h3 className="font-bold mb-4">Activity</h3>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} user={profileUserData} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
