-- ============================================================
-- CAMPUS BUDDY — AUTHORITATIVE SUPABASE SCHEMA (v3.0)
-- Single source of truth. Idempotent: safe to run repeatedly.
-- Run this entire file in the Supabase SQL Editor.
--
-- v3.0 changes vs v2:
--   * Department/Year access control is now ENFORCED IN RLS
--     (previously frontend-only). See public.can_access_channel().
--   * Fixed duplicate poll-vote policies (schema no longer errors).
--   * Added policies for notifications & club_members (were RLS-on/no-policy).
--   * Added course_learning_status table (was used by code, never defined).
--   * Reactions now allow multiple distinct emojis per user per message.
--   * Server-side message rate limiting (anti-flood).
--   * Storage buckets carry size limits (avatars 2MB, files 20MB).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABLES
-- ============================================================

-- USERS
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'professor', 'cr', 'admin')),
  department  TEXT,
  year        INTEGER CHECK (year BETWEEN 1 AND 4), -- Nullable for Professors and Admins
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- EVENTS
CREATE TABLE IF NOT EXISTS public.events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL DEFAULT 'general',
  location      TEXT,
  event_date    TIMESTAMPTZ NOT NULL,
  banner_url    TEXT,
  created_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  max_capacity  INTEGER,
  is_published  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_participants (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id   UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- CLUBS
CREATE TABLE IF NOT EXISTS public.clubs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT,
  logo_url        TEXT,
  cover_url       TEXT,
  achievements    TEXT[],
  links           JSONB DEFAULT '[]',
  faculty_advisor UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_members (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id   UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role      TEXT DEFAULT 'member' CHECK (role IN ('member', 'lead', 'co-lead')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- COURSES
CREATE TABLE IF NOT EXISTS public.courses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  description  TEXT,
  thumbnail    TEXT,
  duration     TEXT,
  level        TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  tags         TEXT[],
  created_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_modules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT,
  video_url   TEXT,
  order_index INTEGER NOT NULL,
  duration    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_progress (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id    UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
  completed    BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.course_completions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- COURSE LEARNING STATUS (external/self-paced learning tracker, used by courses.service.ts)
CREATE TABLE IF NOT EXISTS public.course_learning_status (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id        TEXT NOT NULL,
  course_title     TEXT,
  provider         TEXT,
  status           TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'ongoing', 'completed')),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  completed_at     TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- CHANNELS
CREATE TABLE IF NOT EXISTS public.channels (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL DEFAULT 'academic' CHECK (type IN ('academic', 'subject', 'club', 'official')),
  department  TEXT,
  year        INTEGER CHECK (year IS NULL OR year BETWEEN 1 AND 4),
  is_private  BOOLEAN DEFAULT FALSE,
  -- 'everyone' = any member can post; 'staff' = announcement-only (admin/professor/cr)
  post_policy TEXT NOT NULL DEFAULT 'everyone' CHECK (post_policy IN ('everyone', 'staff')),
  created_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
-- Backfill for databases created before post_policy existed
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS post_policy TEXT NOT NULL DEFAULT 'everyone';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'channels_post_policy_check'
  ) THEN
    ALTER TABLE public.channels
      ADD CONSTRAINT channels_post_policy_check CHECK (post_policy IN ('everyone', 'staff'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.channel_members (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id   UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  muted        BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(channel_id, user_id)
);
-- Backfill columns if channel_members predates v3
ALTER TABLE public.channel_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;
ALTER TABLE public.channel_members ADD COLUMN IF NOT EXISTS muted BOOLEAN NOT NULL DEFAULT FALSE;

-- MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content    TEXT,
  file_url   TEXT,
  file_name  TEXT,
  is_pinned  BOOLEAN DEFAULT FALSE,
  reply_to   UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at  TIMESTAMPTZ,
  -- Soft "delete for everyone" (WhatsApp-style tombstone)
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- HIDDEN MESSAGES ("delete for me" — per-user, syncs across devices)
CREATE TABLE IF NOT EXISTS public.hidden_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

-- MESSAGE REACTIONS (multiple distinct emojis per user per message)
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);
-- Migrate a legacy UNIQUE(message_id, user_id) constraint to the emoji-aware one
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'message_reactions_message_id_user_id_key'
  ) THEN
    ALTER TABLE public.message_reactions
      DROP CONSTRAINT message_reactions_message_id_user_id_key;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'message_reactions_message_id_user_id_emoji_key'
  ) THEN
    ALTER TABLE public.message_reactions
      ADD CONSTRAINT message_reactions_message_id_user_id_emoji_key
      UNIQUE (message_id, user_id, emoji);
  END IF;
END $$;

-- POLLS
CREATE TABLE IF NOT EXISTS public.polls (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  question   TEXT NOT NULL,
  options    JSONB NOT NULL DEFAULT '[]',
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ends_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id    UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  option_idx INTEGER NOT NULL,
  voted_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT,
  type       TEXT DEFAULT 'info' CHECK (type IN ('message', 'event', 'course', 'info')),
  link       TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKMARKS (starred messages — DB-backed so they sync across devices)
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

-- PUSH SUBSCRIPTIONS (Web Push endpoints per device/browser)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGE REPORTS (moderation — students flag messages, staff review)
CREATE TABLE IF NOT EXISTS public.message_reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id  UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason      TEXT,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, reporter_id)
);

-- ============================================================
-- 2. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_messages_channel_created ON public.messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_created  ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user       ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_progress_user     ON public.course_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_events_date              ON public.events(event_date, is_published);
CREATE INDEX IF NOT EXISTS idx_channel_members_user     ON public.channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel  ON public.channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_msg    ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll          ON public.poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_channels_year_dept       ON public.channels(type, year, department);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user           ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user  ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_messages_user      ON public.hidden_messages(user_id);

-- ============================================================
-- 3. ACCESS-CONTROL HELPER FUNCTIONS
--    SECURITY DEFINER so they bypass RLS internally (no recursion)
--    and can be reused by every policy. STABLE lets the planner
--    cache the result within a statement.
--    NOTE (scale): at 10k+ users, replace the users lookup with a
--    JWT custom claim (auth.jwt()->>'role') to avoid a per-row read.
-- ============================================================

-- Current caller's role (NULL if not signed in / no profile row yet)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Mirrors frontend shouldShowChannelForUser() exactly, so the UI list
-- and the DB boundary never diverge.
CREATE OR REPLACE FUNCTION public.can_access_channel(p_channel_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
  v_role TEXT;
  v_year INTEGER;
  v_dept TEXT;
  v_user_dept TEXT;
  c_type TEXT;
  c_year INTEGER;
  c_dept TEXT;
  c_private BOOLEAN;
BEGIN
  SELECT role, year, department INTO v_role, v_year, v_dept
    FROM public.users WHERE id = auth.uid();

  IF v_role IS NULL THEN
    RETURN FALSE; -- not authenticated / no profile
  END IF;

  -- Staff see everything
  IF v_role IN ('admin', 'professor', 'cr') THEN
    RETURN TRUE;
  END IF;

  SELECT type, year, department, is_private
    INTO c_type, c_year, c_dept, c_private
    FROM public.channels WHERE id = p_channel_id;

  IF c_type IS NULL THEN
    RETURN FALSE; -- channel does not exist
  END IF;

  -- Year-scoped academic/subject channels
  IF c_type IN ('academic', 'subject') THEN
    IF c_year IS DISTINCT FROM v_year THEN
      RETURN FALSE;
    END IF;
    IF c_dept IS NOT NULL AND length(trim(c_dept)) > 0 THEN
      -- Students/CRs are treated as CSE (matches getProfileDepartmentCode)
      v_user_dept := CASE
        WHEN v_role IN ('student', 'cr') THEN 'CSE'
        ELSE upper(trim(COALESCE(v_dept, '')))
      END;
      IF v_user_dept <> '' AND upper(trim(c_dept)) <> v_user_dept THEN
        RETURN FALSE;
      END IF;
    END IF;
    RETURN TRUE;
  END IF;

  -- Private non-year channels require explicit membership
  IF COALESCE(c_private, FALSE) THEN
    RETURN EXISTS (
      SELECT 1 FROM public.channel_members
      WHERE channel_id = p_channel_id AND user_id = auth.uid()
    );
  END IF;

  -- Public non-year channels (official/club) are visible to everyone
  RETURN TRUE;
END;
$$;

-- Whether the caller may POST in a channel. Staff always may; everyone else
-- may only when the channel is not announcement-only (post_policy = 'staff').
CREATE OR REPLACE FUNCTION public.can_post_channel(p_channel_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
  v_role   TEXT;
  c_policy TEXT;
BEGIN
  IF NOT public.can_access_channel(p_channel_id) THEN
    RETURN FALSE;
  END IF;

  v_role := public.current_user_role();
  IF v_role IN ('admin', 'professor', 'cr') THEN
    RETURN TRUE;
  END IF;

  SELECT post_policy INTO c_policy FROM public.channels WHERE id = p_channel_id;
  RETURN COALESCE(c_policy, 'everyone') <> 'staff';
END;
$$;

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_completions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_learning_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_messages        ENABLE ROW LEVEL SECURITY;

-- USERS
DROP POLICY IF EXISTS "users_read"   ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_read"   ON public.users FOR SELECT USING (TRUE);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- EVENTS
DROP POLICY IF EXISTS "events_read"   ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;
DROP POLICY IF EXISTS "events_delete" ON public.events;
CREATE POLICY "events_read"   ON public.events FOR SELECT USING (is_published = TRUE OR public.current_user_role() IN ('admin', 'professor', 'cr'));
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK (public.current_user_role() IN ('admin', 'professor', 'cr'));
CREATE POLICY "events_update" ON public.events FOR UPDATE USING (public.current_user_role() IN ('admin', 'professor', 'cr'));
CREATE POLICY "events_delete" ON public.events FOR DELETE USING (public.current_user_role() = 'admin');

-- EVENT PARTICIPANTS
DROP POLICY IF EXISTS "rsvp_read"   ON public.event_participants;
DROP POLICY IF EXISTS "rsvp_insert" ON public.event_participants;
DROP POLICY IF EXISTS "rsvp_update" ON public.event_participants;
DROP POLICY IF EXISTS "rsvp_delete" ON public.event_participants;
CREATE POLICY "rsvp_read"   ON public.event_participants FOR SELECT USING (TRUE);
CREATE POLICY "rsvp_insert" ON public.event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rsvp_update" ON public.event_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rsvp_delete" ON public.event_participants FOR DELETE USING (auth.uid() = user_id);

-- CLUBS
DROP POLICY IF EXISTS "clubs_read"   ON public.clubs;
DROP POLICY IF EXISTS "clubs_manage" ON public.clubs;
CREATE POLICY "clubs_read"   ON public.clubs FOR SELECT USING (TRUE);
CREATE POLICY "clubs_manage" ON public.clubs FOR ALL USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');

-- CLUB MEMBERS
DROP POLICY IF EXISTS "club_members_read"   ON public.club_members;
DROP POLICY IF EXISTS "club_members_manage" ON public.club_members;
CREATE POLICY "club_members_read"   ON public.club_members FOR SELECT USING (TRUE);
CREATE POLICY "club_members_manage" ON public.club_members FOR ALL
  USING (auth.uid() = user_id OR public.current_user_role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR public.current_user_role() = 'admin');

-- COURSES
DROP POLICY IF EXISTS "courses_read"   ON public.courses;
DROP POLICY IF EXISTS "courses_manage" ON public.courses;
DROP POLICY IF EXISTS "modules_read"   ON public.course_modules;
DROP POLICY IF EXISTS "modules_manage" ON public.course_modules;
DROP POLICY IF EXISTS "progress_own"   ON public.course_progress;
DROP POLICY IF EXISTS "complete_own"   ON public.course_completions;
DROP POLICY IF EXISTS "learning_own"   ON public.course_learning_status;
CREATE POLICY "courses_read"   ON public.courses FOR SELECT USING (is_published = TRUE OR public.current_user_role() IN ('admin', 'professor', 'cr'));
CREATE POLICY "courses_manage" ON public.courses FOR ALL USING (public.current_user_role() IN ('admin', 'professor', 'cr')) WITH CHECK (public.current_user_role() IN ('admin', 'professor', 'cr'));
CREATE POLICY "modules_read"   ON public.course_modules FOR SELECT USING (TRUE);
CREATE POLICY "modules_manage" ON public.course_modules FOR ALL USING (public.current_user_role() IN ('admin', 'professor', 'cr')) WITH CHECK (public.current_user_role() IN ('admin', 'professor', 'cr'));
CREATE POLICY "progress_own"   ON public.course_progress    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "complete_own"   ON public.course_completions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "learning_own"   ON public.course_learning_status FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CHANNELS — year/department/membership enforced here (was frontend-only)
DROP POLICY IF EXISTS "channels_read"   ON public.channels;
DROP POLICY IF EXISTS "channels_manage" ON public.channels;
CREATE POLICY "channels_read"   ON public.channels FOR SELECT USING (public.can_access_channel(id));
CREATE POLICY "channels_manage" ON public.channels FOR ALL USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');

-- CHANNEL MEMBERS — members of an accessible channel are visible (needed
-- for @mention autocomplete + member counts); a user manages only their own row.
DROP POLICY IF EXISTS "channel_members_read"   ON public.channel_members;
DROP POLICY IF EXISTS "channel_members_manage" ON public.channel_members;
CREATE POLICY "channel_members_read"   ON public.channel_members FOR SELECT
  USING (auth.uid() = user_id OR public.current_user_role() = 'admin' OR public.can_access_channel(channel_id));
CREATE POLICY "channel_members_manage" ON public.channel_members FOR ALL
  USING (auth.uid() = user_id OR public.current_user_role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR public.current_user_role() = 'admin');

-- MESSAGES — read/write gated by channel access (was USING TRUE)
DROP POLICY IF EXISTS "messages_read"   ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;
CREATE POLICY "messages_read"   ON public.messages FOR SELECT USING (public.can_access_channel(channel_id));
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND public.can_post_channel(channel_id));
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (auth.uid() = sender_id OR public.current_user_role() IN ('admin', 'professor', 'cr'));
CREATE POLICY "messages_delete" ON public.messages FOR DELETE USING (auth.uid() = sender_id OR public.current_user_role() IN ('admin', 'professor', 'cr'));

-- MESSAGE REACTIONS — gated by access to the parent message's channel
DROP POLICY IF EXISTS "reactions_read"   ON public.message_reactions;
DROP POLICY IF EXISTS "reactions_insert" ON public.message_reactions;
DROP POLICY IF EXISTS "reactions_update" ON public.message_reactions;
DROP POLICY IF EXISTS "reactions_delete" ON public.message_reactions;
CREATE POLICY "reactions_read"   ON public.message_reactions FOR SELECT
  USING (public.can_access_channel((SELECT channel_id FROM public.messages WHERE id = message_id)));
CREATE POLICY "reactions_insert" ON public.message_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.can_access_channel((SELECT channel_id FROM public.messages WHERE id = message_id)));
CREATE POLICY "reactions_update" ON public.message_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reactions_delete" ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);

-- POLLS — gated by channel access
DROP POLICY IF EXISTS "polls_read"   ON public.polls;
DROP POLICY IF EXISTS "polls_insert" ON public.polls;
CREATE POLICY "polls_read"   ON public.polls FOR SELECT USING (public.can_access_channel(channel_id));
CREATE POLICY "polls_insert" ON public.polls FOR INSERT WITH CHECK (auth.uid() = created_by AND public.can_access_channel(channel_id));

-- POLL VOTES — gated by access to the poll's channel (single definition; v2 had a dup)
DROP POLICY IF EXISTS "votes_read"   ON public.poll_votes;
DROP POLICY IF EXISTS "votes_insert" ON public.poll_votes;
DROP POLICY IF EXISTS "votes_update" ON public.poll_votes;
CREATE POLICY "votes_read"   ON public.poll_votes FOR SELECT
  USING (public.can_access_channel((SELECT channel_id FROM public.polls WHERE id = poll_id)));
CREATE POLICY "votes_insert" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "votes_update" ON public.poll_votes FOR UPDATE USING (auth.uid() = user_id);

-- NOTIFICATIONS — own rows only; any authenticated user may create a
-- notification aimed at another user (e.g. @mention alerts).
DROP POLICY IF EXISTS "notifications_read"   ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
CREATE POLICY "notifications_read"   ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- BOOKMARKS — own rows only
DROP POLICY IF EXISTS "bookmarks_own" ON public.bookmarks;
CREATE POLICY "bookmarks_own" ON public.bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PUSH SUBSCRIPTIONS — own rows only (the server send-path uses the service role)
DROP POLICY IF EXISTS "push_subs_own" ON public.push_subscriptions;
CREATE POLICY "push_subs_own" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- HIDDEN MESSAGES — own rows only
DROP POLICY IF EXISTS "hidden_messages_own" ON public.hidden_messages;
CREATE POLICY "hidden_messages_own" ON public.hidden_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- MESSAGE REPORTS — a user files/sees their own reports (only for messages they
-- can access); staff read/triage every report; admins may delete.
DROP POLICY IF EXISTS "reports_read"   ON public.message_reports;
DROP POLICY IF EXISTS "reports_insert" ON public.message_reports;
DROP POLICY IF EXISTS "reports_update" ON public.message_reports;
DROP POLICY IF EXISTS "reports_delete" ON public.message_reports;
CREATE POLICY "reports_read"   ON public.message_reports FOR SELECT
  USING (auth.uid() = reporter_id OR public.current_user_role() IN ('admin', 'professor', 'cr'));
CREATE POLICY "reports_insert" ON public.message_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id AND public.can_access_channel((SELECT channel_id FROM public.messages WHERE id = message_id)));
CREATE POLICY "reports_update" ON public.message_reports FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'professor', 'cr'));
CREATE POLICY "reports_delete" ON public.message_reports FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ============================================================
-- 5. ANTI-FLOOD: message rate limiting (server-enforced)
--    Rejects a send if the user posted >= 10 messages in the last
--    10 seconds. Degrades gracefully (client shows an error toast).
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_message_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
    FROM public.messages
    WHERE sender_id = NEW.sender_id
      AND created_at > NOW() - INTERVAL '10 seconds';

  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: please slow down before sending more messages.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_message_rate_limit ON public.messages;
