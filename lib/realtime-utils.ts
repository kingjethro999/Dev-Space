import { realtimeDb } from "@/lib/firebase"
import { ref, push, set, onValue, off, update, remove } from "firebase/database"

export interface PostEngagement {
  likes: number
  comments: number
  shares: number
  views: number
}

export interface Comment {
  id: string
  userId: string
  username: string
  avatarUrl?: string
  content: string
  timestamp: number
  likes: number
  replies?: Comment[]
}

export interface Like {
  userId: string
  timestamp: number
}

// Real-time post engagement functions
export function subscribeToPostEngagement(postId: string, callback: (engagement: PostEngagement) => void) {
  const engagementRef = ref(realtimeDb, `posts/${postId}/engagement`)
  
  onValue(engagementRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      callback({
        likes: data.likes || 0,
        comments: data.comments || 0,
        shares: data.shares || 0,
        views: data.views || 0
      })
    } else {
      callback({ likes: 0, comments: 0, shares: 0, views: 0 })
    }
  })

  return () => off(engagementRef)
}

export async function likePost(postId: string, userId: string) {
  const likeRef = ref(realtimeDb, `posts/${postId}/likes/${userId}`)
  const engagementRef = ref(realtimeDb, `posts/${postId}/engagement/likes`)
  
  try {
    // Add like
    await set(likeRef, {
      userId,
      timestamp: Date.now()
    })
    
    // Increment like count
    await update(engagementRef, {
      [Date.now()]: 1
    })
    
    return true
  } catch (error) {
    console.error('Error liking post:', error)
    return false
  }
}

export async function unlikePost(postId: string, userId: string) {
  const likeRef = ref(realtimeDb, `posts/${postId}/likes/${userId}`)
  const engagementRef = ref(realtimeDb, `posts/${postId}/engagement/likes`)
  
  try {
    // Remove like
    await remove(likeRef)
    
    // Decrement like count
    await update(engagementRef, {
      [Date.now()]: -1
    })
    
    return true
  } catch (error) {
    console.error('Error unliking post:', error)
    return false
  }
}

export async function sharePost(postId: string, userId: string) {
  const shareRef = ref(realtimeDb, `posts/${postId}/shares/${userId}`)
  const engagementRef = ref(realtimeDb, `posts/${postId}/engagement/shares`)
  
  try {
    // Add share
    await set(shareRef, {
      userId,
      timestamp: Date.now()
    })
    
    // Increment share count
    await update(engagementRef, {
      [Date.now()]: 1
    })
    
    return true
  } catch (error) {
    console.error('Error sharing post:', error)
    return false
  }
}

export async function incrementViewCount(postId: string) {
  const viewRef = ref(realtimeDb, `posts/${postId}/engagement/views`)
  
  try {
    await update(viewRef, {
      [Date.now()]: 1
    })
    return true
  } catch (error) {
    console.error('Error incrementing view count:', error)
    return false
  }
}

// Real-time comments functions
export function subscribeToComments(postId: string, callback: (comments: Comment[]) => void) {
  const commentsRef = ref(realtimeDb, `posts/${postId}/comments`)
  
  onValue(commentsRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      const comments = Object.entries(data).map(([id, comment]: [string, any]) => ({
        id,
        ...comment
      }))
      callback(comments.sort((a, b) => b.timestamp - a.timestamp))
    } else {
      callback([])
    }
  })

  return () => off(commentsRef)
}

export async function addComment(postId: string, userId: string, username: string, content: string, avatarUrl?: string) {
  const commentsRef = ref(realtimeDb, `posts/${postId}/comments`)
  const engagementRef = ref(realtimeDb, `posts/${postId}/engagement/comments`)
  
  try {
    const newCommentRef = push(commentsRef)
    await set(newCommentRef, {
      userId,
      username,
      avatarUrl,
      content,
      timestamp: Date.now(),
      likes: 0
    })
    
    // Increment comment count
    await update(engagementRef, {
      [Date.now()]: 1
    })
    
    return newCommentRef.key
  } catch (error) {
    console.error('Error adding comment:', error)
    return null
  }
}

