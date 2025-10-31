import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, getDocs, query, where, setDoc, updateDoc } from "firebase/firestore"
import { getRepoCollaborators } from "@/lib/github-utils"

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json()
    if (!projectId) return NextResponse.json({ ok: false, error: 'projectId required' }, { status: 400 })

    const p = await getDoc(doc(db, 'projects', projectId))
    if (!p.exists()) return NextResponse.json({ ok: false, error: 'project not found' }, { status: 404 })

    const project: any = { id: p.id, ...p.data() }
    const full = project.github_repo_full_name || (project.github_url || '').replace('https://github.com/','')
    if (!full || !project.owner_id) return NextResponse.json({ ok: false, error: 'repo not linked' }, { status: 400 })

    const [owner, repo] = full.split('/')
    const ghUsers = await getRepoCollaborators(owner, repo, project.owner_id)

    const usersSnap = await getDocs(collection(db, 'users'))
    const users = usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))

    let added = 0
    for (const u of users) {
      if (ghUsers.some((g: any) => (u.githubUsername || '').toLowerCase() === g.login.toLowerCase())) {
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

    await updateDoc(doc(db, 'projects', project.id), { last_github_sync_at: new Date() })
    return NextResponse.json({ ok: true, added })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'sync failed' }, { status: 500 })
  }
}
