# Campus Buddy — Production Readiness Audit

_Prepared by the senior engineering review._
_Scope: full project at repo root (frontend, backend, database)._
_Date: 2026-07-07_

## ✅ Implementation status (this pass)

**Runtime-verified** (dev server booted clean, no console/compile errors): `/dashboard`
unauthenticated → `307 → /login` (middleware guard now live), `/manifest.webmanifest` → `200`
(after fixing the middleware matcher to exclude static PWA assets — found by running the app),
`/sw.js` → `200`, `/login` renders. `tsc` 0 errors; `next build` succeeds (25 routes).

**Done & build-verified** (`tsc` 0 errors, `next build` succeeds, middleware active):
- **P0 security:** DB-enforced year/department RBAC in RLS (`can_access_channel()`), wired `middleware.ts`,
  fixed duplicate/ missing policies, added `course_learning_status`, multi-emoji reactions.
- **P1 scale:** message pagination/infinite-scroll, upload size/MIME validation, server-side send
  rate-limiting, realtime reactions (replaced 10s polling).
- **P1 mobile:** `viewport-fit=cover`, `100dvh`, safe-area insets on the composer, reduced-motion a11y.
- **P2 features:** DB-synced starred (`bookmarks` table), presence/online count, typing indicators
  (both via Realtime, no schema cost).
- **Global search:** ⌘K command palette across channels/messages/people, injection-safe and RLS-scoped
  (`backend/services/search.service.ts`, `components/layout/GlobalSearch.tsx`).
- **Announcement-only channels:** `channels.post_policy` + `can_post_channel()` RLS so students can't
  post in official/notices channels (enforced in DB, composer replaced by a read-only banner, admin toggle).
- **Message reporting & moderation:** `message_reports` table + RLS, a Report action in the message
  context menu (reason dialog), and an admin review page (`/admin/moderation`) to dismiss / mark
  reviewed / delete, with an open-report badge on the admin dashboard.
- **Admin analytics dashboard:** `/admin/analytics` — stat tiles (users, messages, active senders,
  reports) + a messages-per-day SVG bar chart, users-by-role and busiest-channel bars. Backed by
  admin-guarded `SECURITY DEFINER` aggregation RPCs (no data leak to non-admins).
- **PWA:** installable web app manifest (`app/manifest.ts`) paired with the existing push service worker.
- **Web Push:** `push_subscriptions` table + RLS, `/api/push/{subscribe,unsubscribe,send}` (Node runtime,
  VAPID-signed via `web-push`), subscribe-on-load in `useNotifications`, and pushes fired from
  mention/announcement notifications. Sends are gated (content/target read from `notifications` rows,
  not client input). Needs `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` in env.
- **P3 cleanup:** fixed the TS error, `deleteAvatar` storage cleanup, consolidated SQL into one
  idempotent `schema.sql` (old migrations archived under `database/archive/`).

**⚠️ Required deploy step:** run `database/schema.sql` in the Supabase SQL Editor — the RLS enforcement,
rate limiting, `bookmarks`, and multi-emoji reactions only activate once it's applied.

**Still open (next phases):** per-message read receipts (dropped — expensive at scale, and channel-level
unread already covers 90%), threaded replies (deferred — invasive to the working chat client, and inline
quoted replies arguably fit a campus app better). See §4.

---

---

## 0. Executive Verdict

**Campus Buddy does not need to be rebuilt.** It is a genuinely mature Next.js 15 (App Router) +
Supabase + Tailwind application with a polished, feature-rich Channels module that already covers
most of the "WhatsApp-quality" checklist. Code hygiene is good (2 `console.log`s in the whole app,
1 TypeScript error total, cleanly decomposed components, strict types).

The gap between the current state and "production-ready for thousands of students" is **not breadth
of features** — it is **a small number of high-severity correctness/security holes**, plus polish on
mobile and a few missing data-backed features. The work is _targeted hardening_, not transformation.

> The project's own `DEPLOYMENT_AUDIT.md` already reaches the same conclusions independently
> (rate limiting, JWT role claims, storage limits, pagination). This audit confirms and prioritizes them
> with concrete file/line evidence.