CREATE TRIGGER trg_message_rate_limit
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_rate_limit();

-- "Delete for everyone" is only allowed within 15 minutes of sending, unless
-- the actor is staff (admin/professor/cr, e.g. moderation). Enforced server-side.
CREATE OR REPLACE FUNCTION public.enforce_delete_window()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    IF public.current_user_role() NOT IN ('admin', 'professor', 'cr')
       AND OLD.created_at < NOW() - INTERVAL '15 minutes' THEN
      RAISE EXCEPTION 'The 15-minute window to delete for everyone has passed.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_delete_window ON public.messages;
CREATE TRIGGER trg_delete_window
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_delete_window();

-- ============================================================
-- 5b. ADMIN ANALYTICS (aggregation RPCs)
--     SECURITY DEFINER + an internal admin guard: a non-admin caller
--     gets empty/zero results, so no data leaks even if invoked directly.
-- ============================================================

-- Messages per day for the last p_days (gap-filled with zeros).
CREATE OR REPLACE FUNCTION public.admin_daily_message_counts(p_days INTEGER DEFAULT 14)
RETURNS TABLE(day DATE, total BIGINT)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT d::date AS day, COUNT(m.id) AS total
  FROM generate_series(CURRENT_DATE - (p_days - 1), CURRENT_DATE, INTERVAL '1 day') AS d
  LEFT JOIN public.messages m
    ON m.created_at >= d AND m.created_at < d + INTERVAL '1 day'
  WHERE public.current_user_role() = 'admin'
  GROUP BY d
  ORDER BY d;
