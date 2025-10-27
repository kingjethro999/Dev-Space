import { db } from "@/lib/firebase"
import { collection, addDoc, updateDoc, doc, query, where, onSnapshot, orderBy, limit, getDocs, writeBatch } from "firebase/firestore"

export type NotificationType =
  | "message"
  | "task_assigned"
  | "review_requested"
  | "project_update"
  | "follow"
  | "comment"

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  description: string
  related_entity_id: string
  related_entity_type: string
  read: boolean
  created_at: Date
  actor_id?: string
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  description: string,
  relatedEntityId: string,
  relatedEntityType: string,
  actorId?: string,
) {
  try {
    await addDoc(collection(db, "notifications"), {
      user_id: userId,
      type,
      title,
      description,
      related_entity_id: relatedEntityId,
      related_entity_type: relatedEntityType,
      read: false,
      created_at: new Date(),
      actor_id: actorId,
    })
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

export function subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
  const q = query(
    collection(db, "notifications"),
    where("user_id", "==", userId),
    orderBy("created_at", "desc"),
    limit(50),
  )

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.() || new Date(),
    })) as Notification[]

    callback(notifications)
  })
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const q = query(collection(db, "notifications"), where("user_id", "==", userId), where("read", "==", false))
    const snapshot = await getDocs(q)

    const batch = writeBatch(db)
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true })
    })

    await batch.commit()
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
  }
}

