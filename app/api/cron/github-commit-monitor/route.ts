import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, updateDoc, addDoc, Timestamp, setDoc, getDoc } from "firebase/firestore"
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

export async function GET(request: Request) {
  try {
    // Verify Cron secret for Vercel Cron Jobs
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get all projects with GitHub repos and journey enabled
    const projectsQuery = query(
      collection(db, 'projects'),
      where('github_url', '!=', null)
    )
    const projectsSnap = await getDocs(projectsQuery)

    for (const projectDoc of projectsSnap.docs) {
      const project: any = { id: projectDoc.id, ...projectDoc.data() }
      
      // Skip if no GitHub URL or owner
      if (!project.github_url || !project.owner_id) continue
      
      // Parse GitHub URL to get owner/repo
      const githubUrl = project.github_url.replace('https://github.com/', '').replace('https://www.github.com/', '')
      const [owner, repo] = githubUrl.split('/')
      
      if (!owner || !repo) continue

      try {
        // Get GitHub access token for the project owner
        const accessToken = await getGitHubAccessToken(project.owner_id)
        if (!accessToken) {
          console.log(`No GitHub access token for project ${project.id}`)
          continue
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
            console.log(`Watcher disabled for project ${project.id}`)
            continue
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
          console.error(`GitHub API error for ${owner}/${repo}: ${response.status}`)
          continue
        }

        const commits: Commit[] = await response.json()

        // Find new commits
        if (commits.length > 0) {
          let newCommits: Commit[] = []
          
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
                const email = ownerData.email || project.owner_id
                
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
                  const journeyUrl = `https://the-dev-space.vercel.app/projects/${project.id}/journey/new?commitSha=${commit.sha}&commitMessage=${encodeURIComponent(commit.commit.message)}&commitUrl=${encodeURIComponent(commit.html_url)}&repoName=${encodeURIComponent(repo)}`
                  
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
      } catch (error) {
        console.error(`Error processing project ${project.id}:`, error)
        continue
      }
    }

    return NextResponse.json({ ok: true, processed: projectsSnap.size })
  } catch (error: any) {
    console.error('Commit monitor error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'monitor failed' },
      { status: 500 }
    )
  }
}

