"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { doc, getDoc } from "firebase/firestore"
import { UniversalNav } from "@/components/universal-nav"

interface Entry {
  id: string
  projectId: string
  userId: string
  title: string
  content: string
  tags: string[]
  language?: string
  timestamp: any
}

interface UserData {
  [key: string]: {
    username: string
    avatar_url?: string
  }
}

export default function JourneysFeedPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [userData, setUserData] = useState<UserData>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, "journey_entries"),
          where("isPublic", "==", true),
          orderBy("timestamp", "desc"),
          limit(50)
        )
        const snap = await getDocs(q)
        const list = snap.docs.map((d) => {
          const data = d.data() as any
          return {
            id: d.id,
            ...data,
            timestamp: data.timestamp?.toDate?.() || new Date(),
          } as Entry
        })
        setEntries(list)

        // Fetch user data
        const userIds = [...new Set(list.map((e) => e.userId).filter(Boolean))]
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
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />
      <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Latest developer journeys</h1>
      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="text-muted-foreground">No public journey entries yet.</div>
      ) : (
        <div className="space-y-4">
          {entries.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={userData[e.userId]?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{(userData[e.userId]?.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Link href={`/profile/${e.userId}`} className="text-sm font-semibold text-primary hover:underline">
                      {userData[e.userId]?.username || "Unknown"}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(e.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-base">{e.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 line-clamp-3">{e.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {(e.tags || []).slice(0,5).map((t) => (
                      <span key={t} className="text-xs px-2 py-1 bg-muted rounded">#{t}</span>
                    ))}
                  </div>
                  <Link href={`/projects/${e.projectId}/journey`} className="text-primary text-sm">View Journey</Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}


