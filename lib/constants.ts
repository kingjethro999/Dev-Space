export const TECH_FILTERS = Array.from(new Set([
    // Languages
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Dart", "HTML", "CSS", "Bash",
    // Frontend
    "React", "Next.js", "Vue.js", "Angular", "Svelte", "Tailwind CSS", "Three.js", "React Native", "Flutter",
    // Backend
    "Node.js", "Express", "NestJS", "Django", "Flask", "Spring Boot", "Laravel", "Ruby on Rails", "FastAPI",
    // Databases
    "PostgreSQL", "MongoDB", "MySQL", "Redis", "SQLite", "Supabase", "Firebase", "Prisma",
    // DevOps & Cloud
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Vercel", "Netlify", "GitHub Actions",
    // Tools
    "Git", "Figma", "Linux",
])).sort((a, b) => a.localeCompare(b));
