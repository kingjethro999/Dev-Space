"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  increment,
} from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: any
  read: boolean
}

interface Conversation {
  id: string
  participants: string[]
  participantData: { [key: string]: { username: string; avatar_url: string } }
  unread_count: { [key: string]: number }
}

export default function ConversationPage() {
  const { user } = useAuth()
  const params = useParams()
  const conversationId = params.id as string
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || !conversationId) return

    // Load conversation
    const loadConversation = async () => {
      const convoDoc = await getDoc(doc(db, "conversations", conversationId))
      if (convoDoc.exists()) {
        setConversation({ id: convoDoc.id, ...convoDoc.data() } as Conversation)

        // Mark messages as read
        await updateDoc(doc(db, "conversations", conversationId), {
          [`unread_count.${user.uid}`]: 0,
        })
      }
    }
    loadConversation()

    // Listen to messages
    const q = query(
      collection(db, "messages"),
      where("conversation_id", "==", conversationId),
      orderBy("created_at", "asc"),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[]
      setMessages(msgs)
      setLoading(false)

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    })

    return () => unsubscribe()
  }, [user, conversationId])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newMessage.trim() || !conversation) return

    const otherUserId = conversation.participants.find((id) => id !== user.uid)

    await addDoc(collection(db, "messages"), {
      conversation_id: conversationId,
      sender_id: user.uid,
      content: newMessage.trim(),
      created_at: serverTimestamp(),
      read: false,
    })

    // Update conversation
    await updateDoc(doc(db, "conversations", conversationId), {
      last_message: newMessage.trim(),
      last_message_at: serverTimestamp(),
      [`unread_count.${otherUserId}`]: increment(1),
    })

    setNewMessage("")
  }

  const getOtherParticipant = () => {
    if (!conversation || !user) return null
    const otherUserId = conversation.participants.find((id) => id !== user.uid)
    return otherUserId ? conversation.participantData[otherUserId] : null
  }

  const otherUser = getOtherParticipant()

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
    <div className="flex flex-col h-screen">
      <div className="border-b bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/messages">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            {otherUser && (
              <>
                <Avatar>
                  <AvatarImage src={otherUser.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{otherUser.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{otherUser.username}</h2>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwn = message.sender_id === user.uid
                return (
                  <div key={message.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={isOwn ? user.photoURL || "" : otherUser?.avatar_url} />
                      <AvatarFallback>
                        {isOwn
                          ? (user.displayName || "U").slice(0, 2).toUpperCase()
                          : otherUser?.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${isOwn ? "text-right" : ""}`}>
                      <Card
                        className={`inline-block p-3 max-w-[70%] ${isOwn ? "bg-primary text-primary-foreground" : ""}`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </Card>
                      <p className="text-xs text-muted-foreground mt-1">
                        {message.created_at?.toDate().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
