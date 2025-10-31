/**
 * Utilities for handling mentions with user ID mapping
 * Stores @username in text, maintains userId mapping separately
 */

export interface MentionData {
  [username: string]: string // Maps @username -> userId
}

/**
 * Extract all @mentions from text
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@([A-Za-z0-9_\s]+?)(?=\s|$|,|\.|!|\?|;|:|\n)/g
  const mentions: string[] = []
  let match: RegExpExecArray | null

  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1].trim()
    if (!mentions.includes(username)) {
      mentions.push(username)
    }
  }

  return mentions
}

/**
 * Get userId for a username from mention data
 */
export function getUserIdFromMention(username: string, mentionData: MentionData): string | null {
  return mentionData[username] || null
}