$$;

-- Busiest channels over the last p_days.
CREATE OR REPLACE FUNCTION public.admin_top_channels(p_days INTEGER DEFAULT 30, p_limit INTEGER DEFAULT 5)
RETURNS TABLE(channel_id UUID, name TEXT, total BIGINT)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT c.id, c.name, COUNT(m.id) AS total
  FROM public.channels c
  JOIN public.messages m ON m.channel_id = c.id
  WHERE m.created_at >= CURRENT_DATE - (p_days - 1)
    AND public.current_user_role() = 'admin'
  GROUP BY c.id, c.name
  ORDER BY total DESC
  LIMIT GREATEST(p_limit, 0);
$$;

-- Distinct users who sent a message in the last p_days.
CREATE OR REPLACE FUNCTION public.admin_active_sender_count(p_days INTEGER DEFAULT 7)
RETURNS BIGINT
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COUNT(DISTINCT m.sender_id)
  FROM public.messages m
  WHERE m.created_at >= CURRENT_DATE - (p_days - 1)
    AND public.current_user_role() = 'admin';
$$;

GRANT EXECUTE ON FUNCTION public.admin_daily_message_counts(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_top_channels(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_active_sender_count(INTEGER)   TO authenticated;

-- ============================================================
-- 6. STORAGE SETUP (with size limits)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152,
   ARRAY['image/png','image/jpeg','image/jpg','image/webp','image/gif','image/avif']),
  ('channel-files', 'channel-files', true, 20971520, NULL)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public viewing"        ON storage.objects;
DROP POLICY IF EXISTS "Allow individual deletion"   ON storage.objects;
DROP POLICY IF EXISTS "Avatar insert" ON storage.objects;
DROP POLICY IF EXISTS "Avatar select" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete" ON storage.objects;

CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'channel-files');
CREATE POLICY "Allow public viewing"        ON storage.objects FOR SELECT TO public       USING (bucket_id = 'channel-files');
CREATE POLICY "Allow individual deletion"   ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'channel-files' AND auth.uid() = owner);