---

## 1. Strengths — preserve as-is (do NOT rewrite)

| Area | Evidence | Status |
|---|---|---|
| **Chat client** | `frontend/app/(dashboard)/channels/[id]/ChannelPageClient.tsx` (994 lines) | Mature. Send, edit, delete, reply + preview, pin, star, reactions, @mentions w/ autocomplete + `@everyone`, polls, voice notes, file/image/audio upload, emoji picker, in-chat search, filters (media/docs/links/starred), media gallery, jump-to-message, mute, optimistic send. Keep. |
| **Component decomposition** | `frontend/components/channels/chat/*` (MessageList, MessageContextMenu, PollComponents, UIComponents, ChatFilters, ChannelInfoPanel) | Clean separation of concerns. Keep. |
| **Realtime** | `useMessages.ts`, `useChannels.ts` | Postgres-changes subscriptions for INSERT/UPDATE/DELETE on messages, reactions, channels. Works. Keep. |
| **Service layer** | `backend/services/*.ts` | Thin, readable Supabase query modules. Keep the shape. |
| **Type model** | `frontend/types/index.ts` (192 lines) | Strict, complete for current features. Keep. |
| **UI system** | `frontend/components/ui/*` (shadcn-style, 18 primitives), Tailwind CSS-var theming, dark mode + anti-FOUC script in `layout.tsx` | Solid, consistent. Keep. |
| **Branding** | `--primary: 230 57% 18%` (deep indigo), MITAOE identity | Keep. |
| **Layout responsiveness (partial)** | `DashboardShell.tsx` — mobile sidebar with backdrop overlay, full-bleed chat pages | Good foundation. Keep and extend. |

---

## 2. Weaknesses — ranked by severity, with evidence and fix

### 🔴 P0 — Security / correctness (must fix before real users)

**P0-1. Role-based access control is enforced only in the frontend.**
- Evidence: `database/schema.sql:263` — `messages_read` is `USING (TRUE)`; `channels_read`
  (`:247`) permits any non-private channel to any authenticated user. Year/department isolation
  exists only in `frontend/utils/channelVisibility.ts` and the server page guard
  (`channels/[id]/page.tsx:22`).
- Impact: **A logged-in student can query the Supabase API directly (anon key + their own session)
  and read every other year's and department's channels and messages.** The UI hides them; the
  database does not. Directly violates the stated requirement _"Never rely only on frontend filtering."_
- Fix: encode the year/department/membership rule into RLS `SELECT` policies on `channels` and
  `messages` (a channel is visible iff staff, OR user's `year`/`department` matches, OR explicit
  membership). Because you confirmed **a fresh schema is acceptable**, do this in a single
  authoritative `schema.sql` using a `SECURITY DEFINER` helper (e.g. `can_access_channel(channel_id)`)
  to avoid RLS recursion and keep policies fast. Frontend filtering stays as UX; RLS becomes the boundary.

**P0-2. Auth middleware is dead code — it never runs.**
- Evidence: `frontend/proxy.ts` is a complete Next.js middleware (auth redirects + admin route guard)
  but the file is named `proxy.ts`; Next only executes `middleware.ts`. Confirmed via
  `.next/.../middleware-manifest.json` → `"middleware": {}`. Nothing imports `proxy`.
- Impact: no edge-level auth redirect or admin-route gate. Mitigated by per-page `getUser()` guards
  (`admin/page.tsx` redirects non-admins), so it is a **defense-in-depth loss, not a wide-open door** —
  but unauthenticated users aren't redirected at the edge and it's fragile (any new page missing its
  guard is unprotected).
- Fix: rename/re-export as `frontend/middleware.ts` (keep the logic as-is). Verify it appears in the
  build manifest afterward.

**P0-3. `schema.sql` cannot be run cleanly as-is.**
- Evidence: `database/schema.sql:279–286` defines the `votes_read/insert/update` policies **twice**;
  the second `CREATE POLICY "votes_read"` errors ("policy already exists"). This is why a pile of
  ad-hoc migration files exist to patch around it.
- Fix (fresh-schema): consolidate everything into one idempotent `schema.sql`; delete the duplicate block.

