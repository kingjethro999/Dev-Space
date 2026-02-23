"use client"

import { Input } from "@/components/ui/input"
import { forwardRef } from "react"

interface MentionAutocompleteProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const MentionAutocomplete = forwardRef<HTMLInputElement, MentionAutocompleteProps>(
  ({ value, onChange, className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        {...props}
      />
    )
  }
)

MentionAutocomplete.displayName = "MentionAutocomplete"

