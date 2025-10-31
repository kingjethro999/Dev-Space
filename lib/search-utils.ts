import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit, type Query } from "firebase/firestore"

export interface SearchResult {
  id: string
  type: "project" | "discussion" | "user"
  title: string
  description: string
  metadata: any
  relevance: number
}

export async function searchProjects(
  searchTerm: string,
  filters?: {
    language?: string
    sortBy?: "recent" | "trending"
    limit?: number
  },
) {
  try {
    const searchLower = searchTerm.toLowerCase()
    const projectsRef = collection(db, "projects")

    let q: Query

    if (filters?.sortBy === "trending") {
      q = query(projectsRef, where("visibility", "==", "public"), firestoreLimit(filters?.limit || 20))
    } else {
      q = query(
        projectsRef,
        where("visibility", "==", "public"),
        orderBy("created_at", "desc"),
        firestoreLimit(filters?.limit || 20),
      )
    }

    const snapshot = await getDocs(q)
    const results: SearchResult[] = []

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const titleMatch = data.title.toLowerCase().includes(searchLower)
      const descMatch = data.description.toLowerCase().includes(searchLower)
      
      // Enhanced tech stack matching - handle variations like "node" matching "Node.js"
      // Also handle parsed terms for better matching
      const parsedTerms = searchTerm
        .toLowerCase()
        .replace(/projects?\s+with\s+/gi, '')
        .replace(/using\s+/gi, '')
        .replace(/\s+technolog(y|ies)/gi, '')
        .trim()
        .split(/\s+/)
        .filter(term => term.length > 0)
      
      const techMatch = parsedTerms.some(term => {
        return data.tech_stack?.some((tech: string) => {
          const techLower = tech.toLowerCase()
          return techLower.includes(term) || term.includes(techLower) ||
                 techLower.replace(/[._-\s]/g, '').includes(term.replace(/[._-\s]/g, '')) ||
                 term.includes(techLower.replace(/\.js$|\.ts$|\.jsx$|\.tsx$/g, '')) ||
                 techLower.replace(/\.js$|\.ts$|\.jsx$|\.tsx$/g, '') === term
        })
      }) || data.tech_stack?.some((tech: string) => {
        const techLower = tech.toLowerCase()
        return techLower.includes(searchLower) || searchLower.includes(techLower) ||
               techLower.replace(/[._-]/g, '').includes(searchLower.replace(/[._-]/g, '')) ||
               searchLower.includes(techLower.replace(/\.js$|\.ts$|\.jsx$|\.tsx$/g, ''))
      })

      if (titleMatch || descMatch || techMatch) {
        let relevance = 0
        if (titleMatch) relevance += 3
        if (descMatch) relevance += 2
        if (techMatch) relevance += 1

        results.push({
          id: doc.id,
          type: "project",
          title: data.title,
          description: data.description,
          metadata: {
            tech_stack: data.tech_stack,
            owner_id: data.owner_id,
            github_url: data.github_url,
          },
          relevance,
        })
      }
    })

    return results.sort((a, b) => b.relevance - a.relevance)
  } catch (error) {
    console.error("Error searching projects:", error)
    return []
  }
}

export async function searchDiscussions(searchTerm: string, limitParam = 20) {
  try {
    const searchLower = searchTerm.toLowerCase()
    const discussionsRef = collection(db, "discussions")
    const q = query(discussionsRef, orderBy("created_at", "desc"), firestoreLimit(limitParam))

    const snapshot = await getDocs(q)
    const results: SearchResult[] = []

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const titleMatch = data.title.toLowerCase().includes(searchLower)
      const contentMatch = data.content.toLowerCase().includes(searchLower)
      const tagMatch = data.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))

      if (titleMatch || contentMatch || tagMatch) {
        let relevance = 0
        if (titleMatch) relevance += 3
        if (contentMatch) relevance += 2
        if (tagMatch) relevance += 1

        results.push({
          id: doc.id,
          type: "discussion",
          title: data.title,
          description: data.content.substring(0, 150),
          metadata: {
            category: data.category,
            tags: data.tags,
            creator_id: data.creator_id,
          },
          relevance,
        })
      }
    })

    return results.sort((a, b) => b.relevance - a.relevance)
  } catch (error) {
    console.error("Error searching discussions:", error)
    return []
  }
}

export async function searchUsers(searchTerm: string, limitParam = 20) {
  try {
    // Parse search query to extract key terms (handle phrases like "developers with node skills")
    const parsedTerms = searchTerm
      .toLowerCase()
      .replace(/developers?\s+with\s+/gi, '')
      .replace(/\s+skills?/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(term => term.length > 0)
    
    const searchLower = parsedTerms.join(' ') || searchTerm.toLowerCase()
    const usersRef = collection(db, "users")
    const q = query(usersRef, firestoreLimit(limitParam))

    const snapshot = await getDocs(q)
    const results: SearchResult[] = []

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const usernameMatch = data.username.toLowerCase().includes(searchLower)
      const bioMatch = data.bio?.toLowerCase().includes(searchLower)
      
      // Enhanced skill matching - check if any search term matches any skill
      // This helps with searches like "node" matching "Node.js" or "developers with node skills"
      const skillsMatch = parsedTerms.some(term => {
        return data.skills?.some((skill: string) => {
          const skillLower = skill.toLowerCase()
          // Check various matching strategies
          return skillLower.includes(term) || 
                 term.includes(skillLower) ||
                 skillLower.replace(/[._-\s]/g, '').includes(term.replace(/[._-\s]/g, '')) ||
                 term.includes(skillLower.replace(/\.js$|\.ts$|\.jsx$|\.tsx$/g, '')) ||
                 skillLower.replace(/\.js$|\.ts$|\.jsx$|\.tsx$/g, '') === term
        })
      }) || (data.skills?.some((skill: string) => {
        const skillLower = skill.toLowerCase()
        return skillLower.includes(searchLower) || searchLower.includes(skillLower) ||
               skillLower.replace(/[._-]/g, '').includes(searchLower.replace(/[._-]/g, '')) ||
               searchLower.includes(skillLower.replace(/\.js$|\.ts$|\.jsx$|\.tsx$/g, ''))
      }))

      if (usernameMatch || bioMatch || skillsMatch) {
        let relevance = 0
        if (usernameMatch) relevance += 3
        if (bioMatch) relevance += 2
        if (skillsMatch) relevance += 1

        results.push({
          id: doc.id,
          type: "user",
          title: data.username,
          description: data.bio || "",
          metadata: {
            avatar_url: data.avatar_url,
            skills: data.skills,
          },
          relevance,
        })
      }
    })

    return results.sort((a, b) => b.relevance - a.relevance)
  } catch (error) {
    console.error("Error searching users:", error)
    return []
  }
}

export async function performGlobalSearch(searchTerm: string) {
  try {
    const [projects, discussions, users] = await Promise.all([
      searchProjects(searchTerm, { limit: 10 }),
      searchDiscussions(searchTerm, 10),
      searchUsers(searchTerm, 10),
    ])

    return {
      projects,
      discussions,
      users,
      total: projects.length + discussions.length + users.length,
    }
  } catch (error) {
    console.error("Error performing global search:", error)
    return {
      projects: [],
      discussions: [],
      users: [],
      total: 0,
    }
  }
}