**P0-4. Tables with RLS enabled but NO policy → default-deny.**
- Evidence: `notifications` and `club_members` have `ENABLE ROW LEVEL SECURITY` but no `CREATE POLICY`
  in `schema.sql`. With RLS on and no policy, all access is denied. The app reads/writes both heavily
  (notification center, club member counts). Either a policy was applied out-of-band on the live DB,
  or these silently return empty.
- Fix: add explicit policies (`notifications`: own-row read/update, insert by authenticated;
  `club_members`: read all, self-manage + admin-manage).

**P0-5. `course_learning_status` table is used but never defined.**
- Evidence: `backend/services/courses.service.ts` writes to `course_learning_status`
  (`saveCourseLearningStatus`), but no `CREATE TABLE` exists in any `.sql` file. Runtime failure
  unless created manually.
- Fix: add the table + RLS (own-row) to the consolidated schema. Type already exists
  (`types/index.ts:100`).

### 🟠 P1 — Production essentials (needed for scale/robustness)

**P1-1. No message pagination.** `getMessages` uses `.limit(100)` (`channels.service.ts:31`).
Channels with >100 messages silently drop history; raising the limit will crash the browser.
Fix: cursor-based infinite scroll on `created_at`, blocks of ~50.

**P1-2. No upload validation.** `uploadFile` (`channels.service.ts:134`) accepts any size/type.
Fix: enforce MIME + size (bucket-level in Supabase + client guard: avatars ≤2MB image/\*,
channel-files ≤20MB).

**P1-3. No rate limiting on `sendMessage`.** A user can flood a channel. Fix: DB-side throttle
(trigger/function counting recent messages per user) or edge rate limiter.

**P1-4. Mobile viewport handling is missing.** `layout.tsx` has **no `export const viewport`, no
viewport meta, no theme-color**; app uses `h-screen` (=`100vh`) in 9 places with **no `100dvh`,
no `env(safe-area-inset-*)`, no `viewport-fit=cover`**. On Android Chrome / iOS Safari the chat
input is hidden behind browser chrome / the keyboard, and notched devices clip content. This is the
single biggest real "Android-friendliness" gap the prompt calls out.
Fix: add `viewport` export (`width=device-width, viewport-fit=cover`), switch full-height containers
to `100dvh`, add safe-area padding on the chat footer/header.

**P1-5. Chat data refetched by polling.** `ChannelPageClient.tsx:292` polls reactions/polls/stats/
members every 10s. Works, but wasteful at scale. Fix: subscribe to realtime (reactions already in the
publication) instead of interval polling.

### 🟡 P2 — Feature gaps (data-backed WhatsApp features not yet real)

- **Starred messages are localStorage-only** (`chat-utils.ts` `starredStorageKey`) — not synced across
  devices. Needs a `bookmarks`/`starred_messages` table if cross-device is desired.
- **No typing indicators** — no table, not in realtime publication. (Best done via Realtime broadcast/
  presence, no table needed.)
- **No presence / online / last-seen** — no column, no code. (Supabase Realtime Presence.)
- **No per-message read receipts** — only `channel_members.last_read_at` (channel-level). Per-message
  ✓✓ needs a `read_receipts` table (weigh cost at scale).
- **Reactions capped at one emoji per user per message** — `UNIQUE(message_id, user_id)` in schema.
  WhatsApp/Slack allow multiple. Change to `UNIQUE(message_id, user_id, emoji)` if desired (fresh schema
  makes this trivial).
- **@mentions matched by display name** (`channels.service.ts:52`) — `users.name` isn't unique and the
  `@(\w+)` regex misses names with spaces/dots. Consider matching by a unique handle.

### 🟢 P3 — Cleanup / polish

- **1 TypeScript error:** `frontend/app/(dashboard)/settings/SettingsClient.tsx:365` — `theme` value
  typed as `never` in a `themeOptions.map` comparison. Fix the theme-option type union.
- **`deleteAvatar` orphans storage** (`channels.service.ts:168`) — nulls the profile URL but never
  removes the object; avatars bucket grows unbounded. Fix: delete the storage object too.
