import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"
import { inviteCollaboratorToRepo, parseGitHubUrl, type GitHubPermission } from "@/lib/github-utils"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { projectId, inviteeUserId, permission = "push" } = body

        if (!projectId || !inviteeUserId) {
            return NextResponse.json({ error: "projectId and inviteeUserId are required" }, { status: 400 })
        }

        // Get the Authorization header to identify the inviter
        const authHeader = request.headers.get("x-user-id")
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        const inviterId = authHeader

        // Fetch the project
        const projectDoc = await getDoc(doc(db, "projects", projectId))
        if (!projectDoc.exists()) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }
        const project = projectDoc.data()

        // Verify inviter is the project owner
        if (project.owner_id !== inviterId) {
            return NextResponse.json({ error: "Only the project owner can invite collaborators" }, { status: 403 })
        }

        // Get GitHub repo info from project
        const githubUrl = project.github_url || project.githubUrl
        if (!githubUrl) {
            return NextResponse.json({ error: "Project must have a linked GitHub repository" }, { status: 400 })
        }

        const parsed = parseGitHubUrl(githubUrl)
        if (!parsed) {
            return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 })
        }

        // Get invitee's GitHub username
        const inviteeDoc = await getDoc(doc(db, "users", inviteeUserId))
        if (!inviteeDoc.exists()) {
            return NextResponse.json({ error: "Invitee not found" }, { status: 404 })
        }
        const invitee = inviteeDoc.data()

        if (!invitee.githubConnected || !invitee.githubUsername) {
            return NextResponse.json({ error: "Invitee does not have GitHub connected" }, { status: 400 })
        }

        // Check if invitation already exists
        const existingInviteQuery = query(
            collection(db, "github_invitations"),
            where("project_id", "==", projectId),
            where("invitee_user_id", "==", inviteeUserId),
            where("status", "==", "pending")
        )
        const existingInvites = await getDocs(existingInviteQuery)
        if (!existingInvites.empty) {
            return NextResponse.json({ error: "Invitation already pending for this user" }, { status: 409 })
        }

        // Send GitHub invite
        const result = await inviteCollaboratorToRepo(
            parsed.owner,
            parsed.repo,
            invitee.githubUsername,
            permission as GitHubPermission,
            inviterId
        )

        if (result.success) {
            // Store invitation in Firestore
            await addDoc(collection(db, "github_invitations"), {
                project_id: projectId,
                github_repo: `${parsed.owner}/${parsed.repo}`,
                invitee_user_id: inviteeUserId,
                github_username: invitee.githubUsername,
                github_invitation_id: result.invitationId || null,
                permission,
                status: result.alreadyCollaborator ? "accepted" : "pending",
                invited_by: inviterId,
                invited_at: serverTimestamp(),
                accepted_at: result.alreadyCollaborator ? serverTimestamp() : null,
            })

            return NextResponse.json({
                success: true,
                message: result.message,
                alreadyCollaborator: result.alreadyCollaborator,
            })
        }

        return NextResponse.json({ error: result.message }, { status: 500 })
    } catch (error: any) {
        console.error("Error inviting collaborator:", error)
        return NextResponse.json({ error: error.message || "Failed to invite collaborator" }, { status: 500 })
    }
}
