import { db } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  getCountFromServer,
  orderBy,
  limit as fbLimit,
  getDocs,
  Timestamp,
} from "firebase/firestore"

export type Badge = {
  id: string
  name: string
  category: "builder" | "social" | "journey" | "streak" | "collab" | "influence" | "achievement"
}

export type Accomplishments = {
  projectCount: number
  interactionCount: number
  journeyEntryCount: number
  followerCount: number
  approvedCollaborationCount: number
  currentStreakDays: number
  longestStreakDays: number
  badges: Badge[]
}

export type BadgePathProgress = {
  category:
    | "builder"
    | "social"
    | "journey"
    | "streak"
    | "collab"
    | "influence"
  title: string
  value: number
  target: number
  isMax: boolean
  percent: number
  currentBadgeName: string
  nextBadgeName?: string
  thresholds: Array<{ id: string; name: string; value: number }>
}

async function getProjectCount(userId: string): Promise<number> {
  const q = query(collection(db, "projects"), where("owner_id", "==", userId))
  const snap = await getCountFromServer(q)
  return snap.data().count
}

async function getJourneyEntryCount(userId: string): Promise<number> {
  const q = query(collection(db, "journey_entries"), where("userId", "==", userId))
  const snap = await getCountFromServer(q)
  return snap.data().count
}

async function getFollowerCount(userId: string): Promise<number> {
  const q = query(collection(db, "connections"), where("following_id", "==", userId))
  const snap = await getCountFromServer(q)
  return snap.data().count
}

async function getApprovedCollaborationCount(userId: string): Promise<number> {
  // Count collaborations where this user is a collaborator (not owner)
  // If status field is used, filter on approved; otherwise count all matches
  const q = query(collection(db, "collaborations"), where("user_id", "==", userId))
  const snap = await getCountFromServer(q)
  return snap.data().count
}

// We approximate "interactions" using the activities log
// Includes: follows, comments, reviews, requests, collaborator adds, discussion creates
async function getInteractionCount(userId: string): Promise<number> {
  const actionTypes = [
    "followed_user",
    "commented_on_discussion",
    "commented_on_task",
    "reviewed_code",
    "requested_code_review",
    "added_collaborator",
    "created_discussion",
  ]

  const counts = await Promise.all(
    actionTypes.map(async (type) => {
      const q = query(
        collection(db, "activities"),
        where("user_id", "==", userId),
        where("action_type", "==", type),
      )
      const snap = await getCountFromServer(q)
      return snap.data().count
    }),
  )

  return counts.reduce((sum, c) => sum + c, 0)
}

