# Production Task List

> Note: This is a static Markdown task tracker. To mark a task complete, change `- [ ]` to `- [x]`.

## Priority Development Tasks

- [ ] TASK 01
- [ ] TASK 02
- [ ] TASK 03

## Notification System Redesign

- [x] Migrate notification architecture to track unread messages by channel (via `last_read_at`)
- [x] Restrict database-persisted notifications strictly to `@mentions`, admin announcements, and direct user alerts
- [x] Build an In-App Notification Center UI to view and manage targeted alerts
- [x] Implement real-time unread badges for channels in the navigation sidebar
- [x] Add user preferences to individually mute/unmute specific channels
- [x] Implement inline autocomplete for `@mentions` and `@everyone` in the chat composer
- [ ] **Pending:** Implement Web Push API backend integration (VAPID keys) to deliver Push Notifications when the browser tab/mobile app is closed
- [ ] **Pending:** Add notification grouping and digest summaries for highly active channels

## Communication & Channels

- [ ] Finalize taxonomy for department-wise, year-wise, and division-wise channels
- [ ] Create automated provisioning for subject-specific channels per semester
- [ ] Configure dedicated channels for placements, notices, and academic announcements
- [x] Implement message reply functionality
- [ ] Implement message edit and delete support
- [x] Implement unread message count per channel
- [x] Add `@mention` support to alert specific users
- [ ] Implement pinned messages
- [ ] Implement announcement-only mode for official channels (admin/faculty only)
- [ ] Implement threaded discussions (replies within a thread panel)
- [ ] Develop a centralized file repository UI for channel media/documents
- [ ] Build global and channel-scoped message search functionality
- [x] Add starred messages feature
- [x] Add emoji reactions to messages

## Academic Learning Module

- [x] Build dedicated Learning / Courses section
- [ ] Curate first-year engineering bridge courses
- [ ] Author Programming Fundamentals learning module
- [ ] Author Engineering Mathematics learning resources
- [ ] Author Physics and Electronics fundamentals module
- [ ] Track and visualize student course progress
- [x] Design and implement automated certificate generation
- [ ] Implement digital achievement badges for course milestones
- [x] Enable certificate PDF download and cryptographic verification

## Events & Clubs

- [ ] Develop centralized Events module for campus scheduling
- [ ] Build event RSVP and registration workflows
- [ ] Implement automated event reminders via the Notification System
- [ ] Finalize official clubs directory with achievements and media galleries
- [ ] Develop club recruitment and membership approval workflows
- [ ] Display historical timelines of club activities
- [x] Integrate official MITAOE club information and branding assets

## Administration & Moderation

- [x] Finalize Role-Based Access Control (RBAC) schemas (Student / Professor / CR / Admin)
- [x] Build centralized admin dashboard for platform management
- [ ] Develop admin CMS for channels, events, clubs, and courses
- [ ] Implement user directory and role assignment workflows
- [ ] Develop community moderation tools (message deletion, user bans)

## Backend / Database

- [ ] Audit and optimize Supabase Row Level Security (RLS) policies
- [ ] Validate secure access controls for channel messages and cloud storage assets
- [ ] Optimize real-time subscriptions to reduce concurrent connections
- [ ] Deprecate and remove redundant backend services/functions
- [ ] Review storage bucket MIME-type restrictions and upload limits
- [ ] Define composite database indexes for performance-critical queries

## Performance & Scalability

- [ ] Optimize React rendering and reduce interaction latency (React Compiler/Memoization)
- [ ] Implement optimistic UI updates for all messaging actions
- [ ] Implement infinite scroll / cursor-based pagination for message histories
- [ ] Optimize Next.js bundle size and asset delivery
- [ ] Conduct load testing simulating 3000+ concurrent users
- [ ] Validate real-time scaling limits and fallback polling mechanisms

## Security

- [ ] Restrict OAuth/Email access exclusively to official MITAOE email domains
- [ ] Audit session management and token lifecycle
- [ ] Implement strict server-side validation to prevent role escalation
- [ ] Conduct comprehensive security audit of all active RLS policies
- [ ] Implement audit logging for destructive administrative actions

## QA / Production Readiness

- [ ] Achieve a zero-error production build (`next build`)
- [ ] Conduct comprehensive cross-browser and mobile-responsive QA
- [ ] Perform accessibility (a11y) audits
- [ ] Validate edge-cases in the authentication state machine
- [ ] End-to-end testing of the chat, file upload, and realtime socket lifecycle
- [ ] End-to-end testing of the LMS (courses, modules, certificates)
- [ ] Verify Vercel production environment variables and edge configurations
- [ ] Prepare rollback plans for stable production release

## Documentation

- [ ] Rewrite `README.md` to reflect the latest architecture and tech stack
- [x] Create comprehensive `CONTRIBUTING.md` for team onboarding
- [ ] Generate detailed database ERD (Entity-Relationship Diagram) documentation
- [ ] Write user guides for the Admin Panel operations
- [ ] Document the Vercel deployment pipeline and Supabase environment setup

## Future Enhancements (Post-MVP)

- [ ] AI-powered chat summarization and topic extraction
- [ ] Smart notification routing (AI-based priority filtering)
- [ ] AI-assisted academic resource recommendations
- [ ] Personalized widget-based student dashboard
- [ ] Package web app into PWA and native Android wrapper (Capacitor/React Native)
- [ ] Granular analytics dashboard tracking engagement for faculty
