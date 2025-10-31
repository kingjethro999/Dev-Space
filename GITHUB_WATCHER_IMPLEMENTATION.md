# GitHub Commit Watcher Implementation

## Overview
This implementation adds automatic GitHub repository commit monitoring with email notifications and a seamless journey logging workflow.

## Features Implemented

### 1. GitHub Commit Monitor Cron Job
**Location:** `app/api/cron/github-commit-monitor/route.ts`

- Monitors all projects with GitHub repositories
- Checks for new commits every 15 minutes
- Tracks last processed commit to avoid duplicates
- Sends in-app notifications to project owners
- Sends email notifications with prefilled journey link

### 2. Email Notification Template
**Location:** `lib/mail-utils.ts`

Beautiful HTML email template includes:
- Commit details (message, author, GitHub link)
- Call-to-action button to log commit to journey
- Prefilled URL with all commit details as query params

### 3. Journey Entry Form with URL Parameters
**Location:** `app/projects/[id]/journey/new/page.tsx`

- Accepts URL parameters: `commitSha`, `commitMessage`, `commitUrl`, `repoName`
- Auto-prefills form with commit information
- Toast notification when commit data is loaded
- Seamless integration with existing journey entry form

### 4. Toast Notifications
**Location:** `components/ui/toaster.tsx`, `app/layout.tsx`

- Added Toaster component to root layout
- Toast notifications for successful/error operations
- Fixed auto-dismiss timing (5 seconds instead of 1 million)
- Toast display for commit loading confirmation

### 5. Supporting Components
- `components/mention-autocomplete.tsx` - Stub component for mentions
- `components/mention-text.tsx` - Simple mention renderer
- Updated `components/journey-entry-form.tsx` with toast notifications

### 6. Vercel Cron Configuration
**Location:** `vercel.json`

Scheduled jobs:
```json
{
  "github-collaborators": "Every 6 hours",
  "github-commit-monitor": "Every 15 minutes",
  "journey-reminders": "Every Monday at 9 AM"
}
```

## Workflow

### 1. Commit Detection
1. Cron job runs every 15 minutes
2. Fetches all projects with GitHub URLs
3. For each project, checks for new commits since last check
4. Uses GitHub API with project owner's access token

### 2. Notification Delivery
For each new commit:
1. Creates in-app notification
2. Sends email to project owner
3. Email includes:
   - Repository name
   - Commit message
   - Commit author
   - Direct link to GitHub commit
   - Prefilled journey logging link

### 3. Journey Logging
1. User clicks email link
2. Redirected to: `/projects/{projectId}/journey/new?commitSha=...&commitMessage=...&commitUrl=...&repoName=...`
3. Form auto-loads commit details
4. User can:
   - Log with default commit message
   - Add additional context
   - Modify tags, skills, etc.
5. Toast notification confirms successful submission

## Email Template Sample

The email sent to users looks like this:

```
Subject: New Commit in {repoName} - Log it to your Journey?

Hi {username}! 👋

We noticed a commit in your {repoName} repository

Commit Author: {author}
Message: {commitMessage}

💡 In Dev-Space we believe no commit is too little or irrelevant, want to log it in?
Keep your users updated on your exciting journey

[Log Commit to Journey Button]

With ❤️ From the Dev Space Community
```

## Environment Variables Required

```bash
# Vercel Cron Jobs
CRON_SECRET=your-secret-key-here

# Email (already configured)
GMAIL_SMTP_USER=your-gmail@example.com
GMAIL_APP_PASSWORD=your-app-password

# App URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Database Collections Used

1. **github_watchers** - Tracks monitoring state per project
   - `projectId`
   - `githubUrl`
   - `enabled`
   - `lastCommitSha`
   - `lastCheckedAt`

2. **notifications** - In-app notifications
   - Standard notification fields
   - Type: 'project_update'

3. **journey_entries** - Journey entries
   - Supports new fields: `sourceRepoUrl`, `branchName`

## Security

- GitHub access tokens stored securely in Firestore
- Cron jobs protected with `CRON_SECRET` authentication
- Only project owners receive commit notifications
- Access controlled via existing authentication system

## Testing

### Manual Testing
1. Create a project with a GitHub URL
2. Make a commit to the repository
3. Wait for cron job to run (or trigger manually)
4. Check email inbox for notification
5. Click journey link
6. Verify form pre-fills correctly
7. Submit and verify journey entry created

### Cron Job Testing
```bash
# Test endpoint
curl -X GET "https://your-app.vercel.app/api/cron/github-commit-monitor" \
  -H "Authorization: Bearer your-cron-secret"
```

## Future Enhancements

1. GitHub Webhooks for instant notifications (avoid polling)
2. Watcher toggle UI in project settings
3. Filter commits by branch
4. Batch notifications for multiple commits
5. Commit diff preview in email
6. Customizable notification preferences
7. Integration with GitHub Actions

## Files Created

- `app/api/cron/github-commit-monitor/route.ts`
- `app/projects/[id]/journey/new/page.tsx`
- `components/mention-autocomplete.tsx`
- `components/mention-text.tsx`
- `vercel.json`
- `GITHUB_WATCHER_IMPLEMENTATION.md` (this file)

## Files Modified

- `lib/mail-utils.ts` - Added `sendCommitAlertEmail` function
- `app/layout.tsx` - Added Toaster component
- `hooks/use-toast.ts` - Fixed auto-dismiss timing
- `components/journey-entry-form.tsx` - Added toast notifications

## Deployment Notes

1. Set `CRON_SECRET` environment variable in Vercel
2. Ensure Vercel Cron Jobs are enabled
3. Test email delivery with real GitHub commits
4. Monitor cron job execution logs
5. Update `NEXT_PUBLIC_APP_URL` if different from production

## Monitoring

Check Vercel logs for:
- Cron job execution times
- GitHub API errors
- Email delivery failures
- Database write errors

## Support

For issues or questions:
- Check Vercel dashboard for cron execution logs
- Verify GitHub access tokens are valid
- Confirm email configuration is correct
- Review Firestore console for data integrity

