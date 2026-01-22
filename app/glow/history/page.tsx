"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { UniversalNav } from "@/components/universal-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, ArrowLeft, Trash2, Calendar, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { GlowAIChat } from "@/components/glow-ai-chat"
import { db } from "@/lib/firebase"
import { doc, getDoc, deleteDoc } from "firebase/firestore"

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function GlowHistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadHistory()
    }
  }, [user])

  const loadHistory = async () => {
    if (!user) return

    setLoadingHistory(true)
    try {
      const snap = await getDoc(doc(db, 'glow_chat_history', user.uid))
      const messages = snap.exists() ? snap.data()?.messages || [] : []
      if (Array.isArray(messages)) {
        const normalized = messages.map((msg: any) => ({
          role: msg?.role || 'user',
          content: msg?.content || '',
          timestamp: msg?.timestamp?.toDate
            ? msg.timestamp.toDate().toISOString()
            : msg?.timestamp?.seconds
              ? new Date(msg.timestamp.seconds * 1000).toISOString()
              : msg?.timestamp
                ? new Date(msg.timestamp).toISOString()
                : new Date().toISOString()
        }))
        setHistory(normalized)
      } else {
        setHistory([])
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const clearHistory = async () => {
    if (!user || !confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'glow_chat_history', user.uid))
      setHistory([])
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary rounded-full animate-spin border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Group messages into conversations (based on time gaps)
  const conversations: ChatMessage[][] = []
  let currentConversation: ChatMessage[] = []

  history.forEach((msg, index) => {
    if (index === 0) {
      currentConversation.push(msg)
    } else {
      const prevTime = new Date(history[index - 1].timestamp).getTime()
      const currTime = new Date(msg.timestamp).getTime()
      const gapMinutes = (currTime - prevTime) / (1000 * 60)

      // If gap is more than 30 minutes, start a new conversation
      if (gapMinutes > 30 && currentConversation.length > 0) {
        conversations.push(currentConversation)
        currentConversation = [msg]
      } else {
        currentConversation.push(msg)
      }
    }
  })

  if (currentConversation.length > 0) {
    conversations.push(currentConversation)
  }

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/discover">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Bot className="w-8 h-8" />
                Glow AI Chat History
              </h1>
              <p className="text-muted-foreground mt-1">
                View and manage your conversations with Glow AI
              </p>
            </div>
          </div>
          {history.length > 0 && (
            <Button
              variant="destructive"
              onClick={clearHistory}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>

        {loadingHistory ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary rounded-full animate-spin border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading chat history...</p>
          </div>
        ) : history.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Chat History</h3>
              <p className="text-muted-foreground mb-6">
                Start chatting with Glow AI to see your conversation history here
              </p>
              <Button onClick={() => router.push("/discover")}>
                Start Chatting
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {conversations.map((conversation, convIndex) => {
              const firstMessage = conversation[0]
              const lastMessage = conversation[conversation.length - 1]
              const startTime = new Date(firstMessage.timestamp)
              const endTime = new Date(lastMessage.timestamp)

              return (
                <Card key={convIndex} className="overflow-hidden">
                  <CardHeader className="border-b border-border">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="w-5 h-5" />
                        Conversation {convIndex + 1}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(startTime, { addSuffix: true })}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {conversation.length} messages • {formatDistanceToNow(endTime, { addSuffix: true })}
                    </p>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {conversation.map((msg, msgIndex) => (
                      <div
                        key={msgIndex}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-4 py-2 ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {msg.role === 'assistant' && (
                              <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            {msg.role === 'user' && (
                              <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      <GlowAIChat />
    </div>
  )
}

