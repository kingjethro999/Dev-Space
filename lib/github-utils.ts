import { db } from "@/lib/firebase"
import { collection, addDoc, updateDoc, doc, query, where, getDocs } from "firebase/firestore"

export interface GitHubRepo {
  id: string
  projectId: string
  githubUrl: string
  repoName: string
  owner: string
  stars: number
  forks: number
  watchers: number
  language: string
  description: string
  lastSynced: Date
}

export async function linkGitHubRepo(projectId: string, githubUrl: string, repoData: any) {
  try {
    const repoRef = await addDoc(collection(db, "github_repos"), {
      projectId,
      githubUrl,
      repoName: repoData.name,
      owner: repoData.owner.login,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      watchers: repoData.watchers_count,
      language: repoData.language,
      description: repoData.description,
      lastSynced: new Date(),
      createdAt: new Date(),
    })

    // Update project with GitHub repo reference
    await updateDoc(doc(db, "projects", projectId), {
      githubRepoId: repoRef.id,
      githubUrl,
    })

    return repoRef.id
  } catch (error) {
    console.error("Error linking GitHub repo:", error)
    throw error
  }
}

export async function getGitHubRepoStats(projectId: string) {
  try {
    const q = query(collection(db, "github_repos"), where("projectId", "==", projectId))
    const snapshot = await getDocs(q)

    if (snapshot.empty) return null

    return snapshot.docs[0].data() as GitHubRepo
  } catch (error) {
    console.error("Error fetching GitHub repo stats:", error)
    return null
  }
}

export async function syncGitHubStats(projectId: string, githubUrl: string) {
  try {
    const [owner, repo] = githubUrl.replace("https://github.com/", "").split("/")

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
    const repoData = await response.json()

    const q = query(collection(db, "github_repos"), where("projectId", "==", projectId))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      const repoDocId = snapshot.docs[0].id
      await updateDoc(doc(db, "github_repos", repoDocId), {
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        watchers: repoData.watchers_count,
        lastSynced: new Date(),
      })
    }

    return repoData
  } catch (error) {
    console.error("Error syncing GitHub stats:", error)
    throw error
  }
}
