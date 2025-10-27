"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, getDocs, onSnapshot, type Query } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { formatDate } from "@/lib/activity-utils"

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

interface UserData {
  [key: string]: {
    username: string
  }
}

const CATEGORIES = ["General", "Help", "Showcase", "Discussion", "Question", "Feedback"]

export default function DiscussionsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [userData, setUserData] = useState<UserData>({})
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [discussionsLoading, setDiscussionsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return

    setDiscussionsLoading(true)
    let unsubscribe: (() => void) | null = null

    const setupListener = async () => {
      try {
        let q: Query

        if (selectedCategory === "All") {
          q = query(collection(db, "discussions"), orderBy("created_at", "desc"), limit(50))
        } else {
          q = query(collection(db, "discussions"), orderBy("created_at", "desc"), limit(50))
        }

        unsubscribe = onSnapshot(q, async (snapshot) => {
          let discussionsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Discussion[]

          // Filter by category if needed
          if (selectedCategory !== "All") {
            discussionsData = discussionsData.filter((d) => d.category === selectedCategory)
          }

          setDiscussions(discussionsData)

          // Fetch user data
          const userIds = [...new Set(discussionsData.map((d) => d.creator_id))]
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
          setDiscussionsLoading(false)
        })
      } catch (error) {
        console.error("Error setting up listener:", error)
        setDiscussionsLoading(false)
      }
    }

    setupListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [user, selectedCategory])

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
              <h1 className="text-3xl font-bold text-foreground mb-2">Discussions</h1>
              <p className="text-muted-foreground">Ask questions, share ideas, and learn from the community</p>
            </div>
            <div className="hidden lg:block">
              <Image
                src="/illustrations/Discussion-amico.png"
                alt="Discussions Illustration"
                width={200}
                height={150}
                className="rounded-lg"
              />
            </div>
          </div>
          <Link href="/discussions/new">
            <Button>Start Discussion</Button>
          </Link>
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
          {["All", ...CATEGORIES].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-foreground hover:border-primary"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {discussionsLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading discussions...</div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Image
              src="/illustrations/Discussion-cuate.png"
              alt="No Discussions"
              width={300}
              height={200}
              className="mx-auto mb-4 rounded-lg"
            />
            <p>No discussions yet. Be the first to start one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {discussions.map((discussion) => (
              <Link key={discussion.id} href={`/discussions/${discussion.id}`}>
                <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-foreground hover:text-primary">{discussion.title}</h3>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">{discussion.category}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{discussion.content}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex gap-4">
                      <span>by {userData[discussion.creator_id]?.username || "Unknown"}</span>
                      <span>{formatDate(discussion.created_at)}</span>
                    </div>
                    <div className="flex gap-4">
                      <span>{discussion.comment_count || 0} comments</span>
                      <span>{discussion.view_count || 0} views</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
