# Production Task List

> Use the checkboxes to track progress. Click a box in a markdown editor or GitHub to mark a task complete.

[➕ Add task](#add-task)

## Clubs
- [ ] Finish admin-only club member management and president role assignment
- [ ] Remove the public "Join Club" button/UI from club detail pages
- [ ] Confirm seeded `mitaoeClubs` are merged with DB clubs on the clubs listing page
- [ ] Ensure official seeded club detail pages display correctly with member counts
- [ ] Add regression tests for club listing, club detail, and club membership workflows

## Admin
- [ ] Restrict club president allocation so only website admins can assign roles
- [ ] Validate admin-only access for `/admin/clubs` and related club member actions
- [ ] Confirm admin club creation and deletion flows work successfully

## Backend / Database
- [ ] Verify `club_members` Supabase RLS policies enforce admin-only role updates
- [ ] Clean up any unused or duplicate club service functions
- [ ] Confirm `clubs.service.ts` supports `getClubMembers`, `addClubMember`, `removeClubMember`, and `updateClubMemberRole`

## QA / Production Readiness
- [ ] Run a full production build and fix any compile or runtime warnings
- [ ] Run responsive and accessibility checks for club and admin pages
- [ ] Verify deployment configuration in `vercel.json` and required environment variables

## Add a new task
To add a new task, edit this file and add a new unchecked item under the appropriate section.

Example:
- [ ] New task description
