"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY } from "@/lib/CLOUDINARY"

interface Props {
  onUploaded: (result: { url: string; publicId: string }) => void
  children?: React.ReactNode
}

declare global {
  interface Window { cloudinary: any }
}

export function ProjectImageUploadButton({ onUploaded, children }: Props) {
  const widgetRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as any).cloudinary) return
    const script = document.createElement('script')
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const openWidget = () => {
    if (!window.cloudinary) return
    if (!widgetRef.current) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD_NAME,
          apiKey: CLOUDINARY_API_KEY,
          cropping: true,
          croppingAspectRatio: 1,
          multiple: false,
          sources: ["local", "camera", "url"],
          folder: "dev-space/projects",
          uploadPreset: "images",
          showAdvancedOptions: false,
          styles: { palette: { window: "#0a0a0a", windowBorder: "#1f2937", tabIcon: "#6366f1", menuIcons: "#9ca3af", textDark: "#e5e7eb", link: "#818cf8", action: "#4f46e5" } },
        },
        (error: any, result: any) => {
          if (!error && result && result.event === 'success') {
            onUploaded({ url: result.info.secure_url, publicId: result.info.public_id })
          }
        }
      )
    }
    widgetRef.current.open()
  }

  return (
    <Button type="button" variant="outline" onClick={openWidget} className="gap-2">
      {children ?? "Upload Image"}
    </Button>
  )
}
