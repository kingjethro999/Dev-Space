"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Code2, BookOpen } from "lucide-react"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/feed" className="text-2xl font-bold text-primary">
            Dev Space
          </Link>
          <div className="flex gap-4">
            <Link href="/feed">
              <Button variant="ghost">Feed</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Dev Space Documentation</h1>
          <p className="text-xl text-slate-300">Complete guide to using the Dev Space platform</p>
          <p className="text-sm text-slate-400 mt-2">Built with ❤️ by <span className="text-blue-400 font-semibold">King Jethro</span> (<a href="https://github.com/kingjethro999" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">@kingjethro999</a>)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-8">
            <div className="flex items-center gap-3 mb-4">
              <Code2 className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">API Reference</h2>
            </div>
            <p className="text-slate-300 mb-6">Learn about all available API endpoints and how to use them.</p>
            <div className="space-y-3">
              <div className="text-sm">
                <h3 className="font-semibold text-blue-400 mb-1">Authentication</h3>
                <p className="text-slate-400">Firebase Auth with GitHub & Google OAuth</p>
              </div>
              <div className="text-sm">
                <h3 className="font-semibold text-blue-400 mb-1">Projects</h3>
                <p className="text-slate-400">Create, read, update, and manage projects</p>
              </div>
              <div className="text-sm">
                <h3 className="font-semibold text-blue-400 mb-1">Discussions</h3>
                <p className="text-slate-400">Forum and discussion management endpoints</p>
              </div>
              <div className="text-sm">
                <h3 className="font-semibold text-blue-400 mb-1">Messaging</h3>
                <p className="text-slate-400">Real-time messaging and conversations</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-8">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Getting Started</h2>
            </div>
            <p className="text-slate-300 mb-6">Quick start guide to get you up and running.</p>
            <div className="space-y-3">
              <div className="text-sm">
                <h3 className="font-semibold text-purple-400 mb-1">1. Create Account</h3>
                <p className="text-slate-400">Sign up with email, GitHub, or Google</p>
              </div>
              <div className="text-sm">
                <h3 className="font-semibold text-purple-400 mb-1">2. Setup Profile</h3>
                <p className="text-slate-400">Add your skills and bio</p>
              </div>
              <div className="text-sm">
                <h3 className="font-semibold text-purple-400 mb-1">3. Create Project</h3>
                <p className="text-slate-400">Share your first project</p>
              </div>
              <div className="text-sm">
                <h3 className="font-semibold text-purple-400 mb-1">4. Connect & Collaborate</h3>
                <p className="text-slate-400">Follow developers and join discussions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-cyan-400 mb-3">Activity Feed</h3>
              <p className="text-slate-300 text-sm mb-4">
                Real-time activity stream showing projects, discussions, and collaborations from developers you follow.
              </p>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>✓ Filter by all activity or following</li>
                <li>✓ Real-time updates</li>
                <li>✓ User profiles</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-cyan-400 mb-3">Project Management</h3>
              <p className="text-slate-300 text-sm mb-4">
                Create and manage projects with GitHub integration, task tracking, and team collaboration.
              </p>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>✓ GitHub sync</li>
                <li>✓ Task management</li>
                <li>✓ Collaborators</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-cyan-400 mb-3">Discussions</h3>
              <p className="text-slate-300 text-sm mb-4">
                Engage in community discussions, ask questions, and share knowledge with other developers.
              </p>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>✓ Categories & tags</li>
                <li>✓ Real-time comments</li>
                <li>✓ Search</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-cyan-400 mb-3">Messaging</h3>
              <p className="text-slate-300 text-sm mb-4">
                Direct messaging with developers for real-time collaboration and communication.
              </p>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>✓ Real-time sync</li>
                <li>✓ Unread counts</li>
                <li>✓ User search</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-blue-100 mb-6">Join the Dev Space community and start collaborating today.</p>
          <p className="text-blue-200 text-sm mb-6">Created by King Jethro - A developer passionate about community and collaboration</p>
          <Link href="/feed">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              Go to Feed
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