CREATE POLICY "Avatar insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Avatar select" ON storage.objects FOR SELECT TO public       USING (bucket_id = 'avatars');
CREATE POLICY "Avatar update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid() = owner);
CREATE POLICY "Avatar delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- ============================================================
-- 7. TRIGGERS & FUNCTIONS — auth → profile provisioning
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' = 'teacher' THEN 'professor'
    ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  END;

  INSERT INTO public.users (id, name, email, role, department, year)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    v_role,
    -- Students/CRs default to CSE if none provided
    COALESCE(
      NEW.raw_user_meta_data->>'department',
      CASE WHEN v_role IN ('student', 'cr') THEN 'CSE' ELSE NULL END
    ),
    CASE WHEN NEW.raw_user_meta_data->>'year' IS NOT NULL
         THEN (NEW.raw_user_meta_data->>'year')::INTEGER
         ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 8. REALTIME
-- ============================================================
ALTER TABLE public.messages          REPLICA IDENTITY FULL;
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.poll_votes        REPLICA IDENTITY FULL;
ALTER TABLE public.polls             REPLICA IDENTITY FULL;
ALTER TABLE public.channels          REPLICA IDENTITY FULL;
ALTER TABLE public.channel_members   REPLICA IDENTITY FULL;
ALTER TABLE public.events            REPLICA IDENTITY FULL;
ALTER TABLE public.notifications     REPLICA IDENTITY FULL;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'messages','message_reactions','notifications','poll_votes','polls',
    'channels','channel_members','events','event_participants','clubs',
    'club_members','courses','users','message_reports'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 9. SEED DATA
