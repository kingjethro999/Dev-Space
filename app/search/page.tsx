"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { performGlobalSearch, type SearchResult } from "@/lib/search-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"
import { Code2, MessageSquare, Users } from "lucide-react"

export default function SearchPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [results, setResults] = useState<{
    projects: SearchResult[]
    discussions: SearchResult[]
    users: SearchResult[]
    total: number
  }>({ projects: [], discussions: [], users: [], total: 0 })
  const [searchLoading, setSearchLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(!!initialQuery)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults({ projects: [], discussions: [], users: [], total: 0 })
      setHasSearched(false)
      return
    }

    setSearchLoading(true)
    setHasSearched(true)

    try {
      const searchResults = await performGlobalSearch(query)
      setResults(searchResults)
    } catch (error) {
      console.error("Error performing search:", error)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(searchQuery)
  }

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/feed" className="text-2xl font-bold text-primary">
            Dev Space
          </Link>
          <div className="flex gap-4">
            <Link href="/feed">
              <Button variant="ghost">Feed</Button>
            </Link>
            <Link href="/discover">
              <Button variant="ghost">Discover</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-4">Search Dev Space</h1>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects, discussions, developers..."
                  className="flex-1"
                />
                <Button type="submit">Search</Button>
              </form>
            </div>
            <div className="hidden lg:block">
              <Image
                src="/illustrations/online-world.png"
                alt="Search Illustration"
                width={200}
                height={150}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>

        {searchLoading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground mt-4">Searching...</p>
            </div>
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-12 text-muted-foreground">
            <Image
              src="/illustrations/Innovation-bro.png"
              alt="Search Illustration"
              width={300}
              height={200}
              className="mx-auto mb-4 rounded-lg"
            />
            <p>Enter a search query to find projects, discussions, and developers</p>
          </div>
        ) : results.total === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Image
              src="/illustrations/Contact-us.png"
              alt="No Results"
              width={300}
              height={200}
              className="mx-auto mb-4 rounded-lg"
            />
            <p>No results found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-8">
            {results.projects.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Code2 className="w-5 h-5 text-blue-400" />
                  <h2 className="text-2xl font-bold text-foreground">Projects ({results.projects.length})</h2>
                </div>
                <div className="space-y-4">
                  {results.projects.map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer">
                        <h3 className="text-lg font-bold text-white hover:text-blue-400 mb-2">{project.title}</h3>
                        <p className="text-sm text-slate-300 mb-3 line-clamp-2">{project.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {project.metadata.tech_stack?.slice(0, 4).map((tech: string) => (
                            <span key={tech} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.discussions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  <h2 className="text-2xl font-bold text-foreground">Discussions ({results.discussions.length})</h2>
                </div>
                <div className="space-y-4">
                  {results.discussions.map((discussion) => (
                    <Link key={discussion.id} href={`/discussions/${discussion.id}`}>
                      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-white hover:text-purple-400">{discussion.title}</h3>
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                            {discussion.metadata.category}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 line-clamp-2">{discussion.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.users.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-2xl font-bold text-foreground">Developers ({results.users.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.users.map((user) => (
                    <Link key={user.id} href={`/profile/${user.id}`}>
                      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer">
                        <div className="flex items-start gap-4">
                          {user.metadata.avatar_url && (
                            <img
                              src={user.metadata.avatar_url || "/placeholder.svg"}
                              alt={user.title}
                              className="w-12 h-12 rounded-full"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white hover:text-cyan-400">{user.title}</h3>
                            <p className="text-sm text-slate-300 line-clamp-2">{user.description}</p>
                            {user.metadata.skills && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {user.metadata.skills.slice(0, 3).map((skill: string) => (
                                  <span key={skill} className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
