import { db } from "@/lib/firebase"
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  getDoc,
  onSnapshot,
  Timestamp,
  writeBatch,
  increment,
  setDoc
} from "firebase/firestore"
import { 
  JourneyEntry, 
  CreateJourneyEntryData, 
  UpdateJourneyEntryData,
  JourneyMilestone,
  JourneyStats,
  JourneyFilter,
  JourneySearchQuery,
  JourneyTemplate,
  JourneyInsight
} from "./journey-schema"
import { createNotification } from "@/lib/notifications-utils"

async function isUserCollaborator(projectId: string, userId: string): Promise<boolean> {
  try {
    const qy = query(collection(db, 'collaborations'), where('project_id', '==', projectId), where('user_id', '==', userId))
    const snap = await getDocs(qy)
    return !snap.empty
  } catch {
    return false
  }
}

async function getProject(projectId: string): Promise<any | null> {
  try {
    const snap = await getDoc(doc(db, 'projects', projectId))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  } catch {
    return null
  }
}

async function isRateLimited(projectId: string, userId: string): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const qy = query(
      collection(db, 'journey_entries'),
      where('projectId', '==', projectId),
      where('userId', '==', userId),
    )
    const snap = await getDocs(qy)
    const recent = snap.docs.filter(d => {
      const t = (d.data() as any).createdAt?.toDate?.() || new Date(0)
      return t >= oneHourAgo
    }).length
    return recent >= 10
  } catch {
    return false
  }
}

// Journey Entry Management
export async function createJourneyEntry(data: CreateJourneyEntryData): Promise<string> {
  try {
    const project = await getProject(data.projectId)
    if (!project) throw new Error('Project not found')

    const contributorId = (data as any).userId as string | undefined
    if (!contributorId) throw new Error('Missing userId')

    const ownerId = project.owner_id
    const isOwner = contributorId === ownerId
    const collaborator = await isUserCollaborator(data.projectId, contributorId)

    // Rate limit only in open mode for non-owners
    if (project.collaboration_type === 'open' && !isOwner) {
      if (await isRateLimited(data.projectId, contributorId)) {
        throw new Error('Rate limit: too many contributions, please wait')
      }
    }

    // Permission and moderation logic
    let status: 'pending' | 'approved' = 'approved'
    if (project.collaboration_type === 'solo') {
      if (!isOwner) throw new Error('Not allowed to contribute to solo project')
      status = 'approved'
    } else if (project.collaboration_type === 'authorized') {
      if (!(isOwner || collaborator)) throw new Error('Not authorized to contribute')
      status = 'approved'
    } else if (project.collaboration_type === 'open') {
      // All non-owner contributions go to moderation
      status = isOwner ? 'approved' : 'pending'
    } else {
      status = isOwner ? 'approved' : 'pending'
    }

    const journeyEntry = {
      ...data,
      userId: contributorId,
      status,
      approvedBy: status === 'approved' ? ownerId : null,
      approvedAt: status === 'approved' ? Timestamp.now() : null,
      timestamp: Timestamp.now(),
      reactionsCount: 0,
      commentsCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    const docRef = await addDoc(collection(db, "journey_entries"), journeyEntry)
    
    // Update journey stats only for approved entries
    if (status === 'approved') {
      await updateJourneyStats(data.projectId)
    }

    // Notify owner about new pending contribution
    if (status === 'pending') {
      try {
        const title = `New contribution pending review`
        const description = data.title
        await createNotification(ownerId, 'project_update', title, description, docRef.id, 'journey_entry', contributorId)
      } catch (e) {
        console.error('Pending contribution notification error:', e)
      }
    }

    // Mention notifications for @username in content (only when approved)
    if (status === 'approved') {
      try {
        const mentioned = extractMentionedUsernames(data.content)
        if (mentioned.length > 0) {
          const mentionedUserIds = await getUserIdsByUsernames(mentioned)
          const title = `You were mentioned in a journey entry`
          const description = data.title
          await Promise.all(
            mentionedUserIds
              .filter((uid) => uid && uid !== contributorId)
              .map((uid) =>
                createNotification(
                  uid as string,
                  "comment",
                  title,
                  description,
                  docRef.id,
                  "journey_entry",
                  contributorId
                )
              )
          )
        }
      } catch (e) {
        console.error("Mention notification error:", e)
      }
    }
    
    return docRef.id
  } catch (error) {
    console.error("Error creating journey entry:", error)
    throw error
  }
}

export async function updateJourneyEntry(data: UpdateJourneyEntryData): Promise<void> {
  try {
    const { id, ...updateData } = data
    await updateDoc(doc(db, "journey_entries", id), {
      ...updateData,
      updatedAt: Timestamp.now(),
    })
    
    // Update journey stats if projectId is provided
    if (updateData.projectId) {
      await updateJourneyStats(updateData.projectId)
    }
  } catch (error) {
    console.error("Error updating journey entry:", error)
    throw error
  }
}

export async function deleteJourneyEntry(entryId: string, projectId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "journey_entries", entryId))
    
    // Update journey stats
    await updateJourneyStats(projectId)
  } catch (error) {
    console.error("Error deleting journey entry:", error)
    throw error
  }
}

