"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Bot, Send, X, Code2, Sparkles, FolderTree, 
  Terminal, ShieldCheck, HelpCircle, Loader2, BookOpen
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp?: Date
}

interface IndexedFile {
  path: string
  content: string
}

interface ProjectAIChatProps {
  projectTitle: string
  githubUrl?: string
  projectDescription: string
  readmeContent?: string | null
}

export function ProjectAIChat({ 
  projectTitle, 
  githubUrl, 
  projectDescription, 
  readmeContent 
}: ProjectAIChatProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Indexing states
  const [isIndexing, setIsIndexing] = useState(false)
  const [indexSuccess, setIndexSuccess] = useState(false)
  const [indexedFiles, setIndexedFiles] = useState<IndexedFile[]>([])
  const [indexingStep, setIndexingStep] = useState("")
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when history updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory, isLoading, isIndexing])

  // Trigger file indexing
  const startIndexing = async () => {
    if (!githubUrl) {
      // If no GitHub URL, fall back to README
      setIndexingStep("No GitHub URL found. Using project description and README context...")
      setTimeout(() => {
        setIndexedFiles([
          { path: "README.md", content: readmeContent || projectDescription },
          { path: "Project Details", content: projectDescription }
        ])
        setIndexSuccess(true)
        setIsIndexing(false)
      }, 1000)
      return
    }

    setIsIndexing(true)
    setIndexSuccess(false)
    setIndexedFiles([])
    
    const steps = [
      "Connecting to GitHub API...",
      "Analyzing repository file tree...",
      "Filtering source files (excluding dependencies)...",
      "Prioritizing configuration and entrypoints...",
      "Parsing contents of code files...",
      "Finalizing codebase context index..."
    ]

    let stepIndex = 0
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        setIndexingStep(steps[stepIndex])
        stepIndex++
      }
    }, 600)

    try {
      const response = await fetch("/api/github/index-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          githubUrl, 
          userId: user?.uid 
        })
      })

      clearInterval(stepInterval)

      if (response.ok) {
        const data = await response.json()
        if (data.files && Array.isArray(data.files)) {
          setIndexedFiles(data.files)
          setIndexSuccess(true)
        } else {
          throw new Error("Invalid response structure")
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to index code")
      }
    } catch (error) {
      console.error("Failed to index repository code:", error)
      setIndexingStep(`Indexing failed: ${error instanceof Error ? error.message : "GitHub limits reached"}. Falling back to README context.`)
      // Fallback
      setTimeout(() => {
        setIndexedFiles([
          { path: "README.md", content: readmeContent || projectDescription },
          { path: "Project Details", content: projectDescription }
        ])
        setIndexSuccess(true)
      }, 2000)
    } finally {
      setIsIndexing(false)
    }
  }

  // Handle open/close
  const toggleDrawer = () => {
    if (!isOpen) {
      setIsOpen(true)
      if (!indexSuccess && !isIndexing) {
        startIndexing()
      }
    } else {
      setIsOpen(false)
    }
  }

  // Suggest prompt click
  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return
    handleAiChat(prompt)
  }

  const handleAiChat = async (message: string) => {
    if (!message.trim() || !user) return

    setIsLoading(true)
    const userMessage: Message = { role: "user", content: message, timestamp: new Date() }
    const updatedHistory = [...chatHistory, userMessage]
    setChatHistory(updatedHistory)
    setChatMessage("")

    // Add empty placeholder assistant message that we'll stream into
    setChatHistory([...updatedHistory, { role: "assistant" as const, content: "", timestamp: new Date() }])

    try {
      // Build Context System Prompt
      const filesContext = indexedFiles
        .map(f => `--- FILE: ${f.path} ---\n${f.content.substring(0, 3000)}`)
        .join("\n\n")

      const systemPrompt = `You are a Senior Software Architect and Developer Assistant specialized in analyzing the codebase of the project "${projectTitle}".
Your task is to answer the user's queries about this project's architecture, dependencies, codebase, algorithms, and integration steps.

Below is the contextual index of the key files fetched from the repository:
${filesContext}

Provide thorough, clean, and developer-friendly answers. Use clear markdown headers, highlights, tables, and correctly annotated code blocks if code is requested. Link your thoughts directly to the architecture described in the files context.`

      const response = await fetch("/api/groq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemPrompt,
          messages: [
            ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: message }
          ],
          webSearch: false
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) {
        throw new Error("No body reader available")
      }

      let accumulatedContent = ""
      let isDone = false

      while (!isDone) {
        const { value, done } = await reader.read()
        isDone = done
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6).trim()
              if (dataStr === "[DONE]") {
                isDone = true
                break
              }
              try {
                const data = JSON.parse(dataStr)
                if (data.text) {
                  accumulatedContent += data.text
                  setChatHistory(prev => {
                    const next = [...prev]
                    if (next.length > 0 && next[next.length - 1].role === "assistant") {
                      next[next.length - 1] = {
                        ...next[next.length - 1],
                        content: accumulatedContent
                      }
                    }
                    return next
                  })
                }
              } catch (e) {
                // Ignore parsing errors for partial streams
              }
            }
          }
        }
      }

      setChatHistory([
        ...updatedHistory,
        { role: "assistant" as const, content: accumulatedContent, timestamp: new Date() }
      ])
    } catch (error) {
      console.error("Project AI Chat error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to obtain AI response."
      setChatHistory(prev => {
        const next = [...prev]
        if (next.length > 0 && next[next.length - 1].role === "assistant") {
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: `⚠️ **Error generating response:** ${errorMessage}`
          }
        }
        return next
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Ask AI Trigger Button - Gradient Accent Glow */}
      <Button 
        onClick={toggleDrawer}
        className="relative overflow-hidden group bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/45 transition-all duration-300 font-semibold gap-2 rounded-xl py-6 px-6"
      >
        <Sparkles className="w-5 h-5 animate-pulse text-indigo-200" />
        <span>Ask AI About This Project</span>
        <span className="absolute inset-0 w-full h-full bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
      </Button>

      {/* Slide-out Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={toggleDrawer}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 150 }}
              className="fixed top-0 right-0 h-screen w-full sm:w-[480px] md:w-[600px] lg:w-[640px] bg-slate-950/95 backdrop-blur-md border-l border-white/10 z-50 flex flex-col shadow-2xl overflow-hidden font-sans"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/10 bg-slate-900/60 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/25 rounded-xl">
                    <Bot className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      Project AI Agent
                      <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full font-medium">
                        Codebase Context
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">Powered by Llama & Groq Speed</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleDrawer}
                  className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Indexing / Loading Status */}
              {(isIndexing || !indexSuccess) && (
                <div className="p-6 bg-indigo-950/20 border-b border-white/5 flex flex-col gap-3 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    <span className="text-sm text-slate-300 font-medium">{indexingStep}</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{ width: isIndexing ? "75%" : "20%" }} />
                  </div>
                </div>
              )}

              {/* Indexing Success - Show Indexed Files */}
              {indexSuccess && indexedFiles.length > 0 && (
                <div className="px-6 py-3 bg-slate-900/40 border-b border-white/5 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
                      INDEXED FILES ({indexedFiles.length})
                    </span>
                    <button 
                      onClick={startIndexing}
                      className="text-[10px] text-indigo-400 hover:underline font-semibold"
                    >
                      Re-index codebase
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto scrollbar-hide py-1">
                    {indexedFiles.map((f, i) => (
                      <span 
                        key={i} 
                        className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 text-slate-300 rounded-lg flex items-center gap-1 hover:border-indigo-500/30 transition-colors"
                        title={f.path}
                      >
                        <Code2 className="w-2.5 h-2.5 text-indigo-300" />
                        {f.path.split("/").pop()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Viewport */}
              <ScrollArea className="flex-1 p-6 space-y-6">
                <div className="space-y-6 pb-6">
                  {/* Assistant Introduction */}
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-sm">
                      <p className="text-sm text-slate-300 leading-relaxed">
                        Hi, I am your dedicated AI Assistant for <strong>{projectTitle}</strong>. 
                        I have indexed the codebase including code files, configuration configurations, and dependencies.
                        Ask me anything about how the project works, architecture designs, or code snippets!
                      </p>

                      {/* Quick Prompts Grid */}
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={() => handleQuickPrompt("Explain codebase architecture")}
                          className="text-left text-xs p-2.5 bg-slate-900/60 hover:bg-slate-900/90 text-indigo-300 border border-indigo-500/15 hover:border-indigo-500/40 rounded-xl transition-all duration-200"
                        >
                          📐 Explain architecture
                        </button>
                        <button
                          onClick={() => handleQuickPrompt("What are the main APIs, routes, or dependencies used?")}
                          className="text-left text-xs p-2.5 bg-slate-900/60 hover:bg-slate-900/90 text-indigo-300 border border-indigo-500/15 hover:border-indigo-500/40 rounded-xl transition-all duration-200"
                        >
                          🔌 APIs & Dependencies
                        </button>
                        <button
                          onClick={() => handleQuickPrompt("How does authentication and user management work here?")}
                          className="text-left text-xs p-2.5 bg-slate-900/60 hover:bg-slate-900/90 text-indigo-300 border border-indigo-500/15 hover:border-indigo-500/40 rounded-xl transition-all duration-200"
                        >
                          🔒 How does auth work?
                        </button>
                        <button
                          onClick={() => handleQuickPrompt("Generate a developer onboarding guide for setting up and running this codebase")}
                          className="text-left text-xs p-2.5 bg-slate-900/60 hover:bg-slate-900/90 text-indigo-300 border border-indigo-500/15 hover:border-indigo-500/40 rounded-xl transition-all duration-200"
                        >
                          🚀 Setup onboarding guide
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Conversation History */}
                  <AnimatePresence>
                    {chatHistory.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <div 
                          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            msg.role === "user" 
                              ? "bg-gradient-to-tr from-violet-600 to-indigo-600 text-white" 
                              : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                          }`}
                        >
                          {msg.role === "user" ? <Terminal className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div 
                          className={`flex-1 rounded-2xl border p-4 shadow-sm overflow-hidden ${
                            msg.role === "user"
                              ? "bg-slate-900/80 border-white/10 text-slate-100"
                              : "bg-slate-900/45 border-white/5 text-slate-200"
                          }`}
                        >
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm prose-invert max-w-none text-slate-300 leading-relaxed
                              prose-headings:text-white prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
                              prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                              prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5
                              prose-code:bg-slate-950 prose-code:text-indigo-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                              prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-3 prose-pre:mt-2
                              prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-500/5 prose-blockquote:px-3 prose-blockquote:py-1 prose-blockquote:rounded-r-lg"
                            >
                              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Loader for response streaming */}
                  {isLoading && (
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Bot className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="bg-slate-900/40 border border-white/5 px-4 py-3 rounded-2xl flex items-center gap-1">
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" />
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Form */}
              <div className="p-4 border-t border-white/10 bg-slate-950/80 flex-shrink-0">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!isLoading && chatMessage.trim()) {
                      handleAiChat(chatMessage)
                    }
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Ask about components, routes, or algorithms..."
                    disabled={isLoading || isIndexing}
                    className="flex-1 bg-slate-900/60 border-white/10 text-white rounded-xl placeholder:text-slate-500 focus-visible:ring-indigo-500 focus-visible:ring-offset-0"
                  />
                  <Button
                    type="submit"
                    disabled={!chatMessage.trim() || isLoading || isIndexing}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-5"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