- **SQL migration sprawl:** 11 overlapping files in `database/` (realtime_fix, realtime_channels_fix,
  update_v2, poll_votes_fix, whatsapp_channels_migration, etc.). With fresh-schema approved, fold all
  into one `schema.sql` and archive the rest.
- **Stale role in migration:** `whatsapp_channels_migration.sql` uses `role IN ('admin','teacher')`;
  canonical roles are `('admin','professor','cr')`. Running it would downgrade the message policy.
  (Moot once consolidated.)
- **`updateChannelMemberPrefs`** (`channels.service.ts:371`) does an extra `SELECT` then spreads
  `...existing` into the upsert — fragile; simplify to a targeted upsert.
- **`useMessages` DELETE subscription has no channel filter** (`useMessages.ts:73`) — receives every
  message delete globally. Intentional workaround noted in code; fine for now, revisit at scale.

---

## 3. WhatsApp feature matrix (current reality)

| Feature | State | Feature | State |
|---|---|---|---|
| Send / edit / delete | ✅ done | Typing indicator | ❌ missing |
| Reply + quoted preview | ✅ done | Online / last seen | ❌ missing |
| Pin messages | ✅ done | Read receipts (per-msg) | ❌ missing |
| Star messages | ⚠️ localStorage only | Delivered/seen status | ❌ missing |
| Reactions | ⚠️ 1 emoji/user cap | Starred (synced) | ❌ missing |
| @mentions + @everyone | ⚠️ name-matched | Message pagination | ❌ missing |
| Polls | ✅ done | Global search | ⚠️ per-channel only |
| Voice notes | ✅ done | Forward / copy | ✅ copy; forward stubbed |
| File / image / audio share | ✅ done | Mute channel | ✅ done |
| Emoji picker | ✅ done | Unread counts | ✅ done (last_read_at) |
| Media / docs / links gallery | ✅ done | Draft / archive / export | ❌ missing |

---

## 4. Recommended phase order (with rough effort)

Ordered by value-to-risk. Each phase is backward-compatible with the UI and testable in isolation.

1. **Phase 1 — Security & RBAC hardening** _(S–M; highest value, lowest UI risk)_
   Rewrite `schema.sql` as one clean file with: RLS year/department/membership enforcement on
   `channels` + `messages` (P0-1), fixed duplicate policies (P0-3), notifications + club_members
   policies (P0-4), `course_learning_status` table (P0-5), multi-emoji reactions if desired.
   Wire `middleware.ts` (P0-2). **This alone closes every P0.**

2. **Phase 2 — Mobile / Android polish** _(S–M; high user-visible value)_
   viewport export + `viewport-fit=cover`, `100dvh`, safe-area insets, sticky chat input above the
   keyboard, verify no horizontal overflow, 44px touch targets (P1-4).

3. **Phase 3 — Scale & robustness** _(M)_
   Message pagination / infinite scroll (P1-1), upload validation (P1-2), send rate limiting (P1-3),
   replace 10s polling with realtime (P1-5).

4. **Phase 4 — Data-backed chat features** _(M–L; choose from the P2 list per product priority)_
   DB-synced starred, presence/last-seen, typing indicators, per-message read receipts.

5. **Phase 5 — Cleanup** _(S)_
   Fix the TS error, `deleteAvatar` storage cleanup, archive old SQL migrations, tidy
   `updateChannelMemberPrefs` (P3).

---

## 5. What I recommend NOT doing

- **Do not** rewrite the chat client, service layer, or UI primitives — they're already good.
- **Do not** attempt all ~80 prompt features at once; several (draft/archive/export, threads, push
  notifications) are large independent projects best scheduled post-launch (matches
  `DEPLOYMENT_AUDIT.md`'s "post-launch" list).
- **Do not** treat frontend filtering as security — fix it at RLS (Phase 1) instead of adding more
  client checks.

---

_Recommendation: start with **Phase 1**. It resolves the only true production blockers (all P0s),
is backward-compatible with the existing UI, and directly satisfies the prompt's #1 requirement
(RBAC enforced at the database, not just the frontend)._
