"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  subscribeToPostEngagement,
  likePost,
  unlikePost,
  sharePost,
  incrementViewCount,
  subscribeToComments,
  addComment,
  type PostEngagement,
  type Comment
} from "@/lib/realtime-utils"
import { createNotification } from "@/lib/notifications-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share2, Eye, Send } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface PostEngagementProps {
  postId: string
  postAuthorId: string
}

export function PostEngagement({ postId, postAuthorId }: PostEngagementProps) {
  const { user } = useAuth()
  const [engagement, setEngagement] = useState<PostEngagement>({ likes: 0, comments: 0, shares: 0, views: 0 })
  const [comments, setComments] = useState<Comment[]>([])
  const [isLiked, setIsLiked] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Subscribe to engagement updates
    const unsubscribeEngagement = subscribeToPostEngagement(postId, (newEngagement) => {
      setEngagement(newEngagement)
    })

    // Subscribe to comments
    const unsubscribeComments = subscribeToComments(postId, (newComments) => {
      setComments(newComments)
    })

    // Increment view count when component mounts
    incrementViewCount(postId)

    return () => {
      unsubscribeEngagement()
      unsubscribeComments()
    }
  }, [postId])

  const handleLike = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      if (isLiked) {
        await unlikePost(postId, user.uid)
        setIsLiked(false)
      } else {
        await likePost(postId, user.uid)
        setIsLiked(true)
        // Notify the post author (only if it's not the user themselves)
        if (postAuthorId && postAuthorId !== user.uid) {
          await createNotification(
            postAuthorId,
            'like',
            `${user.displayName || 'Someone'} liked your post`,
            'Your post received a like!',
            postId,
            'post',
            user.uid
          )
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      await sharePost(postId, user.uid)
      // Notify the post author (only if it's not the user themselves)
      if (postAuthorId && postAuthorId !== user.uid) {
        await createNotification(
          postAuthorId,
          'share',
          `${user.displayName || 'Someone'} shared your post`,
          'Your post was shared!',
          postId,
          'post',
          user.uid
        )
      }
    } catch (error) {
      console.error('Error sharing post:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    setIsLoading(true)
    try {
      await addComment(postId, user.uid, user.displayName || 'Anonymous', newComment.trim(), user.photoURL || undefined)
      setNewComment("")
      // Notify the post author (only if it's not the user themselves)
      if (postAuthorId && postAuthorId !== user.uid) {
        await createNotification(
          postAuthorId,
          'comment',
          `${user.displayName || 'Someone'} commented on your post`,
          newComment.trim().substring(0, 100) + (newComment.length > 100 ? '...' : ''),
          postId,
          'post',
          user.uid
        )
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Engagement Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          {engagement.likes > 0 && (
            <span>{engagement.likes} like{engagement.likes !== 1 ? 's' : ''}</span>
          )}
          {engagement.comments > 0 && (
            <span>{engagement.comments} comment{engagement.comments !== 1 ? 's' : ''}</span>
          )}
          {engagement.shares > 0 && (
            <span>{engagement.shares} share{engagement.shares !== 1 ? 's' : ''}</span>
          )}
        </div>
        {engagement.views > 0 && (
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{engagement.views}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLoading}
            className={`flex items-center space-x-2 ${isLiked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'
              }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>Like</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 hover:text-blue-500"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Comment</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            disabled={isLoading}
            className="flex items-center space-x-2 hover:text-green-500"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </Button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-border pt-4 space-y-4">
          {/* Add Comment */}
          {user && (
            <form onSubmit={handleAddComment} className="flex space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback>{user.displayName?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" size="sm" disabled={!newComment.trim() || isLoading}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.avatarUrl} />
                  <AvatarFallback>{comment.username[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-sm text-foreground">{comment.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
