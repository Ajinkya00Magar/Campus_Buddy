# 🚀 Campus Buddy: 10k+ Users Deployment Audit

To successfully and safely scale Campus Buddy to 10,000+ users, the application needs transitioning from a "functional MVP" to a "production-grade" system. When dealing with thousands of concurrent students, security vulnerabilities are amplified, and inefficient database queries can bring down the server.

Below is the comprehensive audit of what needs to be added, removed, and optimized before launch.

---

## 🔐 1. Critical Security Additions

Currently, the app relies heavily on client-side routing and basic database RLS. We need to harden the perimeter.

*   **[Must Add] Rate Limiting:**
    *   **Issue:** A malicious user could spam the `sendMessage` function, exhausting database connections or flooding a channel.
    *   **Fix:** Implement Upstash Rate Limiting or Supabase API Gateway rate limiting. Limit message creation to something like 5 messages per 10 seconds per user. Limit login attempts to prevent brute-force attacks.
*   **[Must Add] JWT Custom Claims for Roles:**
    *   **Issue:** Our current RLS policies do this: `EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')`. At 10k users, doing a nested `SELECT` query on every single message read/write is a massive performance bottleneck.
    *   **Fix:** Inject the user's `role` directly into their Supabase Auth JWT token using a Custom Auth Hook. The RLS policy then becomes `(auth.jwt()->>'role' = 'admin')`, which executes instantly in memory with zero database reads.
*   **[Must Add] Strict Storage Limits & Validation:**
    *   **Issue:** Users can upload massive 1GB files to the `channel-files` bucket, burning through your Supabase bandwidth and storage limits.
    *   **Fix:** Add bucket-level limits in Supabase. Restrict `avatars` to `image/*` and max `2MB`. Restrict `channel-files` to a max of `20MB`.
*   **[Must Fix] Input Sanitization (Zod):**
    *   Currently using basic regex. Integrate `zod` for strict schema validation on the backend services before inserting data into Supabase to prevent XSS attacks in chat messages.

---

## ⚡ 2. Performance & Scalability Enhancements

Handling 10,000 users means handling potentially millions of messages and realtime events.

*   **[Must Add] Cursor-Based Pagination for Chat:**
    *   **Issue:** The app currently loads `limit(100)` messages. If a channel has 10,000 messages, users can't scroll up to see old ones, or if we increase the limit, the browser will crash.
    *   **Fix:** Implement infinite scrolling. Use the `created_at` timestamp as a cursor to fetch messages in blocks of 50 as the user scrolls up.
*   **[Must Fix] Image Optimization (`next/image`):**
    *   **Issue:** The `Avatar` component uses standard `<img>` tags. Loading 50 high-res avatars in a chat room will consume massive bandwidth and slow down the page.
    *   **Fix:** Wrap Supabase Storage URLs in Next.js `<Image />` components so they are automatically compressed to WebP/AVIF, resized, and cached at the edge.
*   **[Must Add] Connection Pooling:**
    *   **Issue:** Next.js Server Components create many short-lived database connections.
    *   **Fix:** Ensure your Supabase connection string uses **Supavisor (IPv4 pooling)** (port 6543) rather than the direct database connection, otherwise, 10k users will exhaust the connection limit instantly.

---

## 🛠️ 3. Features to Add Before Launch

*   **Password Reset & Email Verification Flow:**
    *   Currently, we rely on the `seed_users.mjs` script to auto-verify. For real users, we need a dedicated "Forgot Password" page and proper handling of the Supabase email verification callback.
*   **User Presence (Online/Offline Status):**
    *   Use Supabase Realtime Presence. In the Admin Panel and Channels, show a green dot if a user is currently online. This makes the platform feel "alive."
*   **Message Moderation / Reporting:**
    *   Add a "Report Message" option to the `MessageContextMenu`. Admins need a dashboard to view reported messages and ban users.
*   **Push Notifications (PWA):**
    *   The current notification system relies on polling or an open browser tab. Implement Web Push API or turn the app into a PWA so students get notified of important campus announcements even when the app is closed.

---

## 🗑️ 4. Features to Remove / Restrict

*   **Remove Client-Side Admin Checks:** Ensure no admin pages (like `/admin/*`) rely purely on hiding UI elements. Ensure the `proxy.ts` (middleware) strictly guards these routes so standard users cannot even download the JavaScript bundle for the admin panel.
*   **Remove/Restrict Public Club Creation:** Currently, if any user can create a club/channel, it will quickly become chaotic. Restrict channel and club creation entirely to `Admin` and `Professor`/`CR` roles.

---

## 💡 5. "Good-to-Have" Recommendations (Post-Launch)

1.  **AI Assistant (Campus Bot):**
    *   Integrate an LLM (like OpenAI or Gemini) trained on the **PYQs and Notes**. Students could type `@buddy What came in last year's OS exam?` in a channel, and the bot would answer.
2.  **Threaded Conversations:**
    *   Right now, "Reply" quotes the message. True threaded conversations (like Slack) keep the main channel clean when 500 students are talking at once.
3.  **Read Receipts:**
    *   Using Supabase Realtime, show small avatars under a message when people in the channel have read it.
4.  **Calendar Integration (Google/Apple Sync):**
    *   Allow students to click an "Add to Calendar" button on the Events page to sync campus events directly to their personal phones.
