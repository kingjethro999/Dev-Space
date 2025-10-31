import { db } from "@/lib/firebase"
import { collection, addDoc, updateDoc, doc, query, where, getDocs } from "firebase/firestore"

// Firebase GitHub Auth Configuration
import { auth } from "./firebase"
import {
  signInWithPopup,
  GithubAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { setDoc, getDoc, Timestamp } from "firebase/firestore"

const githubProvider = new GithubAuthProvider()

// Request comprehensive scopes for GitHub repository access
githubProvider.addScope("repo") // Full repository access
githubProvider.addScope("user") // User profile access
githubProvider.addScope("read:user") // Read user profile
githubProvider.addScope("user:email") // Access user email
githubProvider.addScope("read:org") // Read organization membership
githubProvider.addScope("workflow") // Access GitHub Actions workflows

export async function signInWithGitHub() {
  try {
    const result = await signInWithPopup(auth, githubProvider)
    const user = result.user

    // Get the GitHub access token from the credential
    const credential = GithubAuthProvider.credentialFromResult(result)
    const accessToken = credential?.accessToken

    // Extract GitHub username from displayName or email
    const githubUsername = user.displayName || user.email?.split('@')[0] || ''

    // Create or update user in Firestore with GitHub token
    const firestoreUser = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      githubUsername: githubUsername,
      githubAccessToken: accessToken, // Store the GitHub access token
      githubConnected: true,
      githubConnectedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    }
    
    await setDoc(doc(db, "users", user.uid), firestoreUser, { merge: true })

    // Also store the token in localStorage for immediate access
    if (accessToken) {
      localStorage.setItem('github_access_token', accessToken)
    }

    return user
  } catch (error) {
    console.error("GitHub sign-in error:", error)
    throw error
  }
}

export async function signOut() {
  try {
    // Clear GitHub token from localStorage
    localStorage.removeItem('github_access_token')
    
    await firebaseSignOut(auth)
  } catch (error) {
    console.error("Sign-out error:", error)
    throw error
  }
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

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

// Get GitHub access token for current user
export async function getGitHubAccessToken(userId: string): Promise<string | null> {
  try {
    // Check if we're in a browser environment before accessing localStorage
    const isServer = typeof window === 'undefined'
    
    // Only check localStorage in browser/client environment
    if (!isServer) {
      const localToken = localStorage.getItem('github_access_token')
      if (localToken) return localToken
    }

    // Always check Firestore (works on both client and server)
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      const userData = userDoc.data()
      return userData.githubAccessToken || null
    }
    return null
  } catch (error) {
    console.error("Error getting GitHub access token:", error)
    return null
  }
}

// GitHub API functions for repository management
export async function getUserRepositories(userId: string) {
  try {
    const accessToken = await getGitHubAccessToken(userId)
    if (!accessToken) {
      throw new Error('GitHub not connected')
    }

    const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Dev-Space-App',
      },
    })

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `GitHub API error: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = errorData.message
        }
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage
      }
      
      // Provide more specific error messages
      if (response.status === 401 || response.status === 403) {
        throw new Error(`GitHub authentication failed. Please reconnect your GitHub account. (${errorMessage})`)
      }
      
      throw new Error(`GitHub API error: ${response.status} - ${errorMessage}`)
    }

    const repos = await response.json()
    return repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      private: repo.private,
      url: repo.html_url,
      cloneUrl: repo.clone_url,
      defaultBranch: repo.default_branch,
      updatedAt: repo.updated_at,
      createdAt: repo.created_at,
    }))
  } catch (error) {
    console.error("Error fetching user repositories:", error)
    throw error
  }
}

export async function getRepositoryDetails(owner: string, repo: string, userId: string) {
  try {
    const accessToken = await getGitHubAccessToken(userId)
    if (!accessToken) {
      throw new Error('GitHub not connected')
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const repoData = await response.json()
    return {
      id: repoData.id,
      name: repoData.name,
      fullName: repoData.full_name,
      description: repoData.description,
      language: repoData.language,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      watchers: repoData.watchers_count,
      private: repoData.private,
      url: repoData.html_url,
      cloneUrl: repoData.clone_url,
      defaultBranch: repoData.default_branch,
      updatedAt: repoData.updated_at,
      createdAt: repoData.created_at,
      topics: repoData.topics || [],
      license: repoData.license?.name,
      size: repoData.size,
      openIssues: repoData.open_issues_count,
    }
  } catch (error) {
    console.error("Error fetching repository details:", error)
    throw error
  }
}

export async function getRepositoryLanguages(owner: string, repo: string, userId: string) {
  try {
    const accessToken = await getGitHubAccessToken(userId)
    if (!accessToken) {
      throw new Error('GitHub not connected')
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching repository languages:", error)
    throw error
  }
}

export async function getRepositoryReadme(owner: string, repo: string, userId: string) {
  try {
    const accessToken = await getGitHubAccessToken(userId)
    if (!accessToken) {
      throw new Error('GitHub not connected')
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      return null // No README found
    }

    const readmeData = await response.json()
    return {
      content: atob(readmeData.content),
      encoding: readmeData.encoding,
      size: readmeData.size,
      name: readmeData.name,
    }
  } catch (error) {
    console.error("Error fetching repository README:", error)
    return null
  }
}

// Store GitHub access token for user
export async function storeGitHubToken(userId: string, accessToken: string) {
  try {
    await updateDoc(doc(db, "users", userId), {
      githubAccessToken: accessToken,
      githubConnected: true,
      githubConnectedAt: new Date(),
    })
  } catch (error) {
    console.error("Error storing GitHub token:", error)
    throw error
  }
}

// Check if user has GitHub connected
export async function isGitHubConnected(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", userId)))
    if (userDoc.empty) return false
    
    const userData = userDoc.docs[0].data()
    return userData.githubConnected === true && !!userData.githubAccessToken
  } catch (error) {
    console.error("Error checking GitHub connection:", error)
    return false
  }
}

export async function getRepoCollaborators(owner: string, repo: string, userId: string) {
  try {
    const accessToken = await getGitHubAccessToken(userId)
    if (!accessToken) throw new Error('GitHub not connected')

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/collaborators?per_page=100`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const users = await response.json()
    return users.map((u: any) => ({
      githubId: u.id,
      login: u.login,
      avatarUrl: u.avatar_url,
      htmlUrl: u.html_url,
      name: u.name,
    }))
  } catch (e) {
    console.error('Error fetching repo collaborators:', e)
    throw e
  }
}
