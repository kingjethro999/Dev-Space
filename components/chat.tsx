"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { subscribeToMessages, sendMessage, markMessageAsRead, type Message } from "@/lib/realtime-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Paperclip, Smile } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ChatProps {
  otherUserId: string
  otherUserData: {
    username: string
    avatarUrl?: string
  }
}

export function Chat({ otherUserId, otherUserData }: ChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToMessages(user.uid, otherUserId, (newMessages) => {
      setMessages(newMessages)
      
      // Mark unread messages as read
      newMessages.forEach(message => {
        if (!message.read && message.senderId !== user.uid) {
          markMessageAsRead(user.uid, otherUserId, message.id)
        }
      })
      
      // Scroll to bottom
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
      }, 100)
    })

    return unsubscribe
  }, [user, otherUserId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    setIsLoading(true)
    try {
      await sendMessage(user.uid, otherUserId, newMessage.trim())
      setNewMessage("")
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center space-x-3 p-4 border-b border-border bg-card">
        <Avatar>
          <AvatarImage src={otherUserData.avatarUrl} />
          <AvatarFallback>{otherUserData.username[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-foreground">{otherUserData.username}</h3>
          <p className="text-sm text-muted-foreground">Online</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === user.uid
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card">
        <div className="flex space-x-2">
          <Button type="button" variant="ghost" size="sm">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="button" variant="ghost" size="sm">
            <Smile className="w-4 h-4" />
          </Button>
          <Button type="submit" disabled={!newMessage.trim() || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
