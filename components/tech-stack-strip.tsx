"use client"

import React from "react"

const DEFAULT_KEYS = [
  "html","css","js","ts","nextjs","react","nodejs","postgres","mongodb","firebase","docker","git","github","tailwind","vercel"
]

const skillToIconKey: Record<string, string> = {
  // Languages
  javascript: "js",
  typescript: "ts",
  python: "py",
  java: "java",
  c: "c",
  "c++": "cpp",
  "c#": "cs",
  php: "php",
  kotlin: "kotlin",
  // Frontend
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
  "tailwindcss": "tailwind",
  threejs: "threejs",
  // Backend/DB
  node: "nodejs",
  "node.js": "nodejs",
  express: "express",
  postgres: "postgres",
  postgresql: "postgres",
  mysql: "mysql",
  mariadb: "mariadb",
  mongodb: "mongodb",
  prisma: "prisma",
  // DevOps/Cloud
  docker: "docker",
  vercel: "vercel",
  netlify: "netlify",
  firebase: "firebase",
  gcp: "gcp",
  // Tools
  git: "git",
  github: "github",
  bash: "bash",
  linux: "linux",
  figma: "figma",
}

function toIconKey(skill: string): string | null {
  const k = skill.trim().toLowerCase()
  if (skillToIconKey[k]) return skillToIconKey[k]
  // attempts
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

export function TechStackStrip({ skills, className }: { skills?: string[]; className?: string }) {
  const keys = (skills && skills.length > 0
    ? Array.from(new Set(skills.map(toIconKey).filter(Boolean))) as string[]
    : DEFAULT_KEYS)

  const src = `https://skillicons.dev/icons?i=${keys.join(",")}`

  return (
    <div className={`w-full overflow-x-auto py-3 ${className || ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="tech stack" className="h-10" />
    </div>
  )
}

export default TechStackStrip
