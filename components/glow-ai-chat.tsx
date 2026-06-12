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
import rehypeRaw from "rehype-raw"
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
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new  Date()
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

    // Add empty placeholder assistant message that we'll stream into
    setChatHistory([...updatedHistory, { role: 'assistant' as const, content: '', timestamp: new Date() }])

    try {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemPrompt: GLOW_AI_SYSTEM_PROMPT,
          messages: [
            ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: message }
          ],
          webSearch: false
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        throw new Error('No body reader available');
      }

      let accumulatedContent = '';
      let isDone = false;

      while (!isDone) {
        const { value, done } = await reader.read();
        isDone = done;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          
          // Parse Server-Sent Events (SSE) from the response
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') {
                isDone = true;
                break;
              }
              try {
                const data = JSON.parse(dataStr);
                if (data.text) {
                  accumulatedContent += data.text;
                  setChatHistory(prev => {
                    const next = [...prev];
                    if (next.length > 0 && next[next.length - 1].role === 'assistant') {
                      next[next.length - 1] = {
                        ...next[next.length - 1],
                        content: accumulatedContent
                      };
                    }
                    return next;
                  });
                }
              } catch (e) {
                // Ignore parsing errors for partial or empty lines
              }
            }
          }
        }
      }

      const finalHistory: Message[] = [
        ...updatedHistory,
        { role: 'assistant' as const, content: accumulatedContent, timestamp: new Date() }
      ]
      setChatHistory(finalHistory)
      await saveChatHistory(finalHistory)
    } catch (error) {
      console.error('AI Chat error:', error)
      let errorMessage = 'Sorry, I encountered an error. Please try again.'

      if (error instanceof Error) {
        if (error.message.includes('Rate limit') || error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.'
        } else {
          errorMessage = `Sorry, I encountered an error: ${error.message}. Please try again later.`
        }
      }

      setChatHistory(prev => {
        const next = [...prev];
        if (next.length > 0 && next[next.length - 1].role === 'assistant') {
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: errorMessage
          };
        }
        return next;
      });
      
      const finalHistory: Message[] = [
        ...updatedHistory,
        { role: 'assistant' as const, content: errorMessage, timestamp: new Date() }
      ]
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
                        className={`max-w-[82%] lg:max-w-[72%] rounded-2xl border ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground border-primary/30 shadow-sm'
                            : 'bg-card text-foreground border-border shadow-sm'
                        } p-4`}
                      >
                        {message.role === 'assistant' ? (
                          <div className="text-xs leading-relaxed max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw]}
                              components={{
                                h1: ({ node, ...props }) => <h1 className="text-base font-extrabold text-white mt-4 mb-2 flex items-center gap-2 border-b border-white/10 pb-1" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-sm font-bold text-slate-100 mt-3.5 mb-2" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-xs font-semibold text-slate-200 mt-3 mb-1" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-2 space-y-1 text-slate-300" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 my-2 space-y-1 text-slate-300" {...props} />,
                                li: ({ node, ...props }) => <li className="text-xs leading-relaxed" {...props} />,
                                p: ({ node, ...props }) => <p className="text-xs leading-relaxed text-slate-300 my-2" {...props} />,
                                blockquote: ({ node, ...props }) => (
                                  <blockquote className="border-l-4 border-indigo-500 bg-indigo-500/5 px-4 py-2 my-3 rounded-r-xl text-slate-300 italic" {...props} />
                                ),
                                table: ({ node, ...props }) => (
                                  <div className="overflow-x-auto my-4 rounded-xl border border-white/10">
                                    <table className="w-full text-left border-collapse text-xs" {...props} />
                                  </div>
                                ),
                                thead: ({ node, ...props }) => <thead className="bg-white/5 text-slate-200 font-bold border-b border-white/10" {...props} />,
                                tbody: ({ node, ...props }) => <tbody className="divide-y divide-white/5" {...props} />,
                                tr: ({ node, ...props }) => <tr className="hover:bg-white/5 transition-colors" {...props} />,
                                th: ({ node, ...props }) => <th className="px-4 py-2 font-semibold" {...props} />,
                                td: ({ node, ...props }) => <td className="px-4 py-2 text-slate-300" {...props} />,
                                code: ({ node, inline, className, children, ...props }: any) => {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const isInline = !match && !children.includes('\n');
                                  if (isInline) {
                                    return (
                                      <code className="bg-slate-950 text-indigo-300 px-1.5 py-0.5 rounded-md font-mono text-[10px] border border-white/5" {...props}>
                                        {children}
                                      </code>
                                    );
                                  }
                                  return (
                                    <div className="relative my-4 group rounded-xl overflow-hidden border border-white/10 bg-slate-950 shadow-md">
                                      {match && (
                                        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-white/5 text-[9px] font-mono font-semibold text-slate-400">
                                          <span>{match[1].toUpperCase()}</span>
                                          <button
                                            type="button"
                                            onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                                            className="hover:text-white transition-colors"
                                          >
                                            Copy Code
                                          </button>
                                        </div>
                                      )}
                                      <pre className="p-3 overflow-x-auto text-[11px] text-indigo-100 font-mono leading-relaxed bg-slate-950">
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      </pre>
                                    </div>
                                  );
                                }
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{message.content}</p>
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