-- ============================================================
INSERT INTO public.channels (name, description, type, department, year, post_policy) VALUES
  ('notices',        'Official campus notices',              'official',  NULL,  NULL, 'staff'),
  ('placements',     'Placement updates and opportunities',  'official',  NULL,  NULL, 'staff'),
  ('notices',        'First Year Notices',                   'academic',  NULL,  1,    'staff'),
  ('notices',        'Second Year Notices',                  'academic',  NULL,  2,    'staff'),
  ('notices',        'Third Year Notices',                   'academic',  NULL,  3,    'staff'),
  ('notices',        'Fourth Year Notices',                  'academic',  NULL,  4,    'staff'),
  ('cse-1st-year',   'CSE First Year Group',                 'academic',  'CSE', 1,    'everyone'),
  ('cse-2nd-year',   'CSE Second Year Group',                'academic',  'CSE', 2,    'everyone'),
  ('robotics-club',  'Robotics Club Official',               'club',      NULL,  NULL, 'everyone')
ON CONFLICT DO NOTHING;

-- Existing official/notices channels become announcement-only by default.
UPDATE public.channels
   SET post_policy = 'staff'
 WHERE post_policy = 'everyone'
   AND (type = 'official' OR lower(name) = 'notices');

INSERT INTO public.channels (name, description, type, department, year, is_private)
SELECT 'cb', 'CB development chat', 'official', NULL, NULL, FALSE
WHERE NOT EXISTS (
  SELECT 1 FROM public.channels
  WHERE lower(name) = 'cb' AND type = 'official'
);
