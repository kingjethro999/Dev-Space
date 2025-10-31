"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, orderBy, getDoc, doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { UniversalNav } from "@/components/universal-nav"

interface CodeReview {
  id: string
  project_id: string
  title: string
  code_snippet: string
  language: string
  description: string
  author_id: string
  status: "pending" | "approved" | "changes-requested"
  created_at: any
}

interface UserData {
  username: string
  avatar_url?: string
}

export default function CodeReviewsPage() {
  const { user } = useAuth()
  const params = useParams()
  const projectId = params.id as string

  const [reviews, setReviews] = useState<CodeReview[]>([])
  const [project, setProject] = useState<any>(null)
  const [userData, setUserData] = useState<{ [key: string]: UserData }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      const projectDoc = await getDoc(doc(db, "projects", projectId))
      if (projectDoc.exists()) {
        setProject({ id: projectDoc.id, ...projectDoc.data() })
      }
    }
    fetchProject()
  }, [projectId])

  useEffect(() => {
    if (!projectId) return

    const q = query(collection(db, "code_reviews"), where("project_id", "==", projectId), orderBy("created_at", "desc"))

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const reviewsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CodeReview[]
      setReviews(reviewsData)

      const userIds = [...new Set(reviewsData.map((r) => r.author_id))]
      const newUserData: { [key: string]: UserData } = { ...userData }

      for (const userId of userIds) {
        if (!newUserData[userId]) {
          const userDoc = await getDoc(doc(db, "users", userId))
          if (userDoc.exists()) {
            newUserData[userId] = userDoc.data() as UserData
          }
        }
      }
      setUserData(newUserData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [projectId])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <p className="text-muted-foreground">Please log in to view code reviews</p>
        </Card>
      </div>
    )
  }

  const isProjectOwner = user.uid === project?.owner_id

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />
      <div className="max-w-7xl mx-auto py-8 px-4">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/projects/${projectId}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </Link>
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Code Reviews</h1>
          <p className="text-muted-foreground">Review and discuss code snippets</p>
        </div>
        <Button asChild>
          <Link href={`/projects/${projectId}/reviews/new`}>
            <Code className="w-4 h-4 mr-2" />
            Request Review
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card className="p-12 text-center">
          <Code className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No code reviews yet</h3>
          <p className="text-muted-foreground mb-4">Request a code review to get feedback</p>
          <Button asChild>
            <Link href={`/projects/${projectId}/reviews/new`}>Request Review</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const author = userData[review.author_id]
            return (
              <Link key={review.id} href={`/projects/${projectId}/reviews/${review.id}`}>
                <Card className="p-6 hover:bg-accent cursor-pointer transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{review.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        by {author?.username} • {review.created_at?.toDate?.()?.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        review.status === "approved"
                          ? "default"
                          : review.status === "changes-requested"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {review.status.replace("-", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{review.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{review.language}</Badge>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
