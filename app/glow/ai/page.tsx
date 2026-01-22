"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bot, Plus, Copy, RefreshCw, ThumbsUp, ThumbsDown, Share, Upload, Eye, Pencil, Menu, X, Paperclip, Check, Brain, Globe, MoreVertical, Download, Trash2, Github } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { GLOW_AI_SYSTEM_PROMPT } from "@/lib/glow-ai-config"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RepositorySelector } from "@/components/repository-selector"
import { getRepositoryReadme, getRepositoryDetails } from "@/lib/github-utils"

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  updatedAt: Date
}

export default function GlowAIPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [chatMessage, setChatMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null)
  const [editedMessageContent, setEditedMessageContent] = useState("")
  const [likedMessages, setLikedMessages] = useState<Set<number>>(new Set())
  const [dislikedMessages, setDislikedMessages] = useState<Set<number>>(new Set())
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showSessionMenu, setShowSessionMenu] = useState<string | null>(null)
  const [showPagination, setShowPagination] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [deepThinkMode, setDeepThinkMode] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showGitHubDialog, setShowGitHubDialog] = useState(false)
  const messagesPerPage = 10
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadUserProfile()
      loadChatSessions()
      if (currentSessionId) {
        loadChatHistory()
      }
    }
  }, [user, currentSessionId])

  const loadUserProfile = async () => {
    if (!user) return

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        setUserProfile(userDoc.data())
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory, isLoading])

  // Close session menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSessionMenu && !(event.target as Element).closest('.session-menu')) {
        setShowSessionMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSessionMenu])

  const loadChatSessions = async () => {
    if (!user) return

    setIsLoadingHistory(true)

    try {
      const historySnap = await getDoc(doc(db, 'glow_chat_history', user.uid))
      const rawMessages = historySnap.exists() ? historySnap.data()?.messages || [] : []

      if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
        setChatSessions([])
        return
      }

      const normalizedHistory = rawMessages.map((msg: any) => ({
        role: msg?.role || 'user',
        content: msg?.content || '',
        timestamp: msg?.timestamp?.toDate
          ? msg.timestamp.toDate()
          : msg?.timestamp?.seconds
            ? new Date(msg.timestamp.seconds * 1000)
            : msg?.timestamp
              ? new Date(msg.timestamp)
              : new Date()
      }))

      // Group messages into sessions based on time gaps
      const sessions: ChatSession[] = []
      let currentSession: Message[] = []

      normalizedHistory.forEach((msg, index) => {
        if (index === 0) {
          currentSession.push(msg)
        } else {
          const prevMsg = normalizedHistory[index - 1]
          const prevTime = new Date(prevMsg.timestamp || Date.now()).getTime()
          const currTime = new Date(msg.timestamp || Date.now()).getTime()
          const gapMinutes = (currTime - prevTime) / (1000 * 60)

          if (gapMinutes > 30 && currentSession.length > 0) {
            sessions.push({
              id: `session-${Date.now()}-${sessions.length}`,
              title: currentSession.find(m => m.role === 'user')?.content?.substring(0, 50) || "Chat",
              messages: currentSession,
              updatedAt: new Date(currentSession[currentSession.length - 1].timestamp || Date.now())
            })
            currentSession = [msg]
          } else {
            currentSession.push(msg)
          }
        }
      })

      if (currentSession.length > 0) {
        sessions.push({
          id: `session-${Date.now()}-${sessions.length}`,
          title: currentSession.find(m => m.role === 'user')?.content?.substring(0, 50) || "Chat",
          messages: currentSession,
          updatedAt: new Date(currentSession[currentSession.length - 1].timestamp || Date.now())
        })
      }

      sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

      setChatSessions(sessions)
      if (sessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(sessions[0].id)
        setChatHistory(sessions[0].messages)
        setShowPagination(false)
        setCurrentPage(1)
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error)
      setChatSessions([])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const loadChatHistory = async () => {
    if (!user || !currentSessionId) return

    const session = chatSessions.find(s => s.id === currentSessionId)
    if (session) {
      setChatHistory(session.messages)
    }
  }

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: "New Chat",
      messages: [],
      updatedAt: new Date()
    }
    setChatSessions([newSession, ...chatSessions])
    setCurrentSessionId(newSession.id)
    setChatHistory([])
  }

  const handleAiChat = async (message: string) => {
    if (!message.trim() || !user) return

    setIsLoading(true)
    const userMessage: Message = { role: 'user', content: message, timestamp: new Date() }
    const updatedHistory = [...chatHistory, userMessage]
    setChatHistory(updatedHistory)
    setChatMessage("")

    try {
      const response = await fetch("/api/openrouter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "google/gemma-3-27b-it:free",
          "messages": [
            {
              "role": "system",
              "content": deepThinkMode 
                ? `${GLOW_AI_SYSTEM_PROMPT}\n\nIMPORTANT: You are in DeepThink mode. Provide thorough, detailed, and comprehensive responses. Analyze deeply, consider multiple perspectives, and give extensive explanations. Be as detailed and thorough as possible.`
                : GLOW_AI_SYSTEM_PROMPT
            },
            ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: message }
          ],
          ...(deepThinkMode && {
            "max_tokens": 4000,
            "temperature": 0.7
          })
        })
      })

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('OpenRouter error details:', errorData);
          
          // Try multiple error message fields
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if (errorData.error.message) {
              errorMessage = errorData.error.message;
            } else if (errorData.error.type) {
              errorMessage = `${errorData.error.type}: ${errorData.error.message || 'Unknown error'}`;
            }
          } else if (errorData.details?.error?.message) {
            errorMessage = errorData.details.error.message;
          }
          
          // Check for specific OpenRouter error types
          if (errorData.error?.type === 'provider_error' || errorData.error?.type === 'model_not_found') {
            errorMessage = errorData.error.message || 'The AI model is currently unavailable. Please try again later or switch to a different model.';
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
          errorMessage = `${response.status}: ${response.statusText || 'Unknown error'}`;
        }

        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
        }
        
        // Show user-friendly error
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        
        throw new Error(errorMessage);
      }

      const data = await response.json()

      let assistantMessage = ''
      if (data.choices && data.choices.length > 0) {
        const choice = data.choices[0]
        if (choice.message) {
          assistantMessage = typeof choice.message.content === 'string' 
            ? choice.message.content 
            : choice.message.content?.[0]?.text || JSON.stringify(choice.message.content)
        } else if (choice.text) {
          assistantMessage = choice.text
        }
      } else if (data.content) {
        assistantMessage = typeof data.content === 'string' ? data.content : data.content[0]?.text || JSON.stringify(data.content)
      } else if (data.message) {
        assistantMessage = data.message
      } else {
        console.error('Unexpected response format:', data)
        assistantMessage = 'I received an unexpected response format. Please try again.'
      }

      const assistantResponse: Message = { 
        role: 'assistant', 
        content: assistantMessage,
        timestamp: new Date()
      }
      
      const finalHistory = [...updatedHistory, assistantResponse]
      setChatHistory(finalHistory)
      
      // Update current session or create new one
      if (currentSessionId) {
        setChatSessions(prev => prev.map(s => 
          s.id === currentSessionId 
            ? { ...s, messages: finalHistory, title: finalHistory[0]?.content?.substring(0, 50) || s.title, updatedAt: new Date() }
            : s
        ))
      } else {
        // Create new session if none exists
        const newSession: ChatSession = {
          id: `session-${Date.now()}`,
          title: finalHistory[0]?.content?.substring(0, 50) || "New Chat",
          messages: finalHistory,
          updatedAt: new Date()
        }
        setChatSessions([newSession, ...chatSessions])
        setCurrentSessionId(newSession.id)
      }

      // Update current session immediately
      let updatedSessions = chatSessions
      if (currentSessionId) {
        updatedSessions = chatSessions.map(s => 
          s.id === currentSessionId 
            ? { ...s, messages: finalHistory, title: finalHistory.find(m => m.role === 'user')?.content?.substring(0, 50) || s.title, updatedAt: new Date() }
            : s
        )
        setChatSessions(updatedSessions)
      } else {
        // Create new session if none exists
        const newSession: ChatSession = {
          id: `session-${Date.now()}`,
          title: finalHistory.find(m => m.role === 'user')?.content?.substring(0, 50) || "New Chat",
          messages: finalHistory,
          updatedAt: new Date()
        }
        updatedSessions = [newSession, ...chatSessions]
        setChatSessions(updatedSessions)
        setCurrentSessionId(newSession.id)
      }

      // Save history to Firestore after updating sessions
      await saveChatHistory(finalHistory, updatedSessions)
    } catch (error) {
      console.error('AI Chat error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.'
      const errorResponse: Message = { 
        role: 'assistant', 
        content: errorMessage,
        timestamp: new Date()
      }
      const finalHistory = [...updatedHistory, errorResponse]
      setChatHistory(finalHistory)
      
      // Update session or create new one
      let updatedSessions = chatSessions
      if (currentSessionId) {
        updatedSessions = chatSessions.map(s => 
          s.id === currentSessionId 
            ? { ...s, messages: finalHistory, updatedAt: new Date() }
            : s
        )
        setChatSessions(updatedSessions)
      } else {
        const newSession: ChatSession = {
          id: `session-${Date.now()}`,
          title: finalHistory[0]?.content?.substring(0, 50) || "New Chat",
          messages: finalHistory,
          updatedAt: new Date()
        }
        updatedSessions = [newSession, ...chatSessions]
        setChatSessions(updatedSessions)
        setCurrentSessionId(newSession.id)
      }
      
      await saveChatHistory(finalHistory, updatedSessions)
    } finally {
      setIsLoading(false)
    }
  }

  const saveChatHistory = async (messages: Message[], sessions?: ChatSession[]) => {
    if (!user) return
    
    try {
      // Collect all messages across sessions to persist complete history
      const allMessages: Message[] = []
      const sessionsToUse = sessions || chatSessions

      if (sessionsToUse.length > 0) {
        sessionsToUse.forEach(session => {
          if (currentSessionId === session.id) {
            allMessages.push(...messages)
          } else {
            allMessages.push(...session.messages)
          }
        })
      } else {
        allMessages.push(...messages)
      }

      // Sort for deterministic ordering
      allMessages.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
        return timeA - timeB
      })

      // Persist directly to Firestore with authenticated client (bypasses API route issues)
      await setDoc(
        doc(db, 'glow_chat_history', user.uid),
        {
          userId: user.uid,
          messages: allMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp instanceof Timestamp
              ? msg.timestamp
              : Timestamp.fromDate(new Date(msg.timestamp || Date.now()))
          })),
          updatedAt: Timestamp.now()
        },
        { merge: true }
      )
    } catch (error) {
      console.error('Failed to save chat history:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      })
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Could not copy message to clipboard",
        variant: "destructive"
      })
    })
  }

  const regenerateResponse = async (messageIndex: number) => {
    if (messageIndex === 0 || chatHistory[messageIndex - 1].role !== 'user') return
    
    const userMessage = chatHistory[messageIndex - 1]
    const previousHistory = chatHistory.slice(0, messageIndex - 1)
    const updatedHistory = [...previousHistory, userMessage]
    
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/openrouter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "google/gemma-3-27b-it:free",
          "messages": [
            {
              "role": "system",
              "content": GLOW_AI_SYSTEM_PROMPT
            },
            ...previousHistory.map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: userMessage.content }
          ]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate response')
      }

      const data = await response.json()
      let assistantMessage = ''
      
      if (data.choices && data.choices.length > 0) {
        const choice = data.choices[0]
        if (choice.message) {
          assistantMessage = typeof choice.message.content === 'string' 
            ? choice.message.content 
            : choice.message.content?.[0]?.text || JSON.stringify(choice.message.content)
        }
      }

      const newResponse: Message = { role: 'assistant', content: assistantMessage, timestamp: new Date() }
      const newHistory = [...updatedHistory, newResponse, ...chatHistory.slice(messageIndex + 1)]
      setChatHistory(newHistory)
      
      // Update the current session with new history
      let updatedSessions = chatSessions
      if (currentSessionId) {
        updatedSessions = chatSessions.map(s => 
          s.id === currentSessionId 
            ? { ...s, messages: newHistory, updatedAt: new Date() }
            : s
        )
        setChatSessions(updatedSessions)
      }
      
      await saveChatHistory(newHistory, updatedSessions)
      
      toast({
        title: "Response regenerated",
        description: "AI response has been regenerated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate response. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = (messageIndex: number) => {
    if (likedMessages.has(messageIndex)) {
      setLikedMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(messageIndex)
        return newSet
      })
      toast({
        title: "Feedback removed",
        description: "Your like has been removed",
      })
    } else {
      setLikedMessages(prev => new Set(prev).add(messageIndex))
      setDislikedMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(messageIndex)
        return newSet
      })
      toast({
        title: "Thank you!",
        description: "Your feedback helps improve GLOW",
      })
    }
  }

  const handleDislike = (messageIndex: number) => {
    if (dislikedMessages.has(messageIndex)) {
      setDislikedMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(messageIndex)
        return newSet
      })
      toast({
        title: "Feedback removed",
        description: "Your dislike has been removed",
      })
    } else {
      setDislikedMessages(prev => new Set(prev).add(messageIndex))
      setLikedMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(messageIndex)
        return newSet
      })
      toast({
        title: "Feedback received",
        description: "We'll use this to improve GLOW's responses",
      })
    }
  }

  const handleShare = async (messageIndex: number) => {
    const message = chatHistory[messageIndex]
    const shareText = `${message.content}\n\n— GLOW AI by DevSpace`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "GLOW AI Response",
          text: shareText,
          url: window.location.href
        })
        toast({
          title: "Shared!",
          description: "Message shared successfully",
        })
      } catch (error) {
        // User cancelled or error occurred
        copyToClipboard(shareText)
      }
    } else {
      copyToClipboard(shareText)
      toast({
        title: "Copied!",
        description: "Message copied to clipboard for sharing",
      })
    }
  }

  const handleEdit = (messageIndex: number) => {
    const message = chatHistory[messageIndex]
    setEditingMessageIndex(messageIndex)
    setEditedMessageContent(message.content)
  }

  const saveEdit = async () => {
    if (editingMessageIndex === null || !editedMessageContent.trim()) return

    const newHistory = [...chatHistory]
    newHistory[editingMessageIndex] = {
      ...newHistory[editingMessageIndex],
      content: editedMessageContent
    }
    
    setChatHistory(newHistory)
    setEditingMessageIndex(null)
    setEditedMessageContent("")
    
    // Update the current session with edited history
    let updatedSessions = chatSessions
    if (currentSessionId) {
      updatedSessions = chatSessions.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: newHistory, updatedAt: new Date() }
          : s
      )
      setChatSessions(updatedSessions)
    }
    
    await saveChatHistory(newHistory, updatedSessions)
    
    // If it's a user message and there's a response after it, regenerate that response
    if (newHistory[editingMessageIndex].role === 'user' && 
        editingMessageIndex + 1 < newHistory.length && 
        newHistory[editingMessageIndex + 1].role === 'assistant') {
      await regenerateResponse(editingMessageIndex + 1)
    } else {
      toast({
        title: "Message updated",
        description: "Your message has been updated",
      })
    }
  }

  const cancelEdit = () => {
    setEditingMessageIndex(null)
    setEditedMessageContent("")
  }

  const handleUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if it's an image
    if (file.type.startsWith('image/')) {
      setUploadingImage(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', 'images')
        formData.append('folder', 'dev-space/glow-ai')

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dcrh78d8z/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        )

        if (!response.ok) {
          throw new Error('Image upload failed')
        }

        const result = await response.json()
        const imageUrl = result.secure_url

        // Send image to AI for processing using OpenRouter's image format
        setIsLoading(true)
        const userMessage: Message = { 
          role: 'user', 
          content: 'Please analyze this image and describe what you see.',
          timestamp: new Date() 
        }
        const updatedHistory = [...chatHistory, userMessage]
        setChatHistory(updatedHistory)

        try {
          const response = await fetch("/api/openrouter", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              "model": "google/gemma-3-27b-it:free",
              "messages": [
                {
                  "role": "system",
                  "content": deepThinkMode 
                    ? `${GLOW_AI_SYSTEM_PROMPT}\n\nIMPORTANT: You are in DeepThink mode. Provide thorough, detailed, and comprehensive responses. Analyze deeply, consider multiple perspectives, and give extensive explanations. Be as detailed and thorough as possible.`
                    : GLOW_AI_SYSTEM_PROMPT
                },
                ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
                {
                  "role": "user",
                  "content": [
                    {
                      "type": "text",
                      "text": "Please analyze this image and describe what you see."
                    },
                    {
                      "type": "image_url",
                      "image_url": {
                        "url": imageUrl
                      }
                    }
                  ]
                }
              ],
              ...(deepThinkMode && {
                "max_tokens": 4000,
                "temperature": 0.7
              })
            })
          })

          if (!response.ok) {
            throw new Error('Failed to process image')
          }

          const data = await response.json()
          let assistantMessage = ''
          if (data.choices && data.choices.length > 0) {
            const choice = data.choices[0]
            if (choice.message) {
              assistantMessage = typeof choice.message.content === 'string' 
                ? choice.message.content 
                : choice.message.content?.[0]?.text || JSON.stringify(choice.message.content)
            }
          }

          const assistantResponse: Message = { 
            role: 'assistant', 
            content: assistantMessage,
            timestamp: new Date()
          }
          
          const finalHistory = [...updatedHistory, assistantResponse]
          setChatHistory(finalHistory)
          
          // Update current session or create new one
          let updatedSessions = chatSessions
          if (currentSessionId) {
            updatedSessions = chatSessions.map(s => 
              s.id === currentSessionId 
                ? { ...s, messages: finalHistory, title: finalHistory.find(m => m.role === 'user')?.content?.substring(0, 50) || s.title, updatedAt: new Date() }
                : s
            )
            setChatSessions(updatedSessions)
          } else {
            const newSession: ChatSession = {
              id: `session-${Date.now()}`,
              title: finalHistory.find(m => m.role === 'user')?.content?.substring(0, 50) || "New Chat",
              messages: finalHistory,
              updatedAt: new Date()
            }
            updatedSessions = [newSession, ...chatSessions]
            setChatSessions(updatedSessions)
            setCurrentSessionId(newSession.id)
          }

          await saveChatHistory(finalHistory, updatedSessions)
          
          toast({
            title: "Image analyzed",
            description: "GLOW has analyzed your image",
          })
        } catch (error) {
          console.error('Image processing error:', error)
          toast({
            title: "Processing failed",
            description: "Could not process image. Please try again.",
            variant: "destructive"
          })
        } finally {
          setIsLoading(false)
        }

      } catch (error) {
        console.error('Image upload error:', error)
        toast({
          title: "Upload failed",
          description: "Could not upload image. Please try again.",
          variant: "destructive"
        })
        setUploadingImage(false)
      }
    } else if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|json|csv|xml|html|css|js|ts|jsx|tsx|py|java|cpp|c|go|rs|php|rb|sh|yaml|yml|sql|log)$/i)) {
      // Handle text files
      setUploadingImage(true)
      try {
        const fileContent = await file.text()
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'txt'
        const fileName = file.name
        
        // Send file content to AI
        setIsLoading(true)
        const userMessage: Message = { 
          role: 'user', 
          content: `I've uploaded a file: "${fileName}" (${fileExtension} file). Please analyze it:\n\n\`\`\`${fileExtension}\n${fileContent}\n\`\`\``,
          timestamp: new Date() 
        }
        const updatedHistory = [...chatHistory, userMessage]
        setChatHistory(updatedHistory)

        try {
          const response = await fetch("/api/openrouter", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              "model": "google/gemma-3-27b-it:free",
              "messages": [
                {
                  "role": "system",
                  "content": deepThinkMode 
                    ? `${GLOW_AI_SYSTEM_PROMPT}\n\nIMPORTANT: You are in DeepThink mode. Provide thorough, detailed, and comprehensive responses. Analyze deeply, consider multiple perspectives, and give extensive explanations. Be as detailed and thorough as possible.`
                    : GLOW_AI_SYSTEM_PROMPT
                },
                ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
                { role: "user", content: userMessage.content }
              ],
              ...(deepThinkMode && {
                "max_tokens": 4000,
                "temperature": 0.7
              })
            })
          })

          if (!response.ok) {
            throw new Error('Failed to process file')
          }

          const data = await response.json()
          let assistantMessage = ''
          if (data.choices && data.choices.length > 0) {
            const choice = data.choices[0]
            if (choice.message) {
              assistantMessage = typeof choice.message.content === 'string' 
                ? choice.message.content 
                : choice.message.content?.[0]?.text || JSON.stringify(choice.message.content)
            }
          }

          const assistantResponse: Message = { 
            role: 'assistant', 
            content: assistantMessage,
            timestamp: new Date()
          }
          
          const finalHistory = [...updatedHistory, assistantResponse]
          setChatHistory(finalHistory)
          
          // Update current session or create new one
          let updatedSessions = chatSessions
          if (currentSessionId) {
            updatedSessions = chatSessions.map(s => 
              s.id === currentSessionId 
                ? { ...s, messages: finalHistory, title: finalHistory.find(m => m.role === 'user')?.content?.substring(0, 50) || s.title, updatedAt: new Date() }
                : s
            )
            setChatSessions(updatedSessions)
          } else {
            const newSession: ChatSession = {
              id: `session-${Date.now()}`,
              title: finalHistory.find(m => m.role === 'user')?.content?.substring(0, 50) || "New Chat",
              messages: finalHistory,
              updatedAt: new Date()
            }
            updatedSessions = [newSession, ...chatSessions]
            setChatSessions(updatedSessions)
            setCurrentSessionId(newSession.id)
          }

          await saveChatHistory(finalHistory, updatedSessions)
          
          toast({
            title: "File analyzed",
            description: `GLOW has analyzed your ${fileExtension} file`,
          })
        } catch (error) {
          console.error('File processing error:', error)
          toast({
            title: "Processing failed",
            description: "Could not process file. Please try again.",
            variant: "destructive"
          })
        } finally {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('File read error:', error)
        toast({
          title: "File read failed",
          description: "Could not read file. Please try again.",
          variant: "destructive"
        })
      } finally {
        setUploadingImage(false)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } else {
      toast({
        title: "File type not supported",
        description: "Please upload an image or text file (txt, md, json, code files, etc.)",
        variant: "destructive"
      })
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeepThink = () => {
    setDeepThinkMode(!deepThinkMode)
    toast({
      title: deepThinkMode ? "DeepThink disabled" : "DeepThink enabled",
      description: deepThinkMode 
        ? "Switched to standard mode" 
        : "GLOW will provide more thorough and detailed analysis",
    })
  }

  const handleGitHubRepoSelect = async (repository: any) => {
    if (!user) return

    setIsLoading(true)
    setShowGitHubDialog(false)

    try {
      // Fetch repository details and README
      const [repoDetails, readme] = await Promise.all([
        getRepositoryDetails(repository.fullName.split('/')[0], repository.fullName.split('/')[1], user.uid).catch(() => null),
        getRepositoryReadme(repository.fullName.split('/')[0], repository.fullName.split('/')[1], user.uid).catch(() => null)
      ])

      // Build repository context message
      let repoContext = `I've added a GitHub repository: **${repository.fullName}**\n\n`
      repoContext += `**Repository Information:**\n`
      repoContext += `- **Name:** ${repository.name}\n`
      if (repository.description) {
        repoContext += `- **Description:** ${repository.description}\n`
      }
      if (repoDetails) {
        repoContext += `- **Language:** ${repoDetails.language || 'N/A'}\n`
        repoContext += `- **Stars:** ${repoDetails.stars || 0}\n`
        repoContext += `- **Forks:** ${repoDetails.forks || 0}\n`
        repoContext += `- **Default Branch:** ${repoDetails.defaultBranch || 'main'}\n`
        if (repoDetails.topics && repoDetails.topics.length > 0) {
          repoContext += `- **Topics:** ${repoDetails.topics.join(', ')}\n`
        }
      }
      repoContext += `- **URL:** ${repository.url}\n\n`

      if (readme) {
        repoContext += `**README:**\n\n\`\`\`markdown\n${readme.content}\n\`\`\`\n\n`
      } else {
        repoContext += `*No README found for this repository.*\n\n`
      }

      repoContext += `Please help me understand this repository. What does it do? What are its main features? How can I get started with it?`

      const userMessage: Message = { 
        role: 'user', 
        content: repoContext,
        timestamp: new Date() 
      }
      const updatedHistory = [...chatHistory, userMessage]
      setChatHistory(updatedHistory)

      // Send to AI
      const response = await fetch("/api/openrouter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "google/gemma-3-27b-it:free",
          "messages": [
            {
              "role": "system",
              "content": deepThinkMode 
                ? `${GLOW_AI_SYSTEM_PROMPT}\n\nIMPORTANT: You are in DeepThink mode. Provide thorough, detailed, and comprehensive responses. Analyze deeply, consider multiple perspectives, and give extensive explanations. Be as detailed and thorough as possible.`
                : GLOW_AI_SYSTEM_PROMPT
            },
            ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: repoContext }
          ],
          ...(deepThinkMode && {
            "max_tokens": 4000,
            "temperature": 0.7
          })
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to process repository';
        try {
          const errorData = await response.json();
          console.error('OpenRouter error details (GitHub repo):', errorData);
          
          // Try multiple error message fields
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if (errorData.error.message) {
              errorMessage = errorData.error.message;
            } else if (errorData.error.type) {
              errorMessage = `${errorData.error.type}: ${errorData.error.message || 'Unknown error'}`;
            }
          } else if (errorData.details?.error?.message) {
            errorMessage = errorData.details.error.message;
          }
          
          // Check for specific OpenRouter error types
          if (errorData.error?.type === 'provider_error' || errorData.error?.type === 'model_not_found') {
            errorMessage = errorData.error.message || 'The AI model is currently unavailable. Please try again later.';
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
          errorMessage = `${response.status}: ${response.statusText || 'Failed to process repository'}`;
        }

        if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
        }
        
        // Show user-friendly error
        toast({
          title: "Error processing repository",
          description: errorMessage,
          variant: "destructive"
        });
        
        throw new Error(errorMessage);
      }

      const data = await response.json()
      let assistantMessage = ''
      if (data.choices && data.choices.length > 0) {
        const choice = data.choices[0]
        if (choice.message) {
          assistantMessage = typeof choice.message.content === 'string' 
            ? choice.message.content 
            : choice.message.content?.[0]?.text || JSON.stringify(choice.message.content)
        }
      }

      const assistantResponse: Message = { 
        role: 'assistant', 
        content: assistantMessage,
        timestamp: new Date()
      }
      
      const finalHistory = [...updatedHistory, assistantResponse]
      setChatHistory(finalHistory)
      
      // Update current session or create new one
      let updatedSessions = chatSessions
      if (currentSessionId) {
        updatedSessions = chatSessions.map(s => 
          s.id === currentSessionId 
            ? { ...s, messages: finalHistory, title: finalHistory.find(m => m.role === 'user')?.content?.substring(0, 50) || s.title, updatedAt: new Date() }
            : s
        )
        setChatSessions(updatedSessions)
      } else {
        const newSession: ChatSession = {
          id: `session-${Date.now()}`,
          title: finalHistory.find(m => m.role === 'user')?.content?.substring(0, 50) || "New Chat",
          messages: finalHistory,
          updatedAt: new Date()
        }
        updatedSessions = [newSession, ...chatSessions]
        setChatSessions(updatedSessions)
        setCurrentSessionId(newSession.id)
      }

      await saveChatHistory(finalHistory, updatedSessions)
      
      toast({
        title: "Repository added",
        description: `Added ${repository.fullName} to the chat`,
      })
    } catch (error) {
      console.error('GitHub repo processing error:', error)
      toast({
        title: "Error",
        description: "Could not process repository. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return

    setChatSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId)
      if (currentSessionId === sessionId) {
        if (filtered.length > 0) {
          setCurrentSessionId(filtered[0].id)
          setChatHistory(filtered[0].messages)
        } else {
          setCurrentSessionId(null)
          setChatHistory([])
        }
      }
      return filtered
    })
    
    toast({
      title: "Deleted",
      description: "Conversation deleted",
    })
  }

  const handleExportSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId)
    if (!session) return

    const text = session.messages.map(msg => 
      `${msg.role === 'user' ? 'You' : 'GLOW'}: ${msg.content}`
    ).join('\n\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `glow-chat-${session.title.replace(/[^a-z0-9]/gi, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Exported",
      description: "Conversation exported successfully",
    })
  }

  // Pagination for messages
  const paginatedMessages = showPagination && chatHistory.length > messagesPerPage
    ? chatHistory.slice((currentPage - 1) * messagesPerPage, currentPage * messagesPerPage)
    : chatHistory

  const totalPages = Math.ceil(chatHistory.length / messagesPerPage)

  const groupedSessions = {
    today: chatSessions.filter(s => {
      const diff = Date.now() - s.updatedAt.getTime()
      return diff < 24 * 60 * 60 * 1000
    }),
    week: chatSessions.filter(s => {
      const diff = Date.now() - s.updatedAt.getTime()
      return diff >= 24 * 60 * 60 * 1000 && diff < 7 * 24 * 60 * 60 * 1000
    }),
    month: chatSessions.filter(s => {
      const diff = Date.now() - s.updatedAt.getTime()
      return diff >= 7 * 24 * 60 * 60 * 1000 && diff < 30 * 24 * 60 * 60 * 1000
    }),
    older: chatSessions.filter(s => {
      const diff = Date.now() - s.updatedAt.getTime()
      return diff >= 30 * 24 * 60 * 60 * 1000
    })
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary rounded-full animate-spin border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className={`${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } bg-card border-r border-border flex flex-col transition-all duration-300`}>
        {/* Logo and Toggle */}
        <div className="h-14 px-4 border-b border-border flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden">
                <Image
                  src="/dev-space-icon-transparent.png"
                  alt="GLOW"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="font-semibold text-sm text-foreground">GLOW</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-muted rounded transition-colors text-foreground"
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {/* New Chat Button */}
        {!sidebarCollapsed && (
          <div className="px-3 py-2">
            <button
              onClick={createNewChat}
              className="w-full bg-[#2a2a2a] hover:bg-[#333] text-white border border-[#404040] rounded-lg px-4 py-2.5 flex items-center gap-3 transition-colors shadow-sm"
            >
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-medium">New chat</span>
            </button>
          </div>
        )}

        {/* Chat History */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {groupedSessions.today.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground px-2 mb-2 font-medium">Today</p>
                {groupedSessions.today.map(session => (
                  <div
                    key={session.id}
                    className={`w-full px-2 py-2 rounded text-left text-sm hover:bg-muted transition-colors mb-1 relative session-menu ${
                      currentSessionId === session.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setCurrentSessionId(session.id)
                          setChatHistory(session.messages)
                          setShowPagination(false)
                          setCurrentPage(1)
                        }}
                        className="truncate text-foreground flex-1 cursor-pointer text-left bg-transparent border-0 p-0 hover:bg-transparent"
                      >
                        {session.title}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowSessionMenu(showSessionMenu === session.id ? null : session.id)
                        }}
                        className="p-1 hover:bg-muted/80 rounded transition-colors flex-shrink-0"
                      >
                        <MoreVertical className="w-3 h-3 text-muted-foreground" />
                      </button>
                      {showSessionMenu === session.id && (
                        <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[120px] session-menu">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExportSession(session.id)
                              setShowSessionMenu(null)
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                          >
                            <Download className="w-3 h-3" />
                            Export
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSession(session.id)
                              setShowSessionMenu(null)
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted text-destructive flex items-center gap-2"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {groupedSessions.week.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground px-2 mb-2 font-medium">7 Days</p>
                {groupedSessions.week.map(session => (
                  <button
                    key={session.id}
                    onClick={() => {
                      setCurrentSessionId(session.id)
                      setChatHistory(session.messages)
                      setShowPagination(false)
                      setCurrentPage(1)
                    }}
                    className={`w-full px-2 py-2 rounded text-left text-sm hover:bg-muted transition-colors mb-1 ${
                      currentSessionId === session.id ? 'bg-muted' : ''
                    }`}
                  >
                    <span className="truncate text-foreground">{session.title}</span>
                  </button>
                ))}
              </div>
            )}

            {groupedSessions.month.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground px-2 mb-2 font-medium">30 Days</p>
                {groupedSessions.month.map(session => (
                  <button
                    key={session.id}
                    onClick={() => {
                      setCurrentSessionId(session.id)
                      setChatHistory(session.messages)
                      setShowPagination(false)
                      setCurrentPage(1)
                    }}
                    className={`w-full px-2 py-2 rounded text-left text-sm hover:bg-muted transition-colors mb-1 ${
                      currentSessionId === session.id ? 'bg-muted' : ''
                    }`}
                  >
                    <span className="truncate text-foreground">{session.title}</span>
                  </button>
                ))}
              </div>
            )}

            {groupedSessions.older.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground px-2 mb-2 font-medium">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                {groupedSessions.older.map(session => (
                  <button
                    key={session.id}
                    onClick={() => {
                      setCurrentSessionId(session.id)
                      setChatHistory(session.messages)
                      setShowPagination(false)
                      setCurrentPage(1)
                    }}
                    className={`w-full px-2 py-2 rounded text-left text-sm hover:bg-muted transition-colors mb-1 ${
                      currentSessionId === session.id ? 'bg-muted' : ''
                    }`}
                  >
                    <span className="truncate text-foreground">{session.title}</span>
                  </button>
                ))}
              </div>
            )}

            {chatSessions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No chat history
              </div>
            )}
          </div>
        )}

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage 
                  src={userProfile?.avatar_url || user?.photoURL || "/placeholder.svg"} 
                  className="object-cover" 
                />
                <AvatarFallback className="text-xs">
                  {(userProfile?.username || user?.displayName || user?.email?.split('@')[0] || 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  {userProfile?.username || user?.displayName || user?.email?.split('@')[0] || 'User'}
                </p>
              </div>
              <span className="text-muted-foreground text-xs">⋯</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center justify-center px-4 relative">
          <h1 className="text-sm font-medium text-foreground">
            {chatSessions.find(s => s.id === currentSessionId)?.title || "New Chat"}
          </h1>
          <button
            onClick={handleUpload}
            className="ml-auto p-2 hover:bg-muted rounded transition-colors text-foreground"
            title="Upload file"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,text/*,.txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.go,.rs,.php,.rb,.sh,.yaml,.yml,.sql,.log"
          />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {isLoadingHistory ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-12 h-12 border-4 border-primary rounded-full animate-spin border-t-transparent mx-auto mb-4"></div>
              <p>Loading chat history...</p>
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Image
                  src="/dev-space-icon-transparent.png"
                  alt="GLOW"
                  width={64}
                  height={64}
                  className="object-contain opacity-50"
                />
              </div>
              <p className="text-lg font-medium mb-2 text-foreground">Start a conversation with GLOW</p>
              <p className="text-sm text-muted-foreground">Ask me anything about development, coding, or DevSpace!</p>
            </div>
          ) : (
            <>
            {paginatedMessages.map((message, index) => {
              const actualIndex = showPagination && chatHistory.length > messagesPerPage
                ? (currentPage - 1) * messagesPerPage + index
                : index
              return (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'user' ? (
                  <div className="max-w-[70%]">
                    {editingMessageIndex === index ? (
                      <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm">
                        <textarea
                          value={editedMessageContent}
                          onChange={(e) => setEditedMessageContent(e.target.value)}
                          className="w-full bg-transparent text-primary-foreground resize-none focus:outline-none"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex items-center gap-2 mt-2 justify-end">
                          <button
                            onClick={saveEdit}
                            className="px-2 py-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 rounded text-xs transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-2 py-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 rounded text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm">
                          {message.content}
                        </div>
                        <div className="flex items-center gap-2 mt-1 justify-end">
                          <button
                            onClick={() => copyToClipboard(message.content)}
                            className="p-1 hover:bg-muted rounded transition-colors" 
                            title="Copy"
                          >
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleEdit(index)}
                            className="p-1 hover:bg-muted rounded transition-colors" 
                            title="Edit"
                          >
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="max-w-[85%]">
                    <div className="text-sm leading-relaxed prose dark:prose-invert max-w-none prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-code:text-foreground">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => copyToClipboard(message.content)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => regenerateResponse(index)}
                        disabled={isLoading}
                        className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Regenerate"
                      >
                        <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleLike(index)}
                        className={`p-1 hover:bg-muted rounded transition-colors ${likedMessages.has(index) ? 'bg-primary/20' : ''}`}
                        title="Like"
                      >
                        <ThumbsUp className={`w-4 h-4 ${likedMessages.has(index) ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                      </button>
                      <button
                        onClick={() => handleDislike(index)}
                        className={`p-1 hover:bg-muted rounded transition-colors ${dislikedMessages.has(index) ? 'bg-destructive/20' : ''}`}
                        title="Dislike"
                      >
                        <ThumbsDown className={`w-4 h-4 ${dislikedMessages.has(index) ? 'text-destructive fill-destructive' : 'text-muted-foreground'}`} />
                      </button>
                      <button
                        onClick={() => handleShare(index)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title="Share"
                      >
                        <Share className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              )
            })}
            {showPagination && chatHistory.length > messagesPerPage && (
              <div className="flex items-center justify-center gap-2 mt-4 pb-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
            {!showPagination && chatHistory.length > messagesPerPage && (
              <div className="flex items-center justify-center mt-4 pb-4">
                <button
                  onClick={() => {
                    setShowPagination(true)
                    setCurrentPage(Math.ceil(chatHistory.length / messagesPerPage))
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
                  }}
                  className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded transition-colors text-muted-foreground"
                >
                  Show older messages
                </button>
              </div>
            )}
            </>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                    e.preventDefault()
                    handleAiChat(chatMessage)
                  }
                }}
                placeholder="Message GLOW"
                className="w-full bg-muted border border-border rounded-lg px-32 py-3 pr-24 text-sm focus:outline-none focus:border-primary text-foreground placeholder-muted-foreground"
                disabled={isLoading}
              />
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={handleDeepThink}
                  className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 border ${
                    deepThinkMode 
                      ? 'bg-primary/20 border-primary text-primary hover:bg-primary/30' 
                      : 'bg-background hover:bg-muted/80 border-border'
                  }`}
                  title="DeepThink mode"
                >
                  <Brain className={`w-3 h-3 ${deepThinkMode ? 'fill-current' : ''}`} />
                  DeepThink
                </button>
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={() => setShowGitHubDialog(true)}
                  disabled={isLoading}
                  className="p-2 hover:bg-muted/80 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Add GitHub repository"
                >
                  <Github className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploadingImage || isLoading}
                  className="p-2 hover:bg-muted/80 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Attach file"
                >
                  <Paperclip className={`w-4 h-4 text-muted-foreground ${uploadingImage ? 'animate-pulse' : ''}`} />
                </button>
                <button
                  onClick={() => handleAiChat(chatMessage)}
                  disabled={!chatMessage.trim() || isLoading}
                  className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">AI-generated, for reference only</p>
          </div>
        </div>
      </div>

      {/* GitHub Repository Dialog */}
      <RepositorySelector
        isOpen={showGitHubDialog}
        onClose={() => setShowGitHubDialog(false)}
        onSelect={handleGitHubRepoSelect}
      />
    </div>
  )
}
