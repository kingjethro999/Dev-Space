"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  Clock, 
  Heart, 
  MessageCircle, 
  Star, 
  Zap, 
  Target,
  Code,
  BookOpen,
  Bug,
  Rocket,
  Users,
  Lightbulb,
  Trophy,
  Wrench,
  TrendingUp,
  MessageSquare,
  Globe,
  Lock,
  ChevronDown,
  ChevronUp,
  MapPin,
  User,
  ExternalLink,
  Image as ImageIcon,
  Video,
  FileText,
  Link as LinkIcon,
  Share2,
  Link
} from "lucide-react"
import { JourneyEntry, JourneyEntryType, JourneyMood } from "@/lib/journey-schema"
import { formatDistanceToNow, format } from "date-fns"
import { JourneyAttachmentViewer } from "./journey-attachment-viewer"
import { JourneyReactions } from "./journey-reactions"
import { JourneyComments } from "./journey-comments"

interface JourneyEntryCardProps {
  entry: JourneyEntry
  isExpanded: boolean
  onToggleExpansion: () => void
  isOwner: boolean
  showFullContent?: boolean
}

export function JourneyEntryCard({ 
  entry, 
  isExpanded, 
  onToggleExpansion, 
  isOwner,
  showFullContent = false 
}: JourneyEntryCardProps) {
  const [showComments, setShowComments] = useState(false)

  const getEntryIcon = (type: JourneyEntryType) => {
    const iconMap = {
      ideation: Lightbulb,
      learning: BookOpen,
      development: Code,
      debugging: Bug,
      testing: Target,
      deployment: Rocket,
      collaboration: Users,
      reflection: MessageSquare,
      milestone: Trophy,
      challenge: Wrench,
      breakthrough: Zap,
      maintenance: Wrench,
      scaling: TrendingUp,
      community: Globe,
    }
    return iconMap[type] || Code
  }

  const getMoodIcon = (mood?: JourneyMood) => {
    const moodMap = {
      excited: "😄",
      focused: "🎯",
      frustrated: "😤",
      accomplished: "🎉",
      stuck: "😵",
      inspired: "✨",
      tired: "😴",
      proud: "😌",
      confused: "🤔",
      motivated: "💪",
      overwhelmed: "😰",
      satisfied: "😊",
      curious: "🤓",
    }
    return mood ? moodMap[mood] || "😐" : "😐"
  }

  const getMoodColor = (mood?: JourneyMood) => {
    const colorMap = {
      excited: "text-yellow-500",
      focused: "text-blue-500",
      frustrated: "text-red-500",
      accomplished: "text-green-500",
      stuck: "text-gray-500",
      inspired: "text-purple-500",
      tired: "text-orange-500",
      proud: "text-pink-500",
      confused: "text-yellow-600",
      motivated: "text-green-600",
      overwhelmed: "text-red-600",
      satisfied: "text-blue-600",
      curious: "text-purple-600",
    }
    return mood ? colorMap[mood] || "text-gray-500" : "text-gray-400"
  }

  const getTypeColor = (type: JourneyEntryType) => {
    const colorMap = {
      ideation: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      learning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      development: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      debugging: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      testing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      deployment: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      collaboration: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      reflection: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      milestone: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      challenge: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      breakthrough: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      maintenance: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
      scaling: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
      community: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
    }
    return colorMap[type] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image': return ImageIcon
      case 'video': return Video
      case 'code': return Code
      case 'file': return FileText
      case 'link': return LinkIcon
      default: return FileText
    }
  }

  const Icon = getEntryIcon(entry.type)
  const contentPreview = entry.content.length > 200 ? entry.content.substring(0, 200) + "..." : entry.content
  const shouldShowPreview = !isExpanded && entry.content.length > 200
  const entryUrl = typeof window !== 'undefined' ? `${window.location.origin}/projects/${(entry as any).projectId}/journey?entry=${entry.id}` : ''

  return (
    <motion.div
      layout
      transition={{ duration: 0.2 }}
    >
      <Card className={`transition-all duration-200 hover:shadow-md ${
        entry.isMilestone ? 'ring-2 ring-yellow-200 dark:ring-yellow-800' : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                entry.isMilestone ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-primary/10'
              }`}>
                <Icon className={`w-5 h-5 ${
                  entry.isMilestone ? 'text-yellow-600 dark:text-yellow-400' : 'text-primary'
                }`} />
              </div>
              <div>
                <CardTitle className="text-lg">{entry.title}</CardTitle>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{format(entry.timestamp, 'MMM d, yyyy')}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(entry.timestamp, { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {entry.isMilestone && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  <Trophy className="w-3 h-3 mr-1" />
                  Milestone
                </Badge>
              )}
              <Badge className={getTypeColor(entry.type)}>
                {entry.type.replace('_', ' ')}
              </Badge>
              {!entry.isPublic && (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Mood and Energy */}
          {(entry.mood || entry.energy) && (
            <div className="flex items-center space-x-4">
              {entry.mood && (
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getMoodIcon(entry.mood)}</span>
                  <span className={`text-sm font-medium ${getMoodColor(entry.mood)}`}>
                    {entry.mood}
                  </span>
                </div>
              )}
              {entry.energy && (
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">
                    Energy: {entry.energy}/10
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="text-foreground whitespace-pre-wrap">
              {shouldShowPreview ? contentPreview : entry.content}
            </p>
          </div>

          {/* Skills Learned */}
          {entry.skillsLearned.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Skills Learned</h4>
              <div className="flex flex-wrap gap-2">
                {entry.skillsLearned.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Challenges and Solutions */}
          {(entry.challenges.length > 0 || entry.solutions.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entry.challenges.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Challenges</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {entry.challenges.map((challenge, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {entry.solutions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">Solutions</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {entry.solutions.map((solution, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {entry.attachments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Attachments</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {entry.attachments.map((attachment, index) => {
                  const AttachmentIcon = getAttachmentIcon(attachment.type)
                  return (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                    >
                      <AttachmentIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm truncate">{attachment.title || `Attachment ${index + 1}`}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div>
              <div className="flex flex-wrap gap-1">
                {entry.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              {entry.timeSpent && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{Math.round(entry.timeSpent / 60)}h {entry.timeSpent % 60}m</span>
                </div>
              )}
              {entry.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{entry.location}</span>
                </div>
              )}
              {entry.collaborators && entry.collaborators.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{entry.collaborators.length} collaborator{entry.collaborators.length !== 1 ? 's' : ''}</span>
                </div>
              )}
              {entry.forkUrl && (
                <a href={entry.forkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-primary">
                  <Link className="w-4 h-4" />
                  <span>Code</span>
                </a>
              )}
              {entry.branchName && (
                <div className="flex items-center space-x-1">
                  <Code className="w-4 h-4" />
                  <span>{entry.branchName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status & Attribution */}
          {(entry as any).status && (
            <div className="flex items-center gap-2 pt-2">
              {(entry as any).status === 'pending' && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Pending Review</Badge>
              )}
              {(entry as any).status === 'approved' && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Approved Contribution</Badge>
              )}
              {(entry as any).status === 'rejected' && (
                <Badge variant="secondary" className="bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">Rejected</Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-4">
              <JourneyReactions entryId={entry.id} reactions={[]} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                {typeof (entry as any).commentsCount === 'number' 
                  ? (entry as any).commentsCount 
                  : (Array.isArray((entry as any).comments) ? (entry as any).comments.length : 0)}
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(entryUrl)
                  } catch (e) {
                    console.error('Copy failed', e)
                  }
                }}
              >
                <Link className="w-4 h-4 mr-1" />
                Copy link
              </Button>
              <a
                href={`/discussions/new?title=${encodeURIComponent('Discuss: ' + entry.title)}&ref=${encodeURIComponent(entryUrl)}`}
              >
                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share to Discussion
                </Button>
              </a>
              {shouldShowPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleExpansion}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Show More
                    </>
                  )}
                </Button>
              )}
              {isOwner && (
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              )}
            </div>
          </div>

          {/* Comments */}
          {showComments && (
            <JourneyComments entryId={entry.id} comments={entry.comments} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

