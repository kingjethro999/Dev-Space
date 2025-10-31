"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UniversalNav } from "@/components/universal-nav"

interface User {
  id: string
  username: string
  avatar_url: string
  bio: string
}

export default function NewMessagePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setUsers([])
      return
    }

    setLoading(true)
    
    // Fetch all users and filter client-side for substring matching
    // Firestore prefix queries only work for exact prefixes, so we need to fetch and filter
    const usersRef = collection(db, "users")
    const snapshot = await getDocs(usersRef)
    
    const searchLower = searchQuery.toLowerCase().trim()
    const foundUsers = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as User)
      .filter((u) => {
        // Exclude current user
        if (u.id === user?.uid) {
          return false
        }
        
        // Case-insensitive substring matching in username, displayName, or email
        const username = (u.username || "").toLowerCase()
        const displayName = ((u as any).displayName || "").toLowerCase()
        const email = ((u as any).email || "").toLowerCase()
        
        return username.includes(searchLower) || 
               displayName.includes(searchLower) || 
               email.includes(searchLower)
      })
    
    setUsers(foundUsers)
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const startConversation = async (otherUser: User) => {
    if (!user) return

    // Check if conversation already exists
    const convosRef = collection(db, "conversations")
    const q = query(convosRef, where("participants", "array-contains", user.uid))
    const snapshot = await getDocs(q)

    const existingConvo = snapshot.docs.find((doc) => {
      const data = doc.data()
      return data.participants.includes(otherUser.id)
    })

    if (existingConvo) {
      router.push(`/messages/${existingConvo.id}`)
      return
    }

    // Create new conversation
    const convoData = {
      participants: [user.uid, otherUser.id],
      participantData: {
        [user.uid]: {
          username: user.displayName || user.email?.split("@")[0] || "User",
          avatar_url: user.photoURL || "",
        },
        [otherUser.id]: {
          username: otherUser.username,
          avatar_url: otherUser.avatar_url,
        },
      },
      last_message: "",
      last_message_at: serverTimestamp(),
      unread_count: {
        [user.uid]: 0,
        [otherUser.id]: 0,
      },
      created_at: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "conversations"), convoData)
    router.push(`/messages/${docRef.id}`)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <p className="text-muted-foreground">Please log in to send messages</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/messages">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Messages
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">New Message</h1>
        <p className="text-muted-foreground">Search for a developer to message</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : users.length === 0 && searchQuery ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No users found</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((foundUser) => (
            <Card
              key={foundUser.id}
              className="p-4 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => startConversation(foundUser)}
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={foundUser.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{foundUser.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{foundUser.username}</h3>
                  <p className="text-sm text-muted-foreground truncate">{foundUser.bio}</p>
                </div>
                <Button size="sm">Message</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
