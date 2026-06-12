"use client"

import Link from "next/link"
import { UniversalNav } from "@/components/universal-nav"
// tech badges are used strategically in cards, not at the header
import { Button } from "@/components/ui/button"
import {
  Code2,
  BookOpen,
  Landmark,
  Database,
  ShieldCheck,
  FolderGit2,
  MessageSquare,
  Blocks,
  Bell,
  Search,
  Cpu,
  Cloud,
  Mail,
  Wrench,
  LineChart,
  KeyRound,
  RefreshCw,
  Bug,
  HardDrive,
  LifeBuoy,
  Languages,
  Globe,
  Server,
  Rocket,
  Sparkles,
  Lock,
} from "lucide-react"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <UniversalNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">Dev Space Documentation</h1>
          <p className="text-xl text-muted-foreground">Complete guide to using the Dev Space platform</p>
          <p className="text-sm text-muted-foreground mt-2">Built with ❤️ by <span className="text-blue-400 font-semibold">King Jethro</span> (<a href="https://github.com/kingjethro999" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">@kingjethro999</a>)</p>
        </div>


        <div className="relative grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6">
          {/* Fixed/Sticky Sidebar */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <nav className="bg-card border border-border rounded-lg p-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <span className="text-foreground font-semibold">Contents</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li><a className="text-muted-foreground hover:text-foreground" href="#introduction">Introduction</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#getting-started">Getting Started</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#architecture">Architecture</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#data-model">Data Model</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#auth">Authentication</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#projects">Projects</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#discussions">Discussions</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#messaging">Messaging</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#notifications">Notifications</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#search">Search</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#realtime">Realtime</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#media">Media & Cloudinary</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#email-system">Email System</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#admin">Admin Guide</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#performance">Performance</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#security">Security</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#api-reference">API Reference</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#webhooks">Webhooks</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#configuration">Configuration</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#env">Environment Variables</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#feature-flags">Feature Flags</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#moderation">Moderation Policy</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#privacy">Data Retention & Privacy</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#backup-restore">Backup & Restore</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#github-integration">GitHub Integration</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#email-templates">Email Templates</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#analytics-glossary">Analytics Glossary</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#troubleshooting">Troubleshooting</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#testing">Testing Guide</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#accessibility">Accessibility (a11y)</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#i18n">Internationalization (i18n)</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#seo">SEO & Metadata</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#contributing">Contributing</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#faq">FAQ</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#roadmap">Roadmap</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#glossary">Glossary</a></li>
              </ul>
            </nav>
          </aside>

          {/* Content */}
          <article className="space-y-10">
            <section id="introduction" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3">Introduction</h2>
              <p className="text-muted-foreground mb-3">Dev Space is a developer-first collaboration platform that unifies project management, community discussions, messaging, and realtime engagement into a single, cohesive experience. It empowers developers to showcase work, collaborate with teams, and grow communities around shared interests.</p>
              <p className="text-muted-foreground">This documentation explains the platform’s concepts, architecture, and usage patterns. Whether you are a user, an admin, or a contributor, you will find clear guidance on how to get the most out of Dev Space.</p>
            </section>

            <section id="getting-started" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3">Getting Started</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>Create an account via Email/Password, GitHub, or Google.</li>
                <li>Complete your profile with skills, bio, and links.</li>
                <li>Create your first project and connect a GitHub repository.</li>
                <li>Invite collaborators and set roles.</li>
                <li>Join discussions, message peers, and enable notifications.</li>
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/auth/signup"><Button>Sign Up</Button></Link>
                <Link href="/discover"><Button variant="secondary">Discover Projects</Button></Link>
              </div>
            </section>

            <section id="architecture" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Landmark className="w-5 h-5 text-blue-400" /> Architecture</h2>
              <p className="text-muted-foreground mb-3">Dev Space uses Next.js App Router with React 19 and TypeScript. Firebase powers authentication, Firestore, Realtime Database, and Storage. Cloudinary handles advanced media workflows. The architecture emphasizes realtime features, client performance, and developer ergonomics.</p>
              <ul className="text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Frontend</strong>: Next.js 16, React 19, Tailwind, Radix UI, Lucide.</li>
                <li><strong className="text-foreground">Auth</strong>: Firebase Auth with OAuth providers.</li>
                <li><strong className="text-foreground">Data</strong>: Firestore (documents), Realtime DB (presence, chat), Storage (media).</li>
                <li><strong className="text-foreground">Media</strong>: Cloudinary for uploads, transformations, and optimization.</li>
                <li><strong className="text-foreground">Email</strong>: Gmail SMTP via Nodemailer.</li>
              </ul>
            </section>

            <section id="data-model" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Database className="w-5 h-5 text-cyan-400" /> Data Model</h2>
              <p className="text-muted-foreground mb-3">Core collections include users, projects, discussions, messages, and activities. Realtime structures track presence, typing, and unread counts. All data is designed around least privilege, with server rules layered for safety.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/40 border border-border/60 rounded p-4">
                  <h3 className="text-foreground font-semibold mb-2">Users</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Profile, skills, bio</li>
                    <li>Followers and collaborations</li>
                    <li>Notification preferences</li>
                  </ul>
              </div>
                <div className="bg-muted/40 border border-border/60 rounded p-4">
                  <h3 className="text-foreground font-semibold mb-2">Projects</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>GitHub integration</li>
                    <li>Tasks, milestones, reviews</li>
                    <li>Collaborators and roles</li>
                  </ul>
              </div>
                <div className="bg-muted/40 border border-border/60 rounded p-4">
                  <h3 className="text-foreground font-semibold mb-2">Discussions</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Threads, categories, tags</li>
                    <li>Realtime comments</li>
                    <li>Moderation signals</li>
                  </ul>
            </div>
                <div className="bg-muted/40 border border-border/60 rounded p-4">
                  <h3 className="text-foreground font-semibold mb-2">Messaging</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Direct messages & read receipts</li>
                    <li>Typing indicators</li>
                    <li>Presence & unread counts</li>
                  </ul>
            </div>
              </div>
            </section>

            <section id="auth" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" /> Authentication</h2>
              <p className="text-muted-foreground mb-3">Sign-in methods: Email/Password, Google OAuth, GitHub OAuth. Sessions are managed via Firebase Auth; client components read from a centralized context at <code className="text-xs px-1 py-0.5 bg-slate-800 rounded">lib/auth-context.tsx</code>.</p>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Protect routes using middleware and client guards.</li>
                <li>Restrict admin pages to platform owners.</li>
                <li>Store minimal PII; prefer provider data.</li>
              </ul>
            </section>

            <section id="projects" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><FolderGit2 className="w-5 h-5 text-cyan-400" /> Projects</h2>
              <p className="text-muted-foreground mb-3">Projects unify code, tasks, collaborators, and reviews. GitHub integrations surface repo info, collaborators, and PR review workflows. You can control visibility and invite teammates.</p>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Task and milestone tracking out-of-the-box.</li>
                <li>Reviews with threaded comments.</li>
                <li>Collaboration roles: owner, maintainer, contributor, viewer.</li>
              </ul>
              <div className="mt-3"><Link href="/projects"><Button>Browse Projects</Button></Link></div>
            </section>

            <section id="discussions" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-indigo-400" /> Discussions</h2>
              <p className="text-muted-foreground mb-3">Discussion boards support categories, tags, rich text, and realtime replies. Moderation tools integrate with the admin suite to keep conversations healthy and productive.</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/discussions"><Button variant="secondary">All Discussions</Button></Link>
                <Link href="/discussions/new"><Button>Start a Thread</Button></Link>
              </div>
            </section>

            <section id="messaging" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Blocks className="w-5 h-5 text-pink-400" /> Messaging</h2>
              <p className="text-muted-foreground mb-3">Direct messaging is realtime with typing indicators, read receipts, and presence. Conversations are optimized for low latency using Firebase Realtime Database.</p>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Unread badge counts and per-thread states.</li>
                <li>Optimistic UI for fast interactions.</li>
                <li>Profile discovery to find people quickly.</li>
              </ul>
            </section>

            <section id="notifications" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Bell className="w-5 h-5 text-amber-400" /> Notifications</h2>
              <p className="text-muted-foreground">Notifications are routed in-app and via email depending on user preferences. The system de-duplicates spammy events and batches where necessary for deliverability.</p>
            </section>

            <section id="search" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Search className="w-5 h-5 text-sky-400" /> Search</h2>
              <p className="text-muted-foreground">Global search indexes projects, discussions, and users with debounced queries, pagination, and caching to ensure fast, relevant results.</p>
            </section>

            <section id="realtime" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Cpu className="w-5 h-5 text-lime-400" /> Realtime</h2>
              <p className="text-muted-foreground">Live updates power activity feeds, messages, and notifications. We rely on Firestore listeners and Realtime Database channels to deliver instant, resilient updates.</p>
            </section>

            <section id="media" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Cloud className="w-5 h-5 text-teal-400" /> Media & Cloudinary</h2>
              <p className="text-muted-foreground mb-3">Images and attachments are uploaded to Cloudinary, transformed on-the-fly, and delivered via CDN. This keeps the app fast and media beautiful across devices.</p>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Responsive images and placeholders.</li>
                <li>Video support with previews.</li>
                <li>Strict validation for file types and size.</li>
              </ul>
            </section>

            <section id="email-system" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Mail className="w-5 h-5 text-purple-400" /> Email System</h2>
              <p className="text-muted-foreground mb-3">We use Gmail SMTP via Nodemailer with professional branded templates. Emails include welcomes, re-engagements, and notifications.</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/api/send-email"><Button variant="secondary">Send Test Email</Button></Link>
                <Link href="#admin"><Button>Admin Broadcasting</Button></Link>
              </div>
            </section>

            <section id="admin" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Wrench className="w-5 h-5 text-rose-400" /> Admin Guide</h2>
              <p className="text-muted-foreground mb-3">Admins manage users, projects, content, and platform-wide settings. The Admin dashboard provides quick access to moderation tools, feature flags, announcements, and performance analytics.</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/admin"><Button>Open Admin Dashboard</Button></Link>
                <Link href="/admin/performance"><Button variant="secondary">Performance Analytics</Button></Link>
              </div>
            </section>

            <section id="performance" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><LineChart className="w-5 h-5 text-amber-300" /> Performance & Caching</h2>
              <p className="text-muted-foreground mb-3">We use in-memory caching, Firestore query memoization, and incremental rendering for speed. Images and static assets are optimized. Search is debounced and paginated. Realtime channels are scoped to minimize over-subscribing.</p>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Code splitting and route prefetching.</li>
                <li>Lazy-loaded heavy components.</li>
                <li>TTL-based caches for hot paths.</li>
              </ul>
            </section>

            <section id="security" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" /> Security</h2>
              <p className="text-muted-foreground mb-3">We apply the principle of least privilege, validate inputs, and enforce server-side security rules. Admin capabilities are restricted to the platform owner and sensitive routes are guarded.</p>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Role-based UI and server validation.</li>
                <li>Sanitization for user-generated content.</li>
                <li>Audit trails for admin actions (where applicable).</li>
              </ul>
            </section>

            <section id="configuration" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Wrench className="w-5 h-5 text-yellow-400" /> Configuration</h2>
              <p className="text-muted-foreground mb-3">Dev Space is configurable via environment variables and feature flags. Use separate Firebase projects per environment and isolate credentials per deployment target.</p>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Production, Staging, Development environments</li>
                <li>Per-env Firebase credentials for Auth, Firestore, Realtime DB, Storage</li>
                <li>Email provider credentials and rate limiting</li>
              </ul>
            </section>

            <section id="env" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><KeyRound className="w-5 h-5 text-blue-400" /> Environment Variables</h2>
              <p className="text-muted-foreground mb-3">Set these in your hosting provider securely. Never commit secrets to the repository.</p>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                <li>FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_DATABASE_URL, FIREBASE_PROJECT_ID</li>
                <li>FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID, FIREBASE_MEASUREMENT_ID</li>
                <li>SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD</li>
                <li>CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET</li>
              </ul>
            </section>

            <section id="feature-flags" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Wrench className="w-5 h-5 text-rose-400" /> Feature Flags</h2>
              <p className="text-muted-foreground">Use Firestore documents or a config service to toggle experimental features safely without redeploys.</p>
            </section>

            <section id="moderation" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Lock className="w-5 h-5 text-red-400" /> Moderation Policy</h2>
              <p className="text-muted-foreground mb-3">Community safety is non-negotiable. Content that violates guidelines may be hidden or removed and repeat offenders restricted.</p>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Report, review, escalate flows for content and users</li>
                <li>Graduated enforcement: warnings, temporary restrictions, suspension</li>
                <li>Appeal mechanisms and transparent communication</li>
              </ul>
            </section>

            <section id="privacy" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" /> Data Retention & Privacy</h2>
              <p className="text-muted-foreground mb-3">We collect minimal data necessary to operate the platform and provide export/delete options where feasible.</p>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Retention periods per collection (activities, messages, notifications)</li>
                <li>Data export upon verified request (progressive rollout)</li>
                <li>Deletion routines honoring cascades and privacy</li>
              </ul>
            </section>

            <section id="backup-restore" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-cyan-400" /> Backup & Restore</h2>
              <p className="text-muted-foreground mb-3">Schedule periodic backups of Firestore and Storage. Keep at least one offsite replica and test restores routinely.</p>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Nightly exports for Firestore (collections with indexes preserved)</li>
                <li>Media lifecycle rules and object versioning for Storage</li>
                <li>Disaster recovery drills and documented RTO/RPO targets</li>
              </ul>
            </section>

            <section id="github-integration" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><FolderGit2 className="w-5 h-5 text-cyan-400" /> GitHub Integration</h2>
              <p className="text-muted-foreground mb-3">Connect repositories to projects, sync collaborators, and surface review workflows inside Dev Space.</p>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Auth via GitHub OAuth; limited scope tokens</li>
                <li>Sync collaborators on schedule and on-demand triggers</li>
                <li>Display repo metadata and link PRs to reviews</li>
              </ul>
            </section>

            <section id="email-templates" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Mail className="w-5 h-5 text-purple-400" /> Email Templates</h2>
              <p className="text-muted-foreground mb-3">A catalog of branded templates for lifecycle and notification emails.</p>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Welcome, Onboarding Nudge, Weekly Highlights</li>
                <li>Re-engagement, Security Alert, Mention/Message</li>
                <li>Project Updates and Release Notes</li>
              </ul>
            </section>

            <section id="analytics-glossary" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><LineChart className="w-5 h-5 text-amber-300" /> Analytics Glossary</h2>
              <p className="text-muted-foreground">Definitions for metrics like DAU/WAU/MAU, retention, activity velocities, and engagement rates to aid consistent interpretation.</p>
            </section>

            <section id="troubleshooting" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Bug className="w-5 h-5 text-red-400" /> Troubleshooting</h2>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Auth failures: verify OAuth credentials and redirect URIs</li>
                <li>Firestore permission denied: re-check security rules and user roles</li>
                <li>Emails not sending: inspect SMTP logs and template variables</li>
              </ul>
            </section>

            <section id="testing" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><HardDrive className="w-5 h-5 text-sky-400" /> Testing Guide</h2>
              <p className="text-muted-foreground">Adopt component testing for UI, integration tests for Firestore/Realtime read/write flows, and contract tests for API routes.</p>
            </section>

            <section id="accessibility" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><LifeBuoy className="w-5 h-5 text-teal-400" /> Accessibility (a11y)</h2>
              <p className="text-muted-foreground">Radix UI provides accessible primitives. Maintain proper labels, roles, focus management, and contrast ratios.</p>
            </section>

            <section id="i18n" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Languages className="w-5 h-5 text-indigo-400" /> Internationalization (i18n)</h2>
              <p className="text-muted-foreground">Architect your content for translation readiness. Avoid hard-coded strings in business logic and prefer message catalogs.</p>
            </section>

            <section id="seo" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Globe className="w-5 h-5 text-green-400" /> SEO & Metadata</h2>
              <p className="text-muted-foreground">Use Next.js metadata APIs for titles and Open Graph tags. Ensure clean URLs and structured data where applicable.</p>
            </section>

            <section id="api-reference" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Server className="w-5 h-5 text-blue-400" /> API Reference</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/40 border border-border/60 rounded p-4">
                  <h3 className="text-foreground font-semibold mb-2">Authentication</h3>
                  <p className="text-sm text-muted-foreground">OAuth login, session management, and profile endpoints.</p>
                </div>
                <div className="bg-muted/40 border border-border/60 rounded p-4">
                  <h3 className="text-foreground font-semibold mb-2">Projects</h3>
                  <p className="text-sm text-muted-foreground">Create/update projects, collaborators, tasks, and milestones.</p>
                </div>
                <div className="bg-muted/40 border border-border/60 rounded p-4">
                  <h3 className="text-foreground font-semibold mb-2">Discussions</h3>
                  <p className="text-sm text-muted-foreground">Threads, categories, tags, and moderation hooks.</p>
                </div>
                <div className="bg-muted/40 border border-border/60 rounded p-4">
                  <h3 className="text-foreground font-semibold mb-2">Messaging</h3>
                  <p className="text-sm text-muted-foreground">Realtime messaging, typing, receipts, and presence.</p>
            </div>
          </div>
            </section>

            <section id="webhooks" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Rocket className="w-5 h-5 text-fuchsia-400" /> Webhooks & Integrations</h2>
              <p className="text-muted-foreground">Connect external systems to receive events about projects, discussions, and user activity. Rate-limited and signed for authenticity.</p>
            </section>

            <section id="contributing" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-300" /> Contributing</h2>
              <p className="text-muted-foreground">We welcome contributions that improve performance, accessibility, or developer experience. Follow the style guide and submit focused PRs with tests where applicable.</p>
            </section>

            <section id="faq" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3">FAQ</h2>
              <div className="space-y-3">
                <details className="bg-muted/40 border border-border/60 rounded p-4">
                  <summary className="cursor-pointer text-foreground font-semibold">Is Dev Space free?</summary>
                  <p className="text-muted-foreground mt-2">Yes. Future premium features will remain optional and non-intrusive.</p>
                </details>
                <details className="bg-muted/40 border border-border/60 rounded p-4">
                  <summary className="cursor-pointer text-foreground font-semibold">How do I report abuse?</summary>
                  <p className="text-muted-foreground mt-2">Use the report buttons on content or contact admins. Reports are triaged in the Admin dashboard.</p>
                </details>
                <details className="bg-muted/40 border border-border/60 rounded p-4">
                  <summary className="cursor-pointer text-foreground font-semibold">Can I export my data?</summary>
                  <p className="text-muted-foreground mt-2">Yes. Data export tools are being rolled out per collection with privacy-first design.</p>
                </details>
        </div>
            </section>

            <section id="roadmap" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3">Roadmap</h2>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Advanced analytics for projects and communities.</li>
                <li>Automation hooks for CI notifications.</li>
                <li>Expanded moderation tooling and audit logs.</li>
                <li>Integrations with more code hosting providers.</li>
              </ul>
            </section>

            <section id="glossary" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-3">Glossary</h2>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Activity: An event representing a user action in the platform.</li>
                <li>Conversation: A direct messaging thread between two users.</li>
                <li>Milestone: A grouping of tasks and progress markers for a project.</li>
              </ul>
            </section>

            <section className="rounded-lg p-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Start Building</h2>
              <p className="text-blue-100 mb-4">Join the Dev Space community and create something remarkable.</p>
              <Link href="/discover"><Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">Discover</Button></Link>
            </section>
          </article>
        </div>
      </main>
    </div>
  )
}