export async function getJourneyEntries(
  projectId: string, 
  filters?: JourneyFilter,
  limitCount?: number
): Promise<JourneyEntry[]> {
  try {
    let q = query(
      collection(db, "journey_entries"),
      where("projectId", "==", projectId),
      orderBy("timestamp", "desc")
    )

    if (filters) {
      if (filters.type) {
        q = query(q, where("type", "==", filters.type))
      }
      if (filters.isMilestone !== undefined) {
        q = query(q, where("isMilestone", "==", filters.isMilestone))
      }
      if (filters.isPublic !== undefined) {
        q = query(q, where("isPublic", "==", filters.isPublic))
      }
    }

    if (limitCount) {
      q = query(q, limit(limitCount))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => {
      const data = d.data() as any
      return {
        id: d.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || new Date(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        approvedAt: data.approvedAt?.toDate?.() || undefined,
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as JourneyEntry
    })
  } catch (error) {
    console.error("Error fetching journey entries:", error)
    throw error
  }
}

export function subscribeToJourneyEntries(
  projectId: string,
  callback: (entries: JourneyEntry[]) => void,
  filters?: JourneyFilter
) {
  let q = query(
    collection(db, "journey_entries"),
    where("projectId", "==", projectId),
    orderBy("timestamp", "desc")
  )

  if (filters) {
    if (filters.type) {
      q = query(q, where("type", "==", filters.type))
    }
    if (filters.isMilestone !== undefined) {
      q = query(q, where("isMilestone", "==", filters.isMilestone))
    }
    if (filters.isPublic !== undefined) {
      q = query(q, where("isPublic", "==", filters.isPublic))
    }
  }

  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map(d => {
      const data = d.data() as any
      return {
        id: d.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || new Date(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        approvedAt: data.approvedAt?.toDate?.() || undefined,
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as JourneyEntry
    })
    
    callback(entries)
  })
}

// Journey Milestones
export async function createJourneyMilestone(
  projectId: string,
  milestone: Omit<JourneyMilestone, 'id' | 'projectId' | 'createdAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "journey_milestones"), {
      ...milestone,
      projectId,
      createdAt: Timestamp.now(),
    })
    
    return docRef.id
  } catch (error) {
    console.error("Error creating journey milestone:", error)
    throw error
  }
}

