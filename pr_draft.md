### PR Title
`feat(notifications): redesign architecture, add real-time unread badges, and implement mentions`

### PR Description
```markdown
## Overview
This PR completely redesigns the notification system to scale better for active channels. Instead of creating a database row for every single message sent, we now track unread states at the channel level and only create database notifications for direct alerts (like `@mentions`). 

It also adds native browser push notification support and an inline autocomplete system for mentioning users in chat.

## Changes Made
- **Database Architecture Shift:** Added `last_read_at` and `muted` columns to the `channel_members` table to track unread counts per channel using an upsert methodology.
- **Real-Time Sidebar Badges:** Created a `useUnreadBadges` hook that synchronizes unread message counts across all channels and displays real-time badges in the sidebar.
- **Channel Muting:** Users can now toggle "Mute Channel" in the Channel Info panel. Muting a channel suppresses its unread badge styles and prevents browser push notifications.
- **Inline `@mentions`:** Added an autocomplete dropdown inside the chat composer. Typing `@` suggests users in the channel.
- **`@everyone` Support:** Backend logic updated to detect `@everyone`. This skips targeted alerts and sends an 'Announcement' notification to all channel members.
- **Notification Center UI:** Updated the `NotificationsClient` to consume the new targeted notification database rows.
- **Web Push API (Service Worker):** Integrated a `sw.js` service worker and automatic permission requesting to lay the groundwork for offline/background push notifications on web and mobile wrapper apps.
- **Code Quality:** Refactored messy relative import paths (e.g., `../../../../backend`) across hooks and components to strictly use the `@/services/` alias.

## Checklist
- [x] Tested real-time badge updates and clearing logic
- [x] Tested `@mention` suggestion UI
- [x] Validated TypeScript compilation (`npx tsc --noEmit`)
- [x] Verified `last_read_at` properly updates upon reading channels

## Related Tasks
Closes Notification System Redesign tasks in `tasks.md`.
```