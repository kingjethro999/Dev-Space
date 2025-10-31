"use client"

import { useEffect, useMemo, useState, useContext } from "react"
import { useRouter } from "next/navigation"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Home, Search, Folder, User, BookOpen, LayoutGrid, Cog } from "lucide-react"
import { AuthContext } from "@/lib/auth-context"

function isTypingInTextField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName?.toLowerCase()
  const editable = target.getAttribute("contenteditable")
  return tag === "input" || tag === "textarea" || editable === "" || editable === "true"
}

export function QuickNavigator() {
  const router = useRouter()
  const authContext = useContext(AuthContext)
  const user = authContext?.user || null
  const [open, setOpen] = useState(false)
  
  // Handle case where AuthContext is undefined (outside provider)
  if (!authContext) {
    return null
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingInTextField(e.target)) return
      // F or / to open
      if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key.toLowerCase() === "f" || e.key === "/")) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const go = (path: string) => {
    setOpen(false)
    router.push(path)
  }

  // For @profile/ default, fall back to setup if no user
  const profilePath = useMemo(() => {
    if (user?.uid) return `/profile/${user.uid}`
    return "/profile/setup"
  }, [user?.uid])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder="Type to search or use @section (e.g. @projects)" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Quick Navigation">
            <CommandItem onSelect={() => go("/")}> 
              <Home className="mr-2 h-4 w-4" /> Home
            </CommandItem>
            <CommandItem onSelect={() => go("/search")}> 
              <Search className="mr-2 h-4 w-4" /> Search
            </CommandItem>
            <CommandItem onSelect={() => go("/projects")}> 
              <LayoutGrid className="mr-2 h-4 w-4" /> Projects
            </CommandItem>
            <CommandItem onSelect={() => go("/admin")}> 
              <Cog className="mr-2 h-4 w-4" /> Admin
            </CommandItem>
            <CommandItem onSelect={() => go(profilePath)}> 
              <User className="mr-2 h-4 w-4" /> Profile
            </CommandItem>
            <CommandItem onSelect={() => go("/docs")}> 
              <BookOpen className="mr-2 h-4 w-4" /> Docs
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Sections">
            <CommandItem onSelect={() => go("/search?q=@components")}> 
              <Folder className="mr-2 h-4 w-4" /> @components/
            </CommandItem>
            <CommandItem onSelect={() => go("/admin")}> 
              <Folder className="mr-2 h-4 w-4" /> @admin/
            </CommandItem>
            <CommandItem onSelect={() => go(profilePath)}> 
              <Folder className="mr-2 h-4 w-4" /> @profile/
            </CommandItem>
            <CommandItem onSelect={() => go("/projects")}> 
              <Folder className="mr-2 h-4 w-4" /> @projects/
            </CommandItem>
            <CommandItem onSelect={() => go("/docs")}> 
              <Folder className="mr-2 h-4 w-4" /> @docs/
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}


