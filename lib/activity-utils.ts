import { db } from "@/lib/firebase"
import { collection, addDoc } from "firebase/firestore"
import { createNotification } from "@/lib/notifications-utils"

export function getActivityMessage(activity: any): string {
  switch (activity.action_type) {
    case "created_project":
      return `created a project: ${activity.related_entity}`
    case "updated_project":
      return `updated project: ${activity.related_entity}`
    case "created_discussion":
      return `started a discussion: ${activity.related_entity}`
    case "commented_on_discussion":
      return `commented on: ${activity.related_entity}`
    case "followed_user":
      return `followed ${activity.related_entity}`
    case "created_task":
      return `created a task: ${activity.related_entity}`
    case "updated_task_status":
      return `updated task status: ${activity.related_entity}`
    case "commented_on_task":
      return `commented on task: ${activity.related_entity}`
    case "requested_code_review":
      return `requested code review: ${activity.related_entity}`
    case "reviewed_code":
      return `reviewed code: ${activity.related_entity}`
    case "added_collaborator":
      return `added a collaborator to: ${activity.related_entity}`
    default:
      return activity.related_entity
  }
}

export function formatDate(timestamp: any): string {
  if (!timestamp) return "Recently"
  const date = timestamp.toDate?.() || new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function orderBy(field: string, direction?: "asc" | "desc") {
  // This is a placeholder - Firebase's orderBy is imported directly
  return { field, direction: direction || "asc" }
}

export async function createActivity(
  userId: string,
  actionType: string,
  relatedEntity: string,
  relatedEntityId?: string,
  notifyUserId?: string,
) {
  try {
    const activity = await addDoc(collection(db, "activities"), {
      user_id: userId,
      action_type: actionType,
      related_entity: relatedEntity,
      related_entity_id: relatedEntityId,
      created_at: new Date(),
    })

    // Create notification if notifyUserId is provided
    if (notifyUserId && notifyUserId !== userId) {
      const message = getActivityMessage({
        action_type: actionType,
        related_entity: relatedEntity,
      })

      await createNotification(
        notifyUserId,
        actionType.includes("task") ? "task_assigned" : "project_update",
        `Activity: ${message}`,
        message,
        relatedEntityId || "",
        actionType,
        userId,
      )
    }

    return activity.id
  } catch (error) {
    console.error("Error creating activity:", error)
    throw error
  }
}