"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  Image as ImageIcon,
  Video,
  FileText,
  Link as LinkIcon,
  Code,
  Target,
  BookOpen,
  Bug,
  Rocket,
  Lightbulb,
  Trophy,
  Wrench,
  MessageSquare,
  TrendingUp,
  Globe
} from "lucide-react"
import { 
  JourneyEntryType, 
  JourneyMood, 
  MilestoneType,
  CreateJourneyEntryData,
  JourneyAttachment
} from "@/lib/journey-schema"
import { createJourneyEntry } from "@/lib/journey-utils"
import { toast } from "@/hooks/use-toast"

interface JourneyEntryFormProps {
  projectId: string
  userId: string
  onSuccess: () => void
  onCancel: () => void
  initialData?: Partial<CreateJourneyEntryData>
}

export function JourneyEntryForm({ 
  projectId, 
  userId, 
  onSuccess, 
  onCancel,
  initialData 
}: JourneyEntryFormProps) {
  const [formData, setFormData] = useState<CreateJourneyEntryData>({
    projectId,
    type: initialData?.type || 'development',
    title: initialData?.title || '',
    content: initialData?.content || '',
    mood: initialData?.mood,
    energy: initialData?.energy || 5,
    tags: initialData?.tags || [],
    attachments: initialData?.attachments || [],
    isPublic: initialData?.isPublic ?? true,
    isMilestone: initialData?.isMilestone ?? false,
    milestoneType: initialData?.milestoneType,
    skillsLearned: initialData?.skillsLearned || [],
    challenges: initialData?.challenges || [],
    solutions: initialData?.solutions || [],
    timeSpent: initialData?.timeSpent,
    location: initialData?.location,
    collaborators: initialData?.collaborators || [],
  })

  const [newTag, setNewTag] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [newChallenge, setNewChallenge] = useState('')
  const [newSolution, setNewSolution] = useState('')
  const [loading, setLoading] = useState(false)
  const [forkUrl, setForkUrl] = useState('')
  const [branchName, setBranchName] = useState('')

  const entryTypeOptions = [
    { value: 'ideation', label: 'Ideation', icon: Lightbulb, description: 'Brainstorming, planning, research' },
    { value: 'learning', label: 'Learning', icon: BookOpen, description: 'Tutorials, courses, documentation' },
    { value: 'development', label: 'Development', icon: Code, description: 'Coding, building features' },
    { value: 'debugging', label: 'Debugging', icon: Bug, description: 'Fixing bugs, troubleshooting' },
    { value: 'testing', label: 'Testing', icon: Target, description: 'Writing tests, QA' },
    { value: 'deployment', label: 'Deployment', icon: Rocket, description: 'Going live, CI/CD' },
    { value: 'collaboration', label: 'Collaboration', icon: Users, description: 'Team work, code reviews' },
    { value: 'reflection', label: 'Reflection', icon: MessageSquare, description: 'Personal insights, lessons' },
    { value: 'milestone', label: 'Milestone', icon: Trophy, description: 'Major achievements' },
    { value: 'challenge', label: 'Challenge', icon: Wrench, description: 'Problems faced' },
    { value: 'breakthrough', label: 'Breakthrough', icon: TrendingUp, description: 'Major solutions' },
    { value: 'maintenance', label: 'Maintenance', icon: Wrench, description: 'Updates, bug fixes' },
    { value: 'scaling', label: 'Scaling', icon: TrendingUp, description: 'Performance improvements' },
    { value: 'community', label: 'Community', icon: Globe, description: 'User feedback, community' },
  ]

  const moodOptions = [
    { value: 'excited', label: 'Excited', emoji: '😄' },
    { value: 'focused', label: 'Focused', emoji: '🎯' },
    { value: 'frustrated', label: 'Frustrated', emoji: '😤' },
    { value: 'accomplished', label: 'Accomplished', emoji: '🎉' },
    { value: 'stuck', label: 'Stuck', emoji: '😵' },
    { value: 'inspired', label: 'Inspired', emoji: '✨' },
    { value: 'tired', label: 'Tired', emoji: '😴' },
    { value: 'proud', label: 'Proud', emoji: '😌' },
    { value: 'confused', label: 'Confused', emoji: '🤔' },
    { value: 'motivated', label: 'Motivated', emoji: '💪' },
    { value: 'overwhelmed', label: 'Overwhelmed', emoji: '😰' },
    { value: 'satisfied', label: 'Satisfied', emoji: '😊' },
    { value: 'curious', label: 'Curious', emoji: '🤓' },
  ]

  const milestoneTypeOptions = [
    { value: 'first_commit', label: 'First Commit' },
    { value: 'mvp_complete', label: 'MVP Complete' },
    { value: 'first_user', label: 'First User' },
    { value: 'feature_complete', label: 'Feature Complete' },
    { value: 'deployment', label: 'Deployment' },
    { value: 'first_revenue', label: 'First Revenue' },
    { value: 'open_source', label: 'Open Source' },
    { value: 'award_won', label: 'Award Won' },
    { value: 'team_expansion', label: 'Team Expansion' },
    { value: 'funding_raised', label: 'Funding Raised' },
    { value: 'acquisition', label: 'Acquisition' },
    { value: 'custom', label: 'Custom' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createJourneyEntry({
        ...formData,
        userId,
        forkUrl: forkUrl || undefined,
        branchName: branchName || undefined,
      })
      
      onSuccess()
    } catch (error: any) {
      console.error('Error creating journey entry:', error)
      
      toast({
        title: "Error",
        description: error?.message || "Failed to create journey entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skillsLearned.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skillsLearned: [...prev.skillsLearned, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skillsLearned: prev.skillsLearned.filter(s => s !== skill)
    }))
  }

  const addChallenge = () => {
    if (newChallenge.trim()) {
      setFormData(prev => ({
        ...prev,
        challenges: [...prev.challenges, newChallenge.trim()]
      }))
      setNewChallenge('')
    }
  }

  const removeChallenge = (challenge: string) => {
    setFormData(prev => ({
      ...prev,
      challenges: prev.challenges.filter(c => c !== challenge)
    }))
  }

  const addSolution = () => {
    if (newSolution.trim()) {
      setFormData(prev => ({
        ...prev,
        solutions: [...prev.solutions, newSolution.trim()]
      }))
      setNewSolution('')
    }
  }

  const removeSolution = (solution: string) => {
    setFormData(prev => ({
      ...prev,
      solutions: prev.solutions.filter(s => s !== solution)
    }))
  }

  const selectedEntryType = entryTypeOptions.find(option => option.value === formData.type)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Add Journey Entry</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Entry Type */}
            <div>
              <Label htmlFor="type">Entry Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: JourneyEntryType) => 
                  setFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {entryTypeOptions.map(option => {
                    const Icon = option.icon
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {selectedEntryType && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedEntryType.description}
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What did you work on today?"
                required
              />
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">Description</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Describe what you did, what you learned, challenges you faced, and how you solved them..."
                rows={6}
              />
            </div>

            {/* Code Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="forkUrl">Fork/PR URL (optional)</Label>
                <Input
                  id="forkUrl"
                  value={forkUrl}
                  onChange={(e) => setForkUrl(e.target.value)}
                  placeholder="https://github.com/yourname/repo/pull/123 or fork URL"
                />
              </div>
              <div>
                <Label htmlFor="branchName">Branch Name (optional)</Label>
                <Input
                  id="branchName"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="feature/add-collaboration"
                />
              </div>
            </div>

            {/* Mood and Energy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mood">Mood</Label>
                <Select
                  value={formData.mood || ''}
                  onValueChange={(value: JourneyMood) => 
                    setFormData(prev => ({ ...prev, mood: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How are you feeling?" />
                  </SelectTrigger>
                  <SelectContent>
                    {moodOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <span>{option.emoji}</span>
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="energy">Energy Level (1-10)</Label>
                <Input
                  id="energy"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.energy}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    energy: parseInt(e.target.value) || 5 
                  }))}
                />
              </div>
            </div>

            {/* Milestone Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isMilestone"
                  checked={formData.isMilestone}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isMilestone: checked }))
                  }
                />
                <Label htmlFor="isMilestone">This is a milestone</Label>
              </div>

              {formData.isMilestone && (
                <div>
                  <Label htmlFor="milestoneType">Milestone Type</Label>
                  <Select
                    value={formData.milestoneType || ''}
                    onValueChange={(value: MilestoneType) => 
                      setFormData(prev => ({ ...prev, milestoneType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select milestone type" />
                    </SelectTrigger>
                    <SelectContent>
                      {milestoneTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Skills Learned */}
            <div>
              <Label>Skills Learned</Label>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill you learned"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skillsLearned.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Challenges and Solutions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Challenges</Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={newChallenge}
                    onChange={(e) => setNewChallenge(e.target.value)}
                    placeholder="What challenges did you face?"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChallenge())}
                  />
                  <Button type="button" onClick={addChallenge} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {formData.challenges.map((challenge, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                      <span className="text-sm">{challenge}</span>
                      <button
                        type="button"
                        onClick={() => removeChallenge(challenge)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Solutions</Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={newSolution}
                    onChange={(e) => setNewSolution(e.target.value)}
                    placeholder="How did you solve them?"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSolution())}
                  />
                  <Button type="button" onClick={addSolution} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {formData.solutions.map((solution, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                      <span className="text-sm">{solution}</span>
                      <button
                        type="button"
                        onClick={() => removeSolution(solution)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tags to categorize this entry"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="flex items-center space-x-1">
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="timeSpent">Time Spent (minutes)</Label>
                <Input
                  id="timeSpent"
                  type="number"
                  value={formData.timeSpent || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    timeSpent: parseInt(e.target.value) || undefined 
                  }))}
                  placeholder="120"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Home, Office, Coffee shop..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isPublic: checked }))
                  }
                />
                <Label htmlFor="isPublic">Make this entry public</Label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Entry'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

