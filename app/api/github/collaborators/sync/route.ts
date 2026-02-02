import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, getDocs, query, where, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { getRepoCollaborators } from "@/lib/github-utils"

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json()
    if (!projectId) return NextResponse.json({ ok: false, error: 'projectId required' }, { status: 400 })

    const p = await getDoc(doc(db, 'projects', projectId))
    if (!p.exists()) return NextResponse.json({ ok: false, error: 'project not found' }, { status: 404 })

    const project: any = { id: p.id, ...p.data() }
    const full = project.github_repo_full_name || (project.github_url || '').replace('https://github.com/', '')
    if (!full || !project.owner_id) return NextResponse.json({ ok: false, error: 'repo not linked' }, { status: 400 })

    const [owner, repo] = full.split('/')
    const ghUsers = await getRepoCollaborators(owner, repo, project.owner_id)
    const ghLogins = ghUsers.map((g: any) => g.login.toLowerCase())

    const usersSnap = await getDocs(collection(db, 'users'))
    const users = usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))

    let added = 0
    let invitesAccepted = 0

    // Sync collaborations
    for (const u of users) {
      if (ghLogins.includes((u.githubUsername || '').toLowerCase())) {
        if (u.id === project.owner_id) continue
        const collabId = `${project.id}_${u.id}`
        await setDoc(doc(db, 'collaborations', collabId), {
          project_id: project.id,
          user_id: u.id,
          role: 'contributor',
          joined_at: new Date(),
        }, { merge: true })
        added++
      }
    }

    // Update pending invitations to accepted
    const pendingInvitesQuery = query(
      collection(db, 'github_invitations'),
      where('project_id', '==', projectId),
      where('status', '==', 'pending')
    )
    const pendingInvites = await getDocs(pendingInvitesQuery)

    for (const inviteDoc of pendingInvites.docs) {
      const invite = inviteDoc.data()
      // Check if the invited user is now a collaborator
      if (ghLogins.includes((invite.github_username || '').toLowerCase())) {
        await updateDoc(doc(db, 'github_invitations', inviteDoc.id), {
          status: 'accepted',
          accepted_at: serverTimestamp(),
        })
        invitesAccepted++
      }
    }

    await updateDoc(doc(db, 'projects', project.id), { last_github_sync_at: new Date() })
    return NextResponse.json({ ok: true, added, invitesAccepted })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'sync failed' }, { status: 500 })
  }
}

