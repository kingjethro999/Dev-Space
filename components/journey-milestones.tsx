"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  Target, 
  Calendar, 
  Plus,
  CheckCircle,
  Clock,
  Star
} from "lucide-react"
import { JourneyMilestone, MilestoneType } from "@/lib/journey-schema"
import { getJourneyMilestones, createJourneyMilestone } from "@/lib/journey-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface JourneyMilestonesProps {
  projectId: string
  userId: string
  isOwner: boolean
}

export function JourneyMilestones({ projectId, userId, isOwner }: JourneyMilestonesProps) {
  const [milestones, setMilestones] = useState<JourneyMilestone[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<{ title: string; description: string; type: MilestoneType; targetDate?: string }>({
    title: "",
    description: "",
    type: "mvp_complete",
  })

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const data = await getJourneyMilestones(projectId)
        setMilestones(data)
      } catch (error) {
        console.error('Error fetching milestones:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMilestones()
  }, [projectId])

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setCreating(true)
    try {
      const id = await createJourneyMilestone(projectId, {
        title: form.title,
        description: form.description,
        type: form.type,
        targetDate: form.targetDate ? new Date(form.targetDate) : undefined,
        completedDate: undefined,
        isCompleted: false,
        progress: 0,
        criteria: [],
        rewards: [],
      } as any)
      // refresh list
      const data = await getJourneyMilestones(projectId)
      setMilestones(data)
      setOpen(false)
      setForm({ title: "", description: "", type: "mvp_complete" })
    } catch (e) {
      console.error(e)
    } finally {
      setCreating(false)
    }
  }

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'first_commit': return Target
      case 'mvp_complete': return CheckCircle
      case 'first_user': return Star
      case 'deployment': return Trophy
      default: return Trophy
    }
  }

  const getMilestoneColor = (isCompleted: boolean) => {
    return isCompleted ? 'text-green-600' : 'text-muted-foreground'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading milestones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Project Milestones</h2>
          <p className="text-muted-foreground">
            Track your major achievements and project goals
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Milestone
          </Button>
        )}
      </div>

      {/* Milestones Grid */}
      {milestones.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No milestones yet</h3>
            <p className="text-muted-foreground mb-4">
              Create milestones to track your project's major achievements and goals.
            </p>
            {isOwner && (
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Milestone
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {milestones.map((milestone, index) => {
            const Icon = getMilestoneIcon(milestone.type)
            const isOverdue = milestone.targetDate && 
              new Date(milestone.targetDate) < new Date() && 
              !milestone.isCompleted

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`transition-all duration-200 hover:shadow-md ${
                  milestone.isCompleted ? 'ring-2 ring-green-200 dark:ring-green-800' : ''
                } ${isOverdue ? 'ring-2 ring-red-200 dark:ring-red-800' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          milestone.isCompleted 
                            ? 'bg-green-100 dark:bg-green-900' 
                            : 'bg-primary/10'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            milestone.isCompleted 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-primary'
                          }`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{milestone.title}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {milestone.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      {milestone.isCompleted && (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {milestone.description}
                    </p>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {milestone.progress}%
                        </span>
                      </div>
                      <Progress value={milestone.progress} className="h-2" />
                    </div>

                    {/* Criteria */}
                    {milestone.criteria.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Criteria</h4>
                        <ul className="space-y-1">
                          {milestone.criteria.map((criterion, index) => (
                            <li key={index} className="flex items-center space-x-2 text-sm">
                              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                              <span className="text-muted-foreground">{criterion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      {milestone.targetDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Due: {new Date(milestone.targetDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {milestone.completedDate && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>
                            Completed: {new Date(milestone.completedDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Rewards */}
                    {milestone.rewards && milestone.rewards.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Rewards</h4>
                        <div className="flex flex-wrap gap-1">
                          {milestone.rewards.map((reward, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {reward}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {isOwner && !milestone.isCompleted && (
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1">
                          Update Progress
                        </Button>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Create Milestone Modal
function CreateMilestoneModal({
  open,
  onOpenChange,
  onCreate,
  creating,
  form,
  setForm,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onCreate: () => Promise<void>
  creating: boolean
  form: { title: string; description: string; type: MilestoneType; targetDate?: string }
  setForm: (f: { title: string; description: string; type: MilestoneType; targetDate?: string }) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Milestone</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v: MilestoneType) => setForm({ ...form, type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "first_commit","mvp_complete","first_user","feature_complete","deployment","first_revenue","open_source","award_won","team_expansion","funding_raised","acquisition","custom",
                ].map((t) => (
                  <SelectItem key={t} value={t}>{t.replace("_"," ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Target Date (optional)</Label>
            <Input type="date" value={form.targetDate || ""} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onCreate} disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

