"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Search, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UniversalNav } from "@/components/universal-nav"

interface Conversation {
  id: string
  participants: string[]
  participantData: { [key: string]: { username: string; avatar_url: string } }
  last_message: string
  last_message_at: any
  unread_count: { [key: string]: number }
}

export default function MessagesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid),
      orderBy("last_message_at", "desc"),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Conversation[]
      setConversations(convos)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const getOtherParticipant = (conversation: Conversation) => {
    const otherUserId = conversation.participants.find((id) => id !== user?.uid)
    return otherUserId ? conversation.participantData[otherUserId] : null
  }

  const filteredConversations = conversations.filter((convo) => {
    const otherUser = getOtherParticipant(convo)
    return otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <p className="text-muted-foreground">Please log in to view messages</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />
      <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Connect with other developers</p>
        </div>
        <Button asChild>
          <Link href="/messages/new">
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </Link>
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search conversations..."
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
      ) : filteredConversations.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2 text-base md:text-lg">No conversations yet</h3>
          <p className="text-muted-foreground mb-4 text-sm md:text-base">Start a conversation with other developers.</p>
          <Button asChild size="sm" className="mt-2">
            <Link href="/messages/new">Start Messaging</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conversation) => {
            const otherUser = getOtherParticipant(conversation)
            const unreadCount = conversation.unread_count?.[user.uid] || 0

            return (
              <Card
                key={conversation.id}
                className="p-4 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => router.push(`/messages/${conversation.id}`)}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={otherUser?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{otherUser?.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{otherUser?.username}</h3>
                      {unreadCount > 0 && (
                        <Badge variant="default" className="ml-auto">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conversation.last_message}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {conversation.last_message_at?.toDate().toLocaleDateString()}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
