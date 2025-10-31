"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { debounce } from "@/lib/cache-utils"
import { Search } from "lucide-react"

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const router = useRouter()

  const debouncedSearch = debounce(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSuggestions([])
      return
    }

    // Mock suggestions - in production, fetch from API
    const mockSuggestions = [
      `${searchTerm} projects`,
      `${searchTerm} discussions`,
      `developers with ${searchTerm} skills`,
    ]
    setSuggestions(mockSuggestions)
  }, 300)

  useEffect(() => {
    debouncedSearch(query)
  }, [query])

  const handleSearch = (e: React.FormEvent, searchTerm?: string) => {
    e.preventDefault()
    const finalQuery = searchTerm || query
    if (finalQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(finalQuery)}`)
      setSuggestions([])
      setShowSuggestions(false)
      setQuery("")
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search projects, discussions..."
            className="flex-1 pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400"
          />
        </div>
        {/* <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
          Search
        </Button> */}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-50">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={(e) => handleSearch(e, suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-sm first:rounded-t-lg last:rounded-b-lg"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </form>
  )
}
