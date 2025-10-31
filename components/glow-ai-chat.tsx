"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bot, Send, X, History, Trash2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { motion, AnimatePresence } from "framer-motion"
import { GLOW_AI_SYSTEM_PROMPT } from "@/lib/glow-ai-config"

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

interface GlowAIChatProps {
  /** Show the floating button to open chat */
  showButton?: boolean
  /** Open chat by default */
  defaultOpen?: boolean
}

export function GlowAIChat({ showButton = true, defaultOpen = false }: GlowAIChatProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [chatMessage, setChatMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory, isLoading])

  // Load chat history when component mounts or user changes
  useEffect(() => {
    if (user && isOpen) {
      loadChatHistory()
    } else if (!user) {
      setChatHistory([])
      setIsLoadingHistory(false)
    }
  }, [user, isOpen])

  const loadChatHistory = async () => {
    if (!user) return
    
    setIsLoadingHistory(true)
    try {
      const response = await fetch(`/api/glow/history?userId=${user.uid}`)
      if (response.ok) {
        const data = await response.json()
        if (data.history && Array.isArray(data.history)) {
          // Convert timestamps to dates
          const history = data.history.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
          }))
          setChatHistory(history)
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const saveChatHistory = async (messages: Message[]) => {
    if (!user) return
    
    try {
      await fetch('/api/glow/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp || new Date()
          }))
        })
      })
    } catch (error) {
      console.error('Failed to save chat history:', error)
    }
  }

  const clearHistory = async () => {
    if (!user) return
    
    try {
      await fetch(`/api/glow/history?userId=${user.uid}`, {
        method: 'DELETE'
      })
      setChatHistory([])
    } catch (error) {
      console.error('Failed to clear chat history:', error)
    }
  }

  const handleAiChat = async (message: string) => {
    if (!message.trim() || !user) return

    setIsLoading(true)
    const userMessage: Message = { role: 'user', content: message, timestamp: new Date() }
    const updatedHistory = [...chatHistory, userMessage]
    setChatHistory(updatedHistory)
    setChatMessage("")

    try {
      // Use our secure API route instead of calling OpenRouter directly
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
            ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: message }
          ]
        })
      })

      if (!response.ok) {
        // Try to get error details
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = typeof errorData.error === 'string' 
              ? errorData.error 
              : errorData.error.message || errorMessage;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `${response.status}: ${response.statusText || 'Unknown error'}`;
        }

        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
        }
        throw new Error(errorMessage);
      }

      const data = await response.json()

      // Handle different response formats (OpenRouter/Gemini format)
      let assistantMessage = ''
      if (data.choices && data.choices.length > 0) {
        const choice = data.choices[0]
        // Handle both string content and array content formats
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
      
      // Save history to Firestore
      await saveChatHistory(finalHistory)
    } catch (error) {
      console.error('AI Chat error:', error)

      // Provide helpful fallback responses based on error type
      let errorMessage = 'Sorry, I encountered an error. Please try again.'

      if (error instanceof Error) {
        if (error.message.includes('Rate limit')) {
          errorMessage = 'I\'m getting too many requests right now. Please wait a moment and try again. In the meantime, feel free to explore DevSpace features!'
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please wait a moment before trying again. You can explore the DevSpace platform while you wait!'
        } else {
          errorMessage = `Sorry, I encountered an error: ${error.message}. Please try again later.`
        }
      }

      const errorResponse: Message = { 
        role: 'assistant', 
        content: errorMessage,
        timestamp: new Date()
      }
      
      const finalHistory = [...updatedHistory, errorResponse]
      setChatHistory(finalHistory)
      await saveChatHistory(finalHistory)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user && showButton) {
    // Don't show chat if user is not authenticated
    return null
  }

  // Don't show floating button if we're already on /glow/ai page
  const isOnGlowAIPage = pathname === '/glow/ai'

  return (
    <>
      {/* Floating AI Chat Button */}
      {showButton && !isOnGlowAIPage && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          onClick={() => router.push('/glow/ai')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 z-40 hover:scale-110"
          aria-label="Open Glow AI Chat"
        >
          <Bot className="w-6 h-6 text-primary-foreground" />
        </motion.button>
      )}

      {/* AI Chat Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl h-[80vh] bg-card border-border flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center space-x-2 text-foreground">
                <Bot className="w-5 h-5" />
                <span>Glow AI by DevSpace</span>
              </DialogTitle>
              <div className="flex items-center gap-2">
                {chatHistory.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto space-y-4 p-6">
              {isLoadingHistory ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50 animate-pulse" />
                  <p>Loading chat history...</p>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium mb-2">Hi! I'm Glow AI by DevSpace</p>
                  <p>Ask me anything about development, coding, or DevSpace!</p>
                  <div className="mt-6 text-sm space-y-1">
                    <p className="text-muted-foreground">Try asking:</p>
                    <p className="text-foreground">• "How do I implement authentication in Next.js?"</p>
                    <p className="text-foreground">• "What are best practices for React hooks?"</p>
                    <p className="text-foreground">• "Explain Firebase Firestore queries"</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  {chatHistory.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] lg:max-w-[70%] px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-current prose-p:text-current prose-strong:text-current prose-code:text-current prose-pre:text-current">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg">
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

            {/* Chat Input */}
            <div className="border-t border-border p-4 flex-shrink-0">
              <div className="flex space-x-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                      e.preventDefault()
                      handleAiChat(chatMessage)
                    }
                  }}
                  placeholder="Ask Glow AI anything... (Press Enter to send, Shift+Enter for new line)"
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleAiChat(chatMessage)}
                  disabled={!chatMessage.trim() || isLoading}
                  size="lg"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

