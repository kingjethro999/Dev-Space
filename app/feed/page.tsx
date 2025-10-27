"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, getDocs, where, onSnapshot, type Query } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { ActivityItem } from "@/components/activity-item"
import { SearchBar } from "@/components/search-bar"
import { NotificationsCenter } from "@/components/notifications-center"
import Link from "next/link"
import Image from "next/image"

interface Activity {
  id: string
  user_id: string
  action_type: string
  related_entity: string
  created_at: any
}

interface UserData {
  [key: string]: {
    username: string
    avatar_url?: string
  }
}

export default function FeedPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [userData, setUserData] = useState<UserData>({})
  const [feedLoading, setFeedLoading] = useState(true)
  const [feedType, setFeedType] = useState<"all" | "following">("all")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return

    setFeedLoading(true)
    let unsubscribe: (() => void) | null = null

    const setupFeedListener = async () => {
      try {
        let q: Query

        if (feedType === "following") {
          // Get followed users
          const connectionsQuery = query(collection(db, "connections"), where("follower_id", "==", user.uid))
          const connectionsSnapshot = await getDocs(connectionsQuery)
          const followedUserIds = connectionsSnapshot.docs.map((doc) => doc.data().following_id)

          if (followedUserIds.length === 0) {
            setActivities([])
            setFeedLoading(false)
            return
          }

          // Get activities from followed users
          q = query(
            collection(db, "activities"),
            where("user_id", "in", followedUserIds),
            orderBy("created_at", "desc"),
            limit(50),
          )
        } else {
          // Get all activities
          q = query(collection(db, "activities"), orderBy("created_at", "desc"), limit(50))
        }

        unsubscribe = onSnapshot(q, async (snapshot) => {
          const activitiesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Activity[]

          setActivities(activitiesData)

          // Fetch user data for all activities
          const userIds = [...new Set(activitiesData.map((a) => a.user_id))]
          const newUserData: UserData = { ...userData }

          for (const userId of userIds) {
            if (!newUserData[userId]) {
              try {
                const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", userId)))
                if (!userDoc.empty) {
                  const userData = userDoc.docs[0].data()
                  newUserData[userId] = {
                    username: userData.username,
                    avatar_url: userData.avatar_url,
                  }
                }
              } catch (error) {
                console.error("Error fetching user data:", error)
              }
            }
          }

          setUserData(newUserData)
          setFeedLoading(false)
        })
      } catch (error) {
        console.error("Error setting up feed listener:", error)
        setFeedLoading(false)
      }
    }

    setupFeedListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [user, feedType])

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
          <div className="flex gap-4 items-center flex-1 ml-8">
            <SearchBar />
          </div>
          <div className="flex gap-4 items-center">
            <NotificationsCenter />
            <Link href="/projects">
              <Button variant="ghost">Projects</Button>
            </Link>
            <Link href="/discover">
              <Button variant="ghost">Discover</Button>
            </Link>
            <Link href="/discussions">
              <Button variant="ghost">Discussions</Button>
            </Link>
            <Link href="/messages">
              <Button variant="ghost">Messages</Button>
            </Link>
            <Link href={`/profile/${user.uid}`}>
              <Button variant="ghost">Profile</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setFeedType("all")}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    feedType === "all"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-foreground hover:border-primary"
                  }`}
                >
                  All Activity
                </button>
                <button
                  onClick={() => setFeedType("following")}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    feedType === "following"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-foreground hover:border-primary"
                  }`}
                >
                  Following
                </button>
              </div>

              <h2 className="text-xl font-bold mb-4">Activity Feed</h2>
              {feedLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading activities...</div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Image
                    src="/illustrations/Developer-activity2.png"
                    alt="No Activities"
                    width={300}
                    height={200}
                    className="mx-auto mb-4 rounded-lg"
                  />
                  <p>
                    {feedType === "following"
                      ? "No activities from followed developers yet. Start following developers!"
                      : "No activities yet. Start by creating a project!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} user={userData[activity.user_id]} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/projects/new" className="block">
                  <Button className="w-full">Create Project</Button>
                </Link>
                <Link href="/discussions/new" className="block">
                  <Button variant="outline" className="w-full bg-transparent">
                    Start Discussion
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-bold mb-4">Your Profile</h3>
              <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
              <Link href={`/profile/${user.uid}`}>
                <Button variant="outline" className="w-full bg-transparent">
                  View Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
