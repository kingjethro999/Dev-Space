import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, setDoc, addDoc, collection, Timestamp } from "firebase/firestore"
import { getGitHubAccessToken } from "@/lib/github-utils"
import { sendCommitAlertEmail } from "@/lib/mail-utils"

interface Commit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    }
  }
  author: {
    login: string
    avatar_url: string
  }
  html_url: string
}

/**
 * On-demand API to check for new commits in a GitHub repository
 * Called when viewing a project page or manually triggered
 */
export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json()
    if (!projectId) {
      return NextResponse.json({ ok: false, error: 'projectId required' }, { status: 400 })
    }

    // Get project
    const projectDoc = await getDoc(doc(db, 'projects', projectId))
    if (!projectDoc.exists()) {
      return NextResponse.json({ ok: false, error: 'project not found' }, { status: 404 })
    }

    const project: any = { id: projectDoc.id, ...projectDoc.data() }
    
    // Skip if no GitHub URL or owner
    if (!project.github_url || !project.owner_id) {
      return NextResponse.json({ ok: false, error: 'project has no GitHub repository' }, { status: 400 })
    }
    
    // Parse GitHub URL to get owner/repo
    const githubUrl = project.github_url.replace('https://github.com/', '').replace('https://www.github.com/', '')
    const [owner, repo] = githubUrl.split('/')
    
    if (!owner || !repo) {
      return NextResponse.json({ ok: false, error: 'invalid GitHub URL' }, { status: 400 })
    }

    // Get GitHub access token for the project owner
    const accessToken = await getGitHubAccessToken(project.owner_id)
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'no GitHub access token' }, { status: 401 })
    }

    // Check if project has watcher enabled
    const watcherRef = doc(db, 'github_watchers', `${project.id}`)
    const watcherSnap = await getDoc(watcherRef)
    
    let watcherData: any = null
    let lastCheckedCommit = null

    if (watcherSnap.exists()) {
      watcherData = watcherSnap.data()
      lastCheckedCommit = watcherData.lastCommitSha || null
      
      // Only check if enabled
      if (watcherData.enabled === false) {
        return NextResponse.json({ ok: true, message: 'watcher disabled', newCommits: [] })
      }
    } else {
      // Create watcher entry
      await setDoc(watcherRef, {
        projectId: project.id,
        githubUrl: project.github_url,
        owner,
        repo,
        enabled: true,
        createdAt: Timestamp.now(),
        lastCheckedCommit: null,
      }, { merge: true })
    }

    // Fetch recent commits from GitHub
    const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`
    const response = await fetch(commitsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Dev-Space-App',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ 
        ok: false, 
        error: `GitHub API error: ${response.status}` 
      }, { status: response.status })
    }

    const commits: Commit[] = await response.json()

    // Find new commits
    let newCommits: Commit[] = []
    
    if (commits.length > 0) {
      if (lastCheckedCommit) {
        // Find commits after the last checked one
        const lastIndex = commits.findIndex(c => c.sha === lastCheckedCommit)
        if (lastIndex > 0) {
          newCommits = commits.slice(0, lastIndex)
        } else if (lastIndex === -1) {
          // Last commit not found, treat first 5 as new
          newCommits = commits.slice(0, 5)
        }
      } else {
        // First time checking, just check the most recent commit
        newCommits = [commits[0]]
      }

      // Process new commits
      for (const commit of newCommits) {
        try {
          // Send notification to project owner
          const ownerDoc = await getDoc(doc(db, 'users', project.owner_id))
          if (ownerDoc.exists()) {
            const ownerData = ownerDoc.data()
            
            // Create notification
            const notificationData = {
              user_id: project.owner_id,
              type: 'project_update',
              title: 'New commit detected',
              description: `${commit.commit.message.split('\n')[0].substring(0, 100)}`,
              related_entity_id: project.id,
              related_entity_type: 'project',
              read: false,
              created_at: Timestamp.now(),
              actor_id: commit.author?.login || 'GitHub',
            }
            
            await addDoc(collection(db, 'notifications'), notificationData)

            // Send email notification
            if (ownerData.email) {
              const journeyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://the-dev-space.vercel.app'}/projects/${project.id}/journey/new?commitSha=${commit.sha}&commitMessage=${encodeURIComponent(commit.commit.message)}&commitUrl=${encodeURIComponent(commit.html_url)}&repoName=${encodeURIComponent(repo)}`
              
              await sendCommitAlertEmail({
                to: ownerData.email,
                username: ownerData.username || ownerData.displayName || 'Developer',
                repoName: repo,
                commitMessage: commit.commit.message,
                commitUrl: commit.html_url,
                journeyUrl,
                commitAuthor: commit.commit.author.name,
              })
            }
          }
        } catch (error) {
          console.error('Error processing commit:', error)
        }
      }

      // Update watcher with latest commit
      if (newCommits.length > 0) {
        await updateDoc(watcherRef, {
          lastCommitSha: newCommits[0].sha,
          lastCheckedAt: Timestamp.now(),
        })
      }
    }

    return NextResponse.json({ 
      ok: true, 
      newCommits: newCommits.length,
      commits: newCommits.map(c => ({
        sha: c.sha,
        message: c.commit.message,
        author: c.commit.author.name,
        url: c.html_url
      }))
    })
  } catch (error: any) {
    console.error('Commit check error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'check failed' },
      { status: 500 }
    )
  }
}

