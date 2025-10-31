"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MentionAutocomplete } from "@/components/mention-autocomplete"
import { MentionText } from "@/components/mention-text"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MessageCircle, 
  Send, 
  MoreHorizontal,
  Reply,
  Heart,
  Flag
} from "lucide-react"
import { JourneyComment } from "@/lib/journey-schema"
import { addJourneyComment } from "@/lib/journey-utils"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, orderBy, query, doc, getDoc } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface JourneyCommentsProps {
  entryId: string
  comments: JourneyComment[]
  currentUserId?: string
}

interface UserData {
  [key: string]: {
    username: string
    avatar_url?: string
  }
}

export function JourneyComments({ entryId, comments, currentUserId }: JourneyCommentsProps) {
  const [localComments, setLocalComments] = useState(comments)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [userData, setUserData] = useState<UserData>({})

  useEffect(() => {
    const q = query(
      collection(db, "journey_entries", entryId, "comments"),
      orderBy("timestamp", "desc")
    )
    const unsub = onSnapshot(q, async (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any), timestamp: (d.data() as any).timestamp?.toDate?.() || new Date() })) as JourneyComment[]
      setLocalComments(items)

      // Fetch user data for all commenters
      const userIds = new Set<string>()
      items.forEach(comment => {
        userIds.add(comment.userId)
        comment.replies?.forEach(reply => userIds.add(reply.userId))
      })

      const newUserData: UserData = { ...userData }
      for (const userId of userIds) {
        if (!newUserData[userId]) {
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
      }
      setUserData(newUserData)
    })
    return unsub
  }, [entryId])

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUserId || loading) return

    setLoading(true)
    try {
      const commentId = await addJourneyComment(entryId, currentUserId, newComment.trim())
      
      const newCommentObj: JourneyComment = {
        id: commentId,
        userId: currentUserId,
        content: newComment.trim(),
        timestamp: new Date(),
        replies: []
      }

      setLocalComments(prev => [newCommentObj, ...prev])
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddReply = async (parentCommentId: string) => {
    if (!replyText.trim() || !currentUserId || loading) return

    setLoading(true)
    try {
      // In a real implementation, you'd add the reply to the parent comment
      // For now, we'll add it as a new comment
      const replyId = await addJourneyComment(entryId, currentUserId, replyText.trim())
      
      const newReply: JourneyComment = {
        id: replyId,
        userId: currentUserId,
        content: replyText.trim(),
        timestamp: new Date(),
        replies: []
      }

      setLocalComments(prev => 
        prev.map(comment => 
          comment.id === parentCommentId
            ? { ...comment, replies: [...comment.replies, newReply] }
            : comment
        )
      )
      
      setReplyText('')
      setReplyingTo(null)
    } catch (error) {
      console.error('Error adding reply:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUserInitials = (userId: string) => {
    const username = userData[userId]?.username
    return username ? username.slice(0, 2).toUpperCase() : userId.substring(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-4">
      {/* Add Comment Form */}
      {currentUserId && (
        <form onSubmit={handleAddComment} className="flex space-x-2">
          <div className="flex-1">
            <MentionAutocomplete
              value={newComment}
              onChange={setNewComment}
              placeholder="Add a comment..."
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button type="submit" disabled={!newComment.trim() || loading} size="sm">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {localComments.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet</p>
          </div>
        ) : (
          localComments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex space-x-3"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={userData[comment.userId]?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">
                  {getUserInitials(comment.userId)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Link href={`/profile/${comment.userId}`} className="text-sm font-medium hover:text-primary">
                      {userData[comment.userId]?.username || `User ${comment.userId.substring(0, 8)}`}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">
                    <MentionText text={comment.content} />
                  </p>
                </div>

                {/* Comment Actions */}
                <div className="flex items-center space-x-4 ml-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="h-6 px-2 text-xs"
                  >
                    <Reply className="w-3 h-3 mr-1" />
                    Reply
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    <Heart className="w-3 h-3 mr-1" />
                    Like
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </div>

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-6 space-y-2"
                  >
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <MentionAutocomplete
                          value={replyText}
                          onChange={setReplyText}
                          placeholder="Write a reply..."
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <Button
                        onClick={() => handleAddReply(comment.id)}
                        disabled={!replyText.trim() || loading}
                        size="sm"
                      >
                        <Send className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyText('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div className="ml-6 space-y-2">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex space-x-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={userData[reply.userId]?.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(reply.userId)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted/50 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <Link href={`/profile/${reply.userId}`} className="text-xs font-medium hover:text-primary">
                              {userData[reply.userId]?.username || `User ${reply.userId.substring(0, 8)}`}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(reply.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-foreground">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