async function getJourneyStreaks(userId: string): Promise<{ current: number; longest: number }> {
  // Fetch recent journey entries for this user to compute daily streaks
  // Limit to last ~1000 entries for performance
  const q = query(
    collection(db, "journey_entries"),
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
    fbLimit(1000),
  )
  const snap = await getDocs(q)
  if (snap.empty) return { current: 0, longest: 0 }

  const dates = new Set<string>()
  snap.docs.forEach((d) => {
    const ts: any = (d.data() as any).timestamp
    const date = (ts?.toDate?.() as Date) || new Date()
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`
    dates.add(key)
  })

  const today = new Date()
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))

  // Compute current and longest streaks by walking back day by day
  let current = 0
  let longest = 0
  let rolling = 0

  // Build a sorted array of date keys for faster checks
  const hasDate = (d: Date) => {
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`
    return dates.has(key)
  }

  // Compute current streak
  let cursor = new Date(start)
  while (hasDate(cursor)) {
    current += 1
    cursor = new Date(cursor.getTime() - 24 * 3600 * 1000)
  }

  // Compute longest streak by scanning backward up to 365 days
  // We iterate through the set to approximate longest consecutive run
  // For simplicity, check the last 365 days from today
  rolling = 0
  const daysToCheck = 365
  let c = new Date(start)
  for (let i = 0; i < daysToCheck; i++) {
    if (hasDate(c)) {
      rolling += 1
      if (rolling > longest) longest = rolling
    } else {
      rolling = 0
    }
    c = new Date(c.getTime() - 24 * 3600 * 1000)
  }

  return { current, longest }
}

function computeBadges(
  projects: number,
  interactions: number,
  journeys: number,
  followers: number,
  approvedCollabs: number,
  currentStreak: number,
  longestStreak: number,
): Badge[] {
  const badges: Badge[] = []

  // Builder path
  if (projects >= 1) badges.push({ id: "first_builder", name: "First Builder", category: "builder" })
  if (projects >= 5) badges.push({ id: "project_rookie", name: "Project Rookie", category: "builder" })
  if (projects >= 30) badges.push({ id: "project_pro", name: "Project Pro", category: "builder" })
  if (projects >= 100) badges.push({ id: "code_architect", name: "Code Architect", category: "builder" })

  // Social path
  if (interactions >= 10) badges.push({ id: "sociable_dev", name: "Sociable Dev", category: "social" })
  if (interactions >= 100) badges.push({ id: "social_freak", name: "Social Freak 😜", category: "social" })
  if (interactions >= 300) badges.push({ id: "networking_master", name: "Networking Master", category: "social" })
  if (interactions >= 1000) badges.push({ id: "community_icon", name: "Community Icon", category: "social" })

  // Journey path
  if (journeys >= 1) badges.push({ id: "first_log", name: "First Log", category: "journey" })
  if (journeys >= 10) badges.push({ id: "journey_starter", name: "Journey Starter", category: "journey" })
  if (journeys >= 50) badges.push({ id: "storyteller", name: "Storyteller", category: "journey" })
  if (journeys >= 100) badges.push({ id: "journey_master", name: "Journey Master", category: "journey" })

  // Streaks (fire icon in UI)
  if (currentStreak >= 3) badges.push({ id: "streak_3", name: "🔥 3-Day Streak", category: "streak" })
  if (currentStreak >= 7) badges.push({ id: "streak_7", name: "🔥 Active Dev (7d)", category: "streak" })
  if (currentStreak >= 30) badges.push({ id: "streak_30", name: "🔥 Consistency Beast (30d)", category: "streak" })
  if (currentStreak >= 100) badges.push({ id: "streak_100", name: "🔥 Relentless Builder (100d)", category: "streak" })

  // Collaborations
  if (approvedCollabs >= 1) badges.push({ id: "team_spirit", name: "Team Spirit", category: "collab" })
  if (approvedCollabs >= 10) badges.push({ id: "collab_guru", name: "Collab Guru", category: "collab" })
  if (approvedCollabs >= 30) badges.push({ id: "open_source_ally", name: "Open-Source Ally", category: "collab" })

  // Influence (followers)
  if (followers >= 10) badges.push({ id: "rising_star", name: "Rising Star", category: "influence" })
  if (followers >= 50) badges.push({ id: "popular_dev", name: "Popular Dev", category: "influence" })
  if (followers >= 200) badges.push({ id: "community_legend", name: "Community Legend", category: "influence" })

  // Achievements (firsts)
  if (projects >= 1) badges.push({ id: "first_project", name: "First Project", category: "achievement" })
  if (journeys >= 1) badges.push({ id: "first_journey", name: "First Journey", category: "achievement" })
  if (interactions >= 1) badges.push({ id: "first_interaction", name: "First Interaction", category: "achievement" })

  return badges
}

export async function getUserAccomplishments(userId: string): Promise<Accomplishments> {
  const [projectCount, journeyEntryCount, interactionCount, followerCount, approvedCollaborationCount, streaks] =
    await Promise.all([
      getProjectCount(userId),
      getJourneyEntryCount(userId),
      getInteractionCount(userId),
      getFollowerCount(userId),
      getApprovedCollaborationCount(userId),
      getJourneyStreaks(userId),
    ])

  const badges = computeBadges(
    projectCount,
    interactionCount,
    journeyEntryCount,
    followerCount,
    approvedCollaborationCount,
    streaks.current,
    streaks.longest,
  )

  return {
    projectCount,
    interactionCount,
    journeyEntryCount,
    followerCount,
    approvedCollaborationCount,
    currentStreakDays: streaks.current,
    longestStreakDays: streaks.longest,
    badges,
  }
}

function computeProgress(
  value: number,
  thresholds: Array<{ id: string; name: string; value: number }>,
): {
  target: number
  isMax: boolean
  percent: number
  currentBadgeName: string
  nextBadgeName?: string
} {
  // Find highest threshold <= value
  let currentIdx = -1
  for (let i = 0; i < thresholds.length; i++) {
    if (value >= thresholds[i].value) currentIdx = i
  }
  const nextIdx = currentIdx + 1
  const isMax = nextIdx >= thresholds.length
  const currentBadgeName = currentIdx >= 0 ? thresholds[currentIdx].name : ""
  const nextBadgeName = isMax ? undefined : thresholds[nextIdx].name
  const base = currentIdx >= 0 ? thresholds[currentIdx].value : 0
  const target = isMax ? value : thresholds[nextIdx].value
  const progressRange = Math.max(1, target - base)
  const progressValue = Math.min(value - base, progressRange)
  const percent = Math.max(0, Math.min(100, Math.round((progressValue / progressRange) * 100)))
  return { target, isMax, percent, currentBadgeName, nextBadgeName }
}

export async function getUserBadgeProgress(userId: string): Promise<BadgePathProgress[]> {
  const acc = await getUserAccomplishments(userId)

  const builderThresholds = [
    { id: "first_builder", name: "First Builder", value: 1 },
    { id: "project_rookie", name: "Project Rookie", value: 5 },
    { id: "project_pro", name: "Project Pro", value: 30 },
    { id: "code_architect", name: "Code Architect", value: 100 },
  ]
  const socialThresholds = [
    { id: "sociable_dev", name: "Sociable Dev", value: 10 },
    { id: "social_freak", name: "Social Freak 😜", value: 100 },
    { id: "networking_master", name: "Networking Master", value: 300 },
    { id: "community_icon", name: "Community Icon", value: 1000 },
  ]
  const journeyThresholds = [
    { id: "first_log", name: "First Log", value: 1 },
    { id: "journey_starter", name: "Journey Starter", value: 10 },
    { id: "storyteller", name: "Storyteller", value: 50 },
    { id: "journey_master", name: "Journey Master", value: 100 },
  ]
  const streakThresholds = [
    { id: "streak_3", name: "3-Day Streak", value: 3 },
    { id: "streak_7", name: "Active Dev (7d)", value: 7 },
    { id: "streak_30", name: "Consistency Beast (30d)", value: 30 },
    { id: "streak_100", name: "Relentless Builder (100d)", value: 100 },
  ]
  const collabThresholds = [
    { id: "team_spirit", name: "Team Spirit", value: 1 },
    { id: "collab_guru", name: "Collab Guru", value: 10 },
    { id: "open_source_ally", name: "Open-Source Ally", value: 30 },
  ]
  const influenceThresholds = [
    { id: "rising_star", name: "Rising Star", value: 10 },
    { id: "popular_dev", name: "Popular Dev", value: 50 },
    { id: "community_legend", name: "Community Legend", value: 200 },
  ]

  const builder = computeProgress(acc.projectCount, builderThresholds)
  const social = computeProgress(acc.interactionCount, socialThresholds)
  const journey = computeProgress(acc.journeyEntryCount, journeyThresholds)
  const streak = computeProgress(acc.currentStreakDays, streakThresholds)
  const collab = computeProgress(acc.approvedCollaborationCount, collabThresholds)
  const influence = computeProgress(acc.followerCount, influenceThresholds)

  const summaries: BadgePathProgress[] = [
    {
      category: "builder",
      title: "Builder",
      value: acc.projectCount,
      target: builder.target,
      isMax: builder.isMax,
      percent: builder.percent,
      currentBadgeName: builder.currentBadgeName,
      nextBadgeName: builder.nextBadgeName,
      thresholds: builderThresholds,
    },
    {
      category: "social",
      title: "Social",
      value: acc.interactionCount,
      target: social.target,
      isMax: social.isMax,
      percent: social.percent,
      currentBadgeName: social.currentBadgeName,
      nextBadgeName: social.nextBadgeName,
      thresholds: socialThresholds,
    },
    {
      category: "journey",
      title: "Journey",
      value: acc.journeyEntryCount,
      target: journey.target,
      isMax: journey.isMax,
      percent: journey.percent,
      currentBadgeName: journey.currentBadgeName,
      nextBadgeName: journey.nextBadgeName,
      thresholds: journeyThresholds,
    },
    {
      category: "streak",
      title: "Streak",
      value: acc.currentStreakDays,
      target: streak.target,
      isMax: streak.isMax,
      percent: streak.percent,
      currentBadgeName: streak.currentBadgeName,
      nextBadgeName: streak.nextBadgeName,
      thresholds: streakThresholds,
    },
    {
      category: "collab",
      title: "Collaboration",
      value: acc.approvedCollaborationCount,
      target: collab.target,
      isMax: collab.isMax,
      percent: collab.percent,
      currentBadgeName: collab.currentBadgeName,
      nextBadgeName: collab.nextBadgeName,
      thresholds: collabThresholds,
    },
    {
      category: "influence",
      title: "Influence",
      value: acc.followerCount,
      target: influence.target,
      isMax: influence.isMax,
      percent: influence.percent,
      currentBadgeName: influence.currentBadgeName,
      nextBadgeName: influence.nextBadgeName,
      thresholds: influenceThresholds,
    },
  ]

  return summaries
}


