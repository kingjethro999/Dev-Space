"use client"

import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/search-bar"
import { NotificationsCenter } from "@/components/notifications-center"
import { GlowAIChat } from "@/components/glow-ai-chat"
import Image from "next/image"
import { useState } from "react"
import { Menu, Folder, MessageSquare, Mail, User } from "lucide-react"

export function UniversalNav() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!user) {
    return null
  }

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/discover">
          <Image
            src="/dev-space-icon-transparent.png"
            alt="DevSpace"
            width={39}
            height={39}
            className="mr-2"
          />
        </Link>
        <Link href="/discover" className="font-bold text-lg md:text-xl lg:text-2xl text-foreground">
          Dev Space
        </Link>
        <div className="flex-1 hidden lg:flex gap-4 items-center ml-8">
          <SearchBar />
        </div>
        <div className="flex gap-4 items-center">
          <div className="hidden lg:flex gap-4 items-center">
            <Link href="/projects">
              <Button variant="ghost" className="gap-2 flex items-center">
                <Folder className="w-4 h-4" /> Projects
              </Button>
            </Link>
            <Link href="/discussions">
              <Button variant="ghost" className="gap-2 flex items-center">
                <MessageSquare className="w-4 h-4" /> Discussions
              </Button>
            </Link>
            <Link href="/messages">
              <Button variant="ghost" className="gap-2 flex items-center">
                <Mail className="w-4 h-4" /> Messages
              </Button>
            </Link>
            <Link href={`/profile/${user.uid}`}>
              <Button variant="ghost" className="gap-2 flex items-center">
                <User className="w-4 h-4" /> Profile
              </Button>
            </Link>
            <NotificationsCenter />
          </div>
          <button
            className="lg:hidden p-2 rounded-md hover:bg-accent/40 focus:outline-none focus:ring-2"
            onClick={() => setMenuOpen(v => !v)}
          >
            <Menu className="w-7 h-7 text-primary" />
          </button>
        </div>
      </div>
      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="block lg:hidden bg-card w-full border-t border-border px-4 py-4 animate-in fade-in slide-in-from-top-4 z-10 shadow-xl">
          {/* Search bar at top of drawer */}
          <div className="mb-4">
            <SearchBar />
          </div>
          <Link href="/projects" className="block py-2" onClick={() => setMenuOpen(false)}>
            <Button variant="ghost" className="w-full gap-2 flex items-center justify-start">
              <Folder className="w-4 h-4" /> Projects
            </Button>
          </Link>
          <Link href="/discussions" className="block py-2" onClick={() => setMenuOpen(false)}>
            <Button variant="ghost" className="w-full gap-2 flex items-center justify-start">
              <MessageSquare className="w-4 h-4" /> Discussions
            </Button>
          </Link>
          <Link href="/messages" className="block py-2" onClick={() => setMenuOpen(false)}>
            <Button variant="ghost" className="w-full gap-2 flex items-center justify-start">
              <Mail className="w-4 h-4" /> Messages
            </Button>
          </Link>
          <Link href={`/profile/${user.uid}`} className="block py-2" onClick={() => setMenuOpen(false)}>
            <Button variant="ghost" className="w-full gap-2 flex items-center justify-start">
              <User className="w-4 h-4" /> Profile
            </Button>
          </Link>
          <div className="py-2"><NotificationsCenter /></div>
        </div>
      )}
      {/* Glow AI Chat - available on all authenticated pages */}
      <GlowAIChat />
    </nav>
  )
}

