"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { JourneyAttachment } from "@/lib/journey-schema"
import { ExternalLink } from "lucide-react"

interface JourneyAttachmentViewerProps {
  attachment: JourneyAttachment
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JourneyAttachmentViewer({ attachment, open, onOpenChange }: JourneyAttachmentViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">{attachment.title || 'Attachment'}</DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          {attachment.type === 'image' && (
            <div className="relative w-full h-[420px]">
              <Image src={attachment.url} alt={attachment.title || 'Image'} fill className="object-contain rounded" />
            </div>
          )}

          {attachment.type === 'video' && (
            <video controls className="w-full rounded" src={attachment.url} />
          )}

          {attachment.type === 'code' && (
            <pre className="bg-muted p-4 rounded overflow-x-auto text-sm">
{attachment.description || 'Code snippet'}
            </pre>
          )}

          {(attachment.type === 'file' || attachment.type === 'link') && (
            <Button asChild className="mt-2">
              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> Open
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


