"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, getDocs, onSnapshot, type Query, deleteDoc, doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import Image from "next/image"
import { formatDate } from "@/lib/activity-utils"
import { UniversalNav } from "@/components/universal-nav"
import { ShareToChatDialog } from "@/components/share-to-chat-dialog"
import { Share2, Copy, Edit, Trash2 } from "lucide-react"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { EmojiReactions } from "@/components/emoji-reactions"

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
  media?: { type: 'image'|'video'; url: string }[]
}

interface UserData {
  [key: string]: {
    username: string
    avatar_url?: string
    photoURL?: string
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
  const [shareOpen, setShareOpen] = useState(false)
  const [shareText, setShareText] = useState("")
  const [deletingId, setDeletingId] = useState<string>("")
  const [page, setPage] = useState(1)
  const pageSize = 10

  const shareDiscussion = (id: string) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/discussions/${id}` : `/discussions/${id}`
    setShareText(`Join this discussion: ${url}`)
    setShareOpen(true)
  }
  const copyDiscussion = (id: string) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/discussions/${id}` : `/discussions/${id}`
    navigator.clipboard.writeText(url)
  }
  const deleteDiscussion = async (id: string) => {
    await deleteDoc(doc(db, "discussions", id))
    setDiscussions(prev => prev.filter(d => d.id !== id))
    setDeletingId("")
  }

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
      <UniversalNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Discussions</h1>
              <p className="text-muted-foreground">Ask questions, share ideas, and learn from the community</p>
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
            {discussions.slice((page-1)*pageSize, page*pageSize).map((discussion) => (
              <div key={discussion.id} className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer relative group">
                <div className="absolute top-3 right-3 z-10 flex gap-1 bg-card/90 rounded">
                  <Button variant="ghost" size="icon-sm" onClick={(e) => { e.preventDefault(); shareDiscussion(discussion.id) }}><Share2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={(e) => { e.preventDefault(); copyDiscussion(discussion.id) }}><Copy className="w-4 h-4" /></Button>
                  {user?.uid === discussion.creator_id && (
                    <>
                      <Button variant="ghost" size="icon-sm" onClick={(e) => { e.preventDefault(); router.push(`/discussions/${discussion.id}`) }}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon-sm" onClick={(e) => { e.preventDefault(); setDeletingId(discussion.id) }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </>
                  )}
                </div>
                {deletingId === discussion.id && (
                  <div className="absolute top-14 right-3 bg-background border rounded shadow p-3 z-30">
                    <div>Delete this discussion?</div>
                    <div className="flex gap-2 mt-2 justify-end">
                      <Button variant="destructive" size="sm" onClick={(e) => { e.preventDefault(); deleteDiscussion(discussion.id) }}>Delete</Button>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); setDeletingId("") }}>Cancel</Button>
                    </div>
                  </div>
                )}
                <Link href={`/discussions/${discussion.id}`}>
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-foreground hover:text-primary">{discussion.title}</h3>
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">{discussion.category}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{discussion.content}</p>
                    {Array.isArray((discussion as any).media) && (discussion as any).media.length > 0 && (
                      <div className="mb-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {((discussion as any).media as {type:'image'|'video';url:string}[]).slice(0,6).map((m, i) => (
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
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={(userData[discussion.creator_id]?.avatar_url || userData[discussion.creator_id]?.photoURL) || "/placeholder.svg"} />
                            <AvatarFallback>{(userData[discussion.creator_id]?.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>by {userData[discussion.creator_id]?.username || "Unknown"}</span>
                        </div>
                        <span>{formatDate(discussion.created_at)}</span>
                      </div>
                      <div className="flex gap-4">
                        <span>{discussion.comment_count || 0} comments</span>
                        <span>{discussion.view_count || 0} views</span>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="mt-3">
                  <EmojiReactions parentId={discussion.id} collectionName="discussions" />
                </div>
              </div>
            ))}
            {Math.ceil(discussions.length / pageSize) > 1 && (
              <div className="pt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p-1)) }} />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="px-3 text-sm text-muted-foreground">Page {page} of {Math.ceil(discussions.length / pageSize)}</span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(Math.ceil(discussions.length / pageSize), p+1)) }} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </main>
      <ShareToChatDialog open={shareOpen} onOpenChange={setShareOpen} initialText={shareText} />
    </div>
  )
}
