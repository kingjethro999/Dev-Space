"use client"

import React from "react"

const DEFAULT_STYLE = "px-2 py-1 rounded-md border border-border bg-muted/40 text-xs flex items-center gap-1"

const labelToKey: Record<string, string> = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  java: "java",
  c: "c",
  "c++": "cpp",
  "c#": "cs",
  php: "php",
  kotlin: "kotlin",
  html: "html",
  css: "css",
  react: "react",
  "react native": "react",
  next: "nextjs",
  "next.js": "nextjs",
  vue: "vue",
  "vue.js": "vue",
  angular: "angular",
  tailwind: "tailwind",
  tailwindcss: "tailwind",
  threejs: "threejs",
  node: "nodejs",
  "node.js": "nodejs",
  express: "express",
  postgres: "postgres",
  postgresql: "postgres",
  mysql: "mysql",
  mariadb: "mariadb",
  mongodb: "mongodb",
  prisma: "prisma",
  docker: "docker",
  vercel: "vercel",
  netlify: "netlify",
  firebase: "firebase",
  gcp: "gcp",
  git: "git",
  github: "github",
  bash: "bash",
  linux: "linux",
  figma: "figma",
}

function toKey(label: string): string | null {
  const k = label.trim().toLowerCase()
  if (labelToKey[k]) return labelToKey[k]
  if (k.includes("react")) return "react"
  if (k.includes("next")) return "nextjs"
  if (k.includes("tailwind")) return "tailwind"
  if (k.includes("node")) return "nodejs"
  if (k.includes("postgres")) return "postgres"
  if (k.includes("mongo")) return "mongodb"
  if (k.includes("firebase")) return "firebase"
  if (k.includes("docker")) return "docker"
  if (k.includes("git")) return "git"
  return null
}

export function TechBadgeList({ items, className, max }: { items: string[]; className?: string; max?: number }) {
  const visible = (max ? items.slice(0, max) : items).filter(Boolean)
  const extra = items.length - visible.length
  return (
    <div className={`flex flex-wrap gap-2 ${className || ""}`}>
      {visible.map((label) => {
        const key = toKey(label)
        const imgSrc = key ? `https://skillicons.dev/icons?i=${key}` : null
        return (
          <span key={label} className={DEFAULT_STYLE} title={label}>
            {imgSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgSrc} alt={label} className="w-4 h-4" />
            )}
            <span>{label}</span>
          </span>
        )
      })}
      {extra > 0 && (
        <span className={DEFAULT_STYLE}>+{extra}</span>
      )}
    </div>
  )
}

export default TechBadgeList