export async function updateJourneyMilestone(
  milestoneId: string,
  updates: Partial<JourneyMilestone>
): Promise<void> {
  try {
    await updateDoc(doc(db, "journey_milestones", milestoneId), {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error("Error updating journey milestone:", error)
    throw error
  }
}

export async function getJourneyMilestones(projectId: string): Promise<JourneyMilestone[]> {
  try {
    const q = query(
      collection(db, "journey_milestones"),
      where("projectId", "==", projectId),
      orderBy("createdAt", "asc")
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as JourneyMilestone[]
  } catch (error) {
    console.error("Error fetching journey milestones:", error)
    throw error
  }
}

// Journey Stats
export async function getJourneyStats(projectId: string): Promise<JourneyStats | null> {
  try {
    const docRef = doc(db, "journey_stats", projectId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data() as any
      return {
        ...data,
        lastEntryDate: data.lastEntryDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as JourneyStats
    }
    
    return null
  } catch (error) {
    console.error("Error fetching journey stats:", error)
    throw error
  }
}

export async function updateJourneyStats(projectId: string): Promise<void> {
  try {
    const entries = await getJourneyEntries(projectId)
    
    // Calculate stats
    const totalEntries = entries.length
    const totalTimeSpent = entries.reduce((sum, entry) => sum + (entry.timeSpent || 0), 0)
    const milestonesCompleted = entries.filter(entry => entry.isMilestone).length
    const skillsLearned = [...new Set(entries.flatMap(entry => entry.skillsLearned))]
    const moodDistribution = entries.reduce((acc, entry) => {
      if (entry.mood) {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    const entryTypeDistribution = entries.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const averageEnergy = entries.reduce((sum, entry) => sum + (entry.energy || 5), 0) / totalEntries || 5
    
    // Calculate streaks
    const sortedEntries = entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i]
      const prevEntry = i > 0 ? sortedEntries[i - 1] : null
      
      if (prevEntry) {
        const daysDiff = Math.floor(
          (entry.timestamp.getTime() - prevEntry.timestamp.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        if (daysDiff === 1) {
          tempStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 0
        }
      } else {
        tempStreak = 1
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak)
    currentStreak = tempStreak
    
    const stats: JourneyStats = {
      projectId,
      totalEntries,
      totalTimeSpent,
      milestonesCompleted,
      totalMilestones: 0, // Will be updated when milestones are fetched
      skillsLearned,
      moodDistribution,
      entryTypeDistribution,
      averageEnergy,
      longestStreak,
      currentStreak,
      lastEntryDate: entries.length > 0 ? entries[0].timestamp : new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    // Convert Date to Timestamp for Firestore
    const toWrite: any = {
      ...stats,
      lastEntryDate: Timestamp.fromDate(stats.lastEntryDate),
      createdAt: Timestamp.fromDate(stats.createdAt),
      updatedAt: Timestamp.fromDate(stats.updatedAt),
    }
    await setDoc(doc(db, "journey_stats", projectId), toWrite, { merge: true })
  } catch (error) {
    console.error("Error updating journey stats:", error)
    throw error
  }
}

// Journey Subscriptions
export async function subscribeToJourney(projectId: string, userId: string): Promise<void> {
  try {
    const ref = doc(collection(db, "journey_subscriptions"), `${projectId}_${userId}`)
    await setDoc(ref, {
      projectId,
      userId,
      createdAt: Timestamp.now(),
    })
  } catch (e) {
    console.error("Error subscribing to journey:", e)
    throw e
  }
}

export async function unsubscribeFromJourney(projectId: string, userId: string): Promise<void> {
  try {
    const ref = doc(collection(db, "journey_subscriptions"), `${projectId}_${userId}`)
    await deleteDoc(ref)
  } catch (e) {
    console.error("Error unsubscribing from journey:", e)
    throw e
  }
}

export async function isSubscribedToJourney(projectId: string, userId: string): Promise<boolean> {
  try {
    const ref = doc(collection(db, "journey_subscriptions"), `${projectId}_${userId}`)
    const snap = await getDoc(ref)
    return snap.exists()
  } catch (e) {
    console.error("Error checking journey subscription:", e)
    return false
  }
}

export async function getJourneySubscribers(projectId: string): Promise<string[]> {
  try {
    const qy = query(collection(db, "journey_subscriptions"), where("projectId", "==", projectId))
    const snap = await getDocs(qy)
    return snap.docs.map((d) => (d.data() as any).userId as string)
  } catch (e) {
    console.error("Error getting journey subscribers:", e)
    return []
  }
}

// Utilities: mentions
function extractMentionedUsernames(text: string): string[] {
  const re = /@([A-Za-z0-9_]+)/g
  const set = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    set.add(m[1])
  }
  return Array.from(set)
}

async function getUserIdsByUsernames(usernames: string[]): Promise<(string | null)[]> {
  const results: (string | null)[] = []
  for (const uname of usernames) {
    try {
      const qy = query(collection(db, "users"), where("username", "==", uname))
      const snap = await getDocs(qy)
      if (!snap.empty) {
        results.push(snap.docs[0].id)
      } else {
        results.push(null)
      }
    } catch (e) {
      results.push(null)
    }
  }
  return results
}

export interface BasicUser {
  id: string
  username: string
  displayName?: string
  photoURL?: string
}

export async function searchUsersByUsernamePrefix(prefix: string, max: number = 8): Promise<BasicUser[]> {
  try {
    if (!prefix) return []
    
    // For substring matching, we need to fetch users and filter client-side
    // Firestore prefix queries only work for exact prefixes
    // We limit the initial fetch to 500 users for performance
    const usersRef = collection(db, "users")
    const usersQuery = query(usersRef, limit(500))
    const snapshot = await getDocs(usersQuery)
    
    const searchLower = prefix.toLowerCase().trim()
    const matchedUsers = snapshot.docs
      .map((doc) => {
        const data = doc.data() as any
        return {
          id: doc.id,
          username: data.username || "",
          displayName: data.displayName || "",
          photoURL: data.photoURL || data.avatar_url || "",
        } as BasicUser
      })
      .filter((user) => {
        // Case-insensitive substring matching in username and displayName
        const username = (user.username || "").toLowerCase()
        const displayName = (user.displayName || "").toLowerCase()
        
        return username.includes(searchLower) || displayName.includes(searchLower)
      })
      .slice(0, max)
    
    return matchedUsers
  } catch (e) {
    console.error("searchUsersByUsernamePrefix error:", e)
    return []
  }
}

// Journey Templates
export async function getJourneyTemplates(category?: string): Promise<JourneyTemplate[]> {
  try {
    let q = query(
      collection(db, "journey_templates"),
      where("isPublic", "==", true),
      orderBy("usageCount", "desc")
    )

    if (category) {
      q = query(q, where("category", "==", category))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as JourneyTemplate[]
  } catch (error) {
    console.error("Error fetching journey templates:", error)
    throw error
  }
}

export async function createJourneyTemplate(template: Omit<JourneyTemplate, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "journey_templates"), {
      ...template,
      createdAt: Timestamp.now(),
    })
    
    return docRef.id
  } catch (error) {
    console.error("Error creating journey template:", error)
    throw error
  }
}

// Journey Reactions
export async function addJourneyReaction(
  entryId: string,
  userId: string,
  reactionType: 'like' | 'love' | 'wow' | 'inspiring' | 'helpful' | 'celebrate'
): Promise<void> {
  try {
    const entryRef = doc(db, "journey_entries", entryId)
    const reaction = {
      userId,
      type: reactionType,
      timestamp: Timestamp.now(),
    }
    
    await updateDoc(entryRef, {
      reactions: increment(1),
    })
    
    // Add reaction to subcollection
    await addDoc(collection(db, "journey_entries", entryId, "reactions"), reaction)
  } catch (error) {
    console.error("Error adding journey reaction:", error)
    throw error
  }
}

// Journey Comments
export async function addJourneyComment(
  entryId: string,
  userId: string,
  content: string
): Promise<string> {
  try {
    const comment = {
      userId,
      content,
      timestamp: Timestamp.now(),
      replies: [],
    }
    
    const docRef = await addDoc(collection(db, "journey_entries", entryId, "comments"), comment)
    
    // Update comment count
    await updateDoc(doc(db, "journey_entries", entryId), {
      comments: increment(1),
    })
    
    return docRef.id
  } catch (error) {
    console.error("Error adding journey comment:", error)
    throw error
  }
}

// Journey Search
export async function searchJourneyEntries(searchQuery: JourneySearchQuery): Promise<JourneyEntry[]> {
  try {
    // This is a simplified search - in production, you'd use Algolia or similar
    let q = query(
      collection(db, "journey_entries"),
      orderBy(searchQuery.sortBy, searchQuery.sortOrder)
    )

    if (searchQuery.filters.projectId) {
      q = query(q, where("projectId", "==", searchQuery.filters.projectId))
    }
    if (searchQuery.filters.userId) {
      q = query(q, where("userId", "==", searchQuery.filters.userId))
    }
    if (searchQuery.filters.type) {
      q = query(q, where("type", "==", searchQuery.filters.type))
    }
    if (searchQuery.filters.isPublic !== undefined) {
      q = query(q, where("isPublic", "==", searchQuery.filters.isPublic))
    }

    if (searchQuery.limit) {
      q = query(q, limit(searchQuery.limit))
    }

    const snapshot = await getDocs(q)
    let entries = snapshot.docs.map(d => {
      const data = d.data() as any
      return {
        id: d.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || new Date(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as JourneyEntry
    })

    // Client-side filtering for text search and other complex filters
    if (searchQuery.query) {
      const searchTerm = searchQuery.query.toLowerCase()
      entries = entries.filter(entry => 
        entry.title.toLowerCase().includes(searchTerm) ||
        entry.content.toLowerCase().includes(searchTerm) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    }

    if (searchQuery.filters.tags && searchQuery.filters.tags.length > 0) {
      entries = entries.filter(entry => 
        searchQuery.filters.tags!.some(tag => entry.tags.includes(tag))
      )
    }

    if (searchQuery.filters.skillsLearned && searchQuery.filters.skillsLearned.length > 0) {
      entries = entries.filter(entry => 
        searchQuery.filters.skillsLearned!.some(skill => entry.skillsLearned.includes(skill))
      )
    }

    return entries
  } catch (error) {
    console.error("Error searching journey entries:", error)
    throw error
  }
}

export async function approveJourneyEntry(entryId: string, approverId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'journey_entries', entryId), {
      status: 'approved',
      approvedBy: approverId,
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    // Load entry to update stats and notify author
    const snap = await getDoc(doc(db, 'journey_entries', entryId))
    const entry = snap.data() as any
    if (entry?.projectId) await updateJourneyStats(entry.projectId)
    if (entry?.userId) {
      await createNotification(entry.userId, 'project_update', 'Your contribution was approved', entry.title || '', entryId, 'journey_entry', approverId)
    }
  } catch (e) {
    console.error('approveJourneyEntry error:', e)
    throw e
  }
}

export async function rejectJourneyEntry(entryId: string, approverId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'journey_entries', entryId), {
      status: 'rejected',
      approvedBy: approverId,
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    const snap = await getDoc(doc(db, 'journey_entries', entryId))
    const entry = snap.data() as any
    if (entry?.userId) {
      await createNotification(entry.userId, 'project_update', 'Your contribution was rejected', entry.title || '', entryId, 'journey_entry', approverId)
    }
  } catch (e) {
    console.error('rejectJourneyEntry error:', e)
    throw e
  }
}

