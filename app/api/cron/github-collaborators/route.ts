import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, updateDoc, setDoc } from "firebase/firestore"
import { getRepoCollaborators } from "@/lib/github-utils"

export async function GET() {
  try {
    const projectsSnap = await getDocs(query(collection(db, 'projects'), where('collaboration_type', '==', 'authorized'), where('collaboration_sync_github', '==', true)))

    for (const p of projectsSnap.docs) {
      const project: any = { id: p.id, ...p.data() }
      const full = project.github_repo_full_name || (project.github_url || '').replace('https://github.com/','')
      if (!full || !project.owner_id) continue
      const [owner, repo] = full.split('/')
      try {
        const ghUsers = await getRepoCollaborators(owner, repo, project.owner_id)
        const usersSnap = await getDocs(collection(db, 'users'))
        const users = usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        const toAdd = users.filter((u: any) => ghUsers.some((g: any) => (u.githubUsername || '').toLowerCase() === g.login.toLowerCase()))
        for (const u of toAdd) {
          if (u.id === project.owner_id) continue
          const collabId = `${project.id}_${u.id}`
          await setDoc(doc(db, 'collaborations', collabId), {
            project_id: project.id,
            user_id: u.id,
            role: 'contributor',
            joined_at: new Date(),
          }, { merge: true })
        }
        await updateDoc(doc(db, 'projects', project.id), { last_github_sync_at: new Date() })
      } catch (e) {
        // continue other projects
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'sync failed' }, { status: 500 })
  }
}
