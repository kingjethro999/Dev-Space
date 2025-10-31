// Project Journey Data Schema and Types

export interface JourneyEntry {
  id: string
  projectId: string
  userId: string
  type: JourneyEntryType
  title: string
  content: string
  timestamp: Date
  mood?: JourneyMood
  energy?: number // 1-10 scale
  tags: string[]
  attachments: JourneyAttachment[]
  isPublic: boolean
  isMilestone: boolean
  milestoneType?: MilestoneType
  skillsLearned: string[]
  challenges: string[]
  solutions: string[]
  timeSpent?: number // in minutes
  location?: string
  collaborators?: string[] // user IDs
  reactions: JourneyReaction[]
  comments: JourneyComment[]
  // Moderation & Attribution
  status?: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: Date
  // Code links (forks/branches)
  forkUrl?: string
  branchName?: string
  sourceRepoUrl?: string
  createdAt: Date
  updatedAt: Date
}

export type JourneyEntryType = 
  | 'ideation'           // Brainstorming, planning, research
  | 'learning'           // Tutorials, courses, documentation
  | 'development'        // Coding, building features
  | 'debugging'          // Fixing bugs, troubleshooting
  | 'testing'            // Writing tests, QA
  | 'deployment'         // Going live, CI/CD
  | 'collaboration'      // Team work, code reviews
  | 'reflection'         // Personal insights, lessons
  | 'milestone'          // Major achievements
  | 'challenge'          // Problems faced
  | 'breakthrough'       // Major solutions or discoveries
  | 'maintenance'        // Updates, bug fixes post-launch
  | 'scaling'            // Performance improvements, growth
  | 'community'          // User feedback, community interaction

export type JourneyMood = 
  | 'excited' | 'focused' | 'frustrated' | 'accomplished' 
  | 'stuck' | 'inspired' | 'tired' | 'proud' | 'confused' 
  | 'motivated' | 'overwhelmed' | 'satisfied' | 'curious'

export type MilestoneType = 
  | 'first_commit' | 'mvp_complete' | 'first_user' | 'feature_complete'
  | 'deployment' | 'first_revenue' | 'open_source' | 'award_won'
  | 'team_expansion' | 'funding_raised' | 'acquisition' | 'custom'

export interface JourneyAttachment {
  id: string
  type: 'image' | 'video' | 'code' | 'link' | 'file'
  url: string
  title?: string
  description?: string
  metadata?: Record<string, any>
}

export interface JourneyReaction {
  userId: string
  type: 'like' | 'love' | 'wow' | 'inspiring' | 'helpful' | 'celebrate'
  timestamp: Date
}

export interface JourneyComment {
  id: string
  userId: string
  content: string
  timestamp: Date
  replies: JourneyComment[]
}

export interface JourneyMilestone {
  id: string
  projectId: string
  title: string
  description: string
  type: MilestoneType
  targetDate?: Date
  completedDate?: Date
  isCompleted: boolean
  progress: number // 0-100
  criteria: string[]
  rewards?: string[]
  createdAt: Date
}

export interface JourneyTemplate {
  id: string
  name: string
  description: string
  category: ProjectCategory
  phases: JourneyPhase[]
  estimatedDuration: number // in days
  isPublic: boolean
  createdBy: string
  usageCount: number
  rating: number
  createdAt: Date
}

export interface JourneyPhase {
  id: string
  name: string
  description: string
  order: number
  estimatedDays: number
  entryTypes: JourneyEntryType[]
  milestones: string[] // milestone IDs
  tips: string[]
  resources: JourneyResource[]
}

export interface JourneyResource {
  title: string
  url: string
  type: 'tutorial' | 'documentation' | 'tool' | 'course' | 'book' | 'article'
  description: string
}

export type ProjectCategory = 
  | 'web_app' | 'mobile_app' | 'desktop_app' | 'api' | 'library' 
  | 'game' | 'ai_ml' | 'blockchain' | 'iot' | 'data_science'
  | 'open_source' | 'startup' | 'hackathon' | 'learning' | 'other'

export interface JourneyStats {
  projectId: string
  totalEntries: number
  totalTimeSpent: number // in minutes
  milestonesCompleted: number
  totalMilestones: number
  skillsLearned: string[]
  moodDistribution: Record<JourneyMood, number>
  entryTypeDistribution: Record<JourneyEntryType, number>
  averageEnergy: number
  longestStreak: number // days
  currentStreak: number // days
  lastEntryDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface JourneyInsight {
  id: string
  projectId: string
  type: 'productivity' | 'learning' | 'challenges' | 'breakthroughs' | 'collaboration'
  title: string
  description: string
  data: Record<string, any>
  generatedAt: Date
}

// Journey creation and management functions
export interface CreateJourneyEntryData {
  projectId: string
  type: JourneyEntryType
  title: string
  content: string
  mood?: JourneyMood
  energy?: number
  tags: string[]
  attachments: Omit<JourneyAttachment, 'id'>[]
  isPublic: boolean
  isMilestone: boolean
  milestoneType?: MilestoneType
  skillsLearned: string[]
  challenges: string[]
  solutions: string[]
  timeSpent?: number
  location?: string
  collaborators?: string[]
  // New optional fields
  userId?: string
  forkUrl?: string
  branchName?: string
  sourceRepoUrl?: string
}

export interface UpdateJourneyEntryData extends Partial<CreateJourneyEntryData> {
  id: string
}

export interface JourneyFilter {
  projectId?: string
  userId?: string
  type?: JourneyEntryType
  mood?: JourneyMood
  isMilestone?: boolean
  isPublic?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  tags?: string[]
  skillsLearned?: string[]
}

export interface JourneySearchQuery {
  query: string
  filters: JourneyFilter
  sortBy: 'timestamp' | 'energy' | 'reactions' | 'comments'
  sortOrder: 'asc' | 'desc'
  limit?: number
  offset?: number
}

