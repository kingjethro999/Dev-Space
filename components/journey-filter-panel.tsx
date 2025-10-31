"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { JourneyEntryType, JourneyMood, JourneyFilter } from "@/lib/journey-schema"
import { X } from "lucide-react"

interface JourneyFilterPanelProps {
  filters: JourneyFilter
  onFiltersChange: (filters: JourneyFilter) => void
  onClose?: () => void
}

export function JourneyFilterPanel({ filters, onFiltersChange, onClose }: JourneyFilterPanelProps) {
  const setFilter = <K extends keyof JourneyFilter>(key: K, value: JourneyFilter[K]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Filters</h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-2">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type */}
          <div>
            <Label>Entry Type</Label>
            <Select
              value={filters.type || ""}
              onValueChange={(v: string) => setFilter("type", v as JourneyEntryType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                {["ideation","learning","development","debugging","testing","deployment","collaboration","reflection","milestone","challenge","breakthrough","maintenance","scaling","community"].map(t => (
                  <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mood */}
          <div>
            <Label>Mood</Label>
            <Select
              value={filters.mood || ""}
              onValueChange={(v: string) => setFilter("mood", v as JourneyMood)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All moods" />
              </SelectTrigger>
              <SelectContent>
                {["excited","focused","frustrated","accomplished","stuck","inspired","tired","proud","confused","motivated","overwhelmed","satisfied","curious"].map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibility */}
          <div className="flex items-end">
            <div className="flex items-center space-x-2">
              <Switch
                id="milestones"
                checked={filters.isMilestone ?? false}
                onCheckedChange={(val) => setFilter("isMilestone", val)}
              />
              <Label htmlFor="milestones">Only milestones</Label>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags (comma separated)</Label>
          <Input
            placeholder="ui, performance, testing"
            value={(filters.tags || []).join(", ")}
            onChange={(e) => setFilter("tags", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
          />
        </div>
      </CardContent>
    </Card>
  )
}


