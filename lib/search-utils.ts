import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, limit, type Query } from "firebase/firestore"

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
      q = query(projectsRef, where("visibility", "==", "public"), limit(filters?.limit || 20))
    } else {
      q = query(
        projectsRef,
        where("visibility", "==", "public"),
        orderBy("created_at", "desc"),
        limit(filters?.limit || 20),
      )
    }

    const snapshot = await getDocs(q)
    const results: SearchResult[] = []

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const titleMatch = data.title.toLowerCase().includes(searchLower)
      const descMatch = data.description.toLowerCase().includes(searchLower)
      const techMatch = data.tech_stack?.some((tech: string) => tech.toLowerCase().includes(searchLower))

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

export async function searchDiscussions(searchTerm: string, limit = 20) {
  try {
    const searchLower = searchTerm.toLowerCase()
    const discussionsRef = collection(db, "discussions")
    const q = query(discussionsRef, orderBy("created_at", "desc"), limit(limit))

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

export async function searchUsers(searchTerm: string, limit = 20) {
  try {
    const searchLower = searchTerm.toLowerCase()
    const usersRef = collection(db, "users")
    const q = query(usersRef, limit(limit))

    const snapshot = await getDocs(q)
    const results: SearchResult[] = []

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const usernameMatch = data.username.toLowerCase().includes(searchLower)
      const bioMatch = data.bio?.toLowerCase().includes(searchLower)
      const skillsMatch = data.skills?.some((skill: string) => skill.toLowerCase().includes(searchLower))

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
