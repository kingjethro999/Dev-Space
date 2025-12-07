import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, orderBy, query, where, limit } from "firebase/firestore"
import { createNotification } from "@/lib/notifications-utils"
import { sendNotificationEmail } from "@/lib/mail-utils"

export async function GET(request: NextRequest) {
  try {
    // Verify Cron secret for Vercel Cron Jobs
    const authHeader = request.headers.get('authorization')
    
    // Get from environment variable
    const cronSecret = process.env.CRON_SECRET || 'dev-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    const usersSnap = await getDocs(collection(db, "users"))
    const now = Date.now()
    const results: any[] = []

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id
      const email = (userDoc.data() as any).email
      const projectsSnap = await getDocs(query(collection(db, "projects"), where("owner_id", "==", userId)))
      for (const p of projectsSnap.docs) {
        const projectId = p.id
        const projectTitle = (p.data() as any).title
        const lastEntrySnap = await getDocs(
          query(
            collection(db, "journey_entries"),
            where("projectId", "==", projectId),
            orderBy("timestamp", "desc"),
            limit(1)
          )
        )
        let stale = false
        if (lastEntrySnap.empty) stale = true
        else {
          const ts = (lastEntrySnap.docs[0].data() as any).timestamp?.toDate?.() || new Date()
          stale = now - ts.getTime() > 7 * 24 * 3600 * 1000
        }
        if (stale) {
          // in-app
          await createNotification(
            userId,
            "project_update",
            `Keep your users updated on ${projectTitle}`,
            `Any updates since your last log?`,
            projectId,
            "project",
            undefined
          )
          // email
          if (email) {
            await sendNotificationEmail({
              username: email,
              notificationType: "Journey Reminder",
              message: `Hey! Got progress to log for ${projectTitle}?`,
              actionLink: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/journey`,
            })
          }
          results.push({ userId, projectId })
        }
      }
    }

    return NextResponse.json({ ok: true, notified: results.length })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}


