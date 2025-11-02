import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import { createNotification } from "@/lib/notifications-utils"
import { sendNotificationEmail } from "@/lib/mail-utils"

/**
 * Check if a project's journey has stale entries (no updates in 7+ days)
 * Called when viewing the journey page
 */
export async function POST(request: NextRequest) {
  try {
    const { projectId, userId } = await request.json()
    
    if (!projectId) {
      return NextResponse.json({ ok: false, error: 'projectId required' }, { status: 400 })
    }

    // Get project
    const projectDoc = await getDoc(doc(db, 'projects', projectId))
    if (!projectDoc.exists()) {
      return NextResponse.json({ ok: false, error: 'project not found' }, { status: 404 })
    }

    const project: any = { id: projectDoc.id, ...projectDoc.data() }
    const projectTitle = project.title || 'Your project'
    const projectOwnerId = project.owner_id

    // Only check if user is the owner
    if (userId && userId !== projectOwnerId) {
      return NextResponse.json({ ok: true, stale: false, message: 'not owner' })
    }

    const now = Date.now()
    
    // Get last journey entry
    const lastEntrySnap = await getDocs(
      query(
        collection(db, "journey_entries"),
        where("projectId", "==", projectId),
        orderBy("timestamp", "desc"),
        limit(1)
      )
    )

    let stale = false
    if (lastEntrySnap.empty) {
      // No entries at all - consider stale
      stale = true
    } else {
      const lastEntry = lastEntrySnap.docs[0].data()
      const timestamp = lastEntry.timestamp?.toDate?.() || new Date()
      // Check if last entry is older than 7 days
      stale = now - timestamp.getTime() > 7 * 24 * 3600 * 1000
    }

    if (stale && userId === projectOwnerId) {
      // Create in-app notification
      await createNotification(
        projectOwnerId,
        "project_update",
        `Keep your users updated on ${projectTitle}`,
        `Any updates since your last log?`,
        projectId,
        "project",
        undefined
      )

      // Get user email for notification
      const userDoc = await getDoc(doc(db, 'users', projectOwnerId))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const email = userData.email
        
        if (email) {
          // Send email notification (non-blocking)
          sendNotificationEmail({
            username: userData.username || userData.displayName || email,
            notificationType: "Journey Reminder",
            message: `Hey! Got progress to log for ${projectTitle}?`,
            actionLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://the-dev-space.vercel.app'}/projects/${projectId}/journey`,
          }).catch(err => console.error('Email notification failed:', err))
        }
      }
    }

    return NextResponse.json({ 
      ok: true, 
      stale,
      message: stale ? 'Journey has no updates in 7+ days' : 'Journey is up to date'
    })
  } catch (error: any) {
    console.error('Journey stale check error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'check failed' },
      { status: 500 }
    )
  }
}

