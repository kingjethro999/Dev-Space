"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Github, 
  Star, 
  GitFork, 
  Eye, 
  Lock, 
  Globe, 
  Search, 
  Code, 
  Calendar,
  ExternalLink,
  CheckCircle
} from "lucide-react"
import { getUserRepositories, getRepositoryDetails } from "@/lib/github-utils"
import { useAuth } from "@/lib/auth-context"
import { formatDistanceToNow } from "date-fns"

interface Repository {
  id: number
  name: string
  fullName: string
  description: string
  language: string
  stars: number
  forks: number
  watchers: number
  private: boolean
  url: string
  cloneUrl: string
  defaultBranch: string
  updatedAt: string
  createdAt: string
}

interface RepositorySelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (repository: Repository) => void
  selectedRepository?: Repository | null
}

export function RepositorySelector({ isOpen, onClose, onSelect, selectedRepository }: RepositorySelectorProps) {
  const { user } = useAuth()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && user) {
      loadRepositories()
    }
  }, [isOpen, user])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = repositories.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.language?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredRepos(filtered)
    } else {
      setFilteredRepos(repositories)
    }
  }, [searchQuery, repositories])

  const loadRepositories = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Get GitHub access token from user document
      const response = await fetch('/api/github/repositories', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.uid}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch repositories' }))
        throw new Error(errorData.error || 'Failed to fetch repositories')
      }

      const data = await response.json()
      setRepositories(data.repositories || [])
    } catch (error: any) {
      console.error('Error loading repositories:', error)
      const errorMessage = error.message || 'Failed to load repositories. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (repository: Repository) => {
    onSelect(repository)
    onClose()
  }

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'JavaScript': 'bg-yellow-500',
      'TypeScript': 'bg-blue-500',
      'Python': 'bg-green-500',
      'Java': 'bg-orange-500',
      'C++': 'bg-blue-600',
      'C#': 'bg-purple-500',
      'Go': 'bg-cyan-500',
      'Rust': 'bg-orange-600',
      'PHP': 'bg-indigo-500',
      'Ruby': 'bg-red-500',
      'Swift': 'bg-orange-400',
      'Kotlin': 'bg-purple-600',
      'Dart': 'bg-blue-400',
      'HTML': 'bg-orange-500',
      'CSS': 'bg-blue-500',
      'Vue': 'bg-green-400',
      'React': 'bg-cyan-400',
      'Angular': 'bg-red-500',
    }
    return colors[language] || 'bg-gray-500'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col bg-card border-border p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-border">
          <DialogTitle className="flex items-center space-x-2 text-foreground">
            <Github className="w-5 h-5" />
            <span>Select Repository</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-6 pt-4">
          {/* Search */}
          <div className="relative flex-shrink-0 mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Content - Scrollable Area */}
          <div className="flex-1 min-h-0 flex flex-col">
            {loading ? (
              <div className="flex items-center justify-center flex-1">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your repositories...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center flex-1">
                <div className="text-center">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={loadRepositories} variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="flex items-center justify-center flex-1">
                <div className="text-center">
                  <Github className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No repositories found matching your search.' : 'No repositories found.'}
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-4 pb-4">
                  {filteredRepos.map((repo) => (
                    <Card
                      key={repo.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedRepository?.id === repo.id 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleSelect(repo)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-foreground truncate">
                                {repo.name}
                              </h3>
                              {repo.private ? (
                                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              )}
                              {selectedRepository?.id === repo.id && (
                                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                              )}
                            </div>
                            
                            {repo.description && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {repo.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              {repo.language && (
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-3 h-3 rounded-full ${getLanguageColor(repo.language)}`} />
                                  <span>{repo.language}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5" />
                                <span>{repo.stars}</span>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <GitFork className="w-3.5 h-3.5" />
                                <span>{repo.forks}</span>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5" />
                                <span>{repo.watchers}</span>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Updated {formatDistanceToNow(new Date(repo.updatedAt), { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(repo.url, '_blank')
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0 bg-background">
          <p className="text-sm text-muted-foreground">
            {filteredRepos.length} repository{filteredRepos.length !== 1 ? 'ies' : 'y'} found
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {selectedRepository && (
              <Button onClick={() => handleSelect(selectedRepository)}>
                Select Repository
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
