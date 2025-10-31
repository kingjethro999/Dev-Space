"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Conversation {
  id: string
  participants: string[]
  participantData: { [key: string]: { username: string; avatar_url?: string } }
  last_message?: string
  last_message_at?: any
}

interface ShareToChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialText: string
}

export function ShareToChatDialog({ open, onOpenChange, initialText }: ShareToChatDialogProps) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    const qy = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid),
      orderBy("last_message_at", "desc"),
    )
    const unsub = onSnapshot(qy, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Conversation))
      setConversations(list)
      if (!selectedId && list.length > 0) setSelectedId(list[0].id)
    })
    return () => unsub()
  }, [user])

  const handleSend = async () => {
    if (!user || !selectedId || !initialText.trim()) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, "messages"), {
        conversation_id: selectedId,
        sender_id: user.uid,
        content: initialText.trim(),
        created_at: serverTimestamp(),
        read: false,
      })
    } finally {
      setSubmitting(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Share to chat</h3>
          <div>
            <label className="block text-sm mb-2">Conversation</label>
            <select
              className="w-full rounded-lg border bg-background px-3 py-2"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
            >
              {conversations.map(c => {
                const otherId = c.participants.find(id => id !== user?.uid)
                const other = otherId ? c.participantData?.[otherId] : undefined
                return (
                  <option key={c.id} value={c.id}>
                    {other?.username || c.id}
                  </option>
                )
              })}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={submitting || !selectedId}>Send</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
