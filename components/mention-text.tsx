"use client"

interface MentionTextProps {
  text: string
  className?: string
}

export function MentionText({ text, className }: MentionTextProps) {
  // Simple mention renderer - renders @mentions with special styling
  const renderMentions = () => {
    const parts = text.split(/(@\w+)/g)
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-primary font-medium">
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return <span className={className}>{renderMentions()}</span>
}