export async function likeComment(postId: string, commentId: string, userId: string) {
  const likeRef = ref(realtimeDb, `posts/${postId}/comments/${commentId}/likes/${userId}`)
  
  try {
    await set(likeRef, {
      userId,
      timestamp: Date.now()
    })
    return true
  } catch (error) {
    console.error('Error liking comment:', error)
    return false
  }
}

export async function unlikeComment(postId: string, commentId: string, userId: string) {
  const likeRef = ref(realtimeDb, `posts/${postId}/comments/${commentId}/likes/${userId}`)
  
  try {
    await remove(likeRef)
    return true
  } catch (error) {
    console.error('Error unliking comment:', error)
    return false
  }
}

// Real-time messaging functions
export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: number
  read: boolean
  type: 'text' | 'image' | 'file'
}

export function subscribeToMessages(userId: string, otherUserId: string, callback: (messages: Message[]) => void) {
  const messagesRef = ref(realtimeDb, `messages/${userId}/${otherUserId}`)
  
  onValue(messagesRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      const messages = Object.entries(data).map(([id, message]: [string, any]) => ({
        id,
        ...message
      }))
      callback(messages.sort((a, b) => a.timestamp - b.timestamp))
    } else {
      callback([])
    }
  })

  return () => off(messagesRef)
}

export async function sendMessage(senderId: string, receiverId: string, content: string, type: 'text' | 'image' | 'file' = 'text') {
  const senderRef = ref(realtimeDb, `messages/${senderId}/${receiverId}`)
  const receiverRef = ref(realtimeDb, `messages/${receiverId}/${senderId}`)
  
  try {
    const messageData = {
      senderId,
      receiverId,
      content,
      timestamp: Date.now(),
      read: false,
      type
    }
    
    const newMessageRef = push(senderRef)
    await set(newMessageRef, messageData)
    
    // Also add to receiver's messages
    await set(receiverRef.child(newMessageRef.key!), messageData)
    
    return newMessageRef.key
  } catch (error) {
    console.error('Error sending message:', error)
    return null
  }
}

export async function markMessageAsRead(userId: string, otherUserId: string, messageId: string) {
  const messageRef = ref(realtimeDb, `messages/${userId}/${otherUserId}/${messageId}`)
  
  try {
    await update(messageRef, { read: true })
    return true
  } catch (error) {
    console.error('Error marking message as read:', error)
    return false
  }
}

// Real-time notifications
export interface Notification {
  id: string
  userId: string
  type: 'like' | 'comment' | 'follow' | 'message' | 'mention'
  title: string
  message: string
  timestamp: number
  read: boolean
  relatedId?: string
}

export function subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
  const notificationsRef = ref(realtimeDb, `notifications/${userId}`)
  
  onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      const notifications = Object.entries(data).map(([id, notification]: [string, any]) => ({
        id,
        ...notification
      }))
      callback(notifications.sort((a, b) => b.timestamp - a.timestamp))
    } else {
      callback([])
    }
  })

  return () => off(notificationsRef)
}

export async function createNotification(userId: string, type: Notification['type'], title: string, message: string, relatedId?: string) {
  const notificationsRef = ref(realtimeDb, `notifications/${userId}`)
  
  try {
    const newNotificationRef = push(notificationsRef)
    await set(newNotificationRef, {
      userId,
      type,
      title,
      message,
      timestamp: Date.now(),
      read: false,
      relatedId
    })
    
    // Send email notification for important events
    if (type === 'follow' || type === 'message' || type === 'mention') {
      try {
        // Get user email from Firestore (you'll need to implement this)
        // const userDoc = await getDoc(doc(db, 'users', userId))
        // const userEmail = userDoc.data()?.email
        
        // For now, we'll skip email sending but the structure is ready
        // await sendNotificationEmail({
        //   username: userEmail,
        //   notificationType: type,
        //   message: `${title}: ${message}`,
        //   actionLink: relatedId ? `https://dev-space.vercel.app/posts/${relatedId}` : undefined
        // })
      } catch (emailError) {
        console.error('Error sending email notification:', emailError)
        // Don't fail the notification creation if email fails
      }
    }
    
    return newNotificationRef.key
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  const notificationRef = ref(realtimeDb, `notifications/${userId}/${notificationId}`)
  
  try {
    await update(notificationRef, { read: true })
    return true
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}
