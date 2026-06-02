-- ============================================================
-- CAMPUS BUDDY — COMPLETE SUPABASE SQL SCHEMA (v2.0 FINAL)
-- Run this entire file in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABLES
-- ============================================================

-- USERS
CREATE TABLE public.users (
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
CREATE TABLE public.events (
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

CREATE TABLE public.event_participants (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id   UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- CLUBS
CREATE TABLE public.clubs (
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

CREATE TABLE public.club_members (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id   UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role      TEXT DEFAULT 'member' CHECK (role IN ('member', 'lead', 'co-lead')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- COURSES
CREATE TABLE public.courses (
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

CREATE TABLE public.course_modules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT,
  video_url   TEXT,
  order_index INTEGER NOT NULL,
  duration    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.course_progress (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id    UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
  completed    BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id, module_id)
);

CREATE TABLE public.course_completions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- CHANNELS
CREATE TABLE public.channels (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL DEFAULT 'academic' CHECK (type IN ('academic', 'subject', 'club', 'official')),
  department  TEXT,
  year        INTEGER,
  is_private  BOOLEAN DEFAULT FALSE,
  created_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.channel_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- MESSAGES
CREATE TABLE public.messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content    TEXT,
  file_url   TEXT,
  file_name  TEXT,
  is_pinned  BOOLEAN DEFAULT FALSE,
  reply_to   UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at  TIMESTAMPTZ
);

CREATE TABLE public.message_reactions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- POLLS
CREATE TABLE public.polls (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  question   TEXT NOT NULL,
  options    JSONB NOT NULL DEFAULT '[]',
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ends_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.poll_votes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id    UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  option_idx INTEGER NOT NULL,
  voted_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT,
  type       TEXT DEFAULT 'info' CHECK (type IN ('message', 'event', 'course', 'info')),
  link       TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================
CREATE INDEX idx_messages_channel_created ON public.messages(channel_id, created_at DESC);
CREATE INDEX idx_notifications_user       ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_course_progress_user     ON public.course_progress(user_id, course_id);
CREATE INDEX idx_events_date              ON public.events(event_date, is_published);

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "users_read"   ON public.users FOR SELECT USING (TRUE);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- EVENTS
CREATE POLICY "events_read"   ON public.events FOR SELECT USING (is_published = TRUE OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'professor', 'cr')));
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'professor', 'cr')));
CREATE POLICY "events_update" ON public.events FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'professor', 'cr')));
CREATE POLICY "events_delete" ON public.events FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- EVENT_PARTICIPANTS
CREATE POLICY "rsvp_read"   ON public.event_participants FOR SELECT USING (TRUE);
CREATE POLICY "rsvp_insert" ON public.event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rsvp_update" ON public.event_participants FOR UPDATE USING (auth.uid() = user_id);

-- CLUBS
CREATE POLICY "clubs_read"   ON public.clubs FOR SELECT USING (TRUE);
CREATE POLICY "clubs_manage" ON public.clubs FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- COURSES
CREATE POLICY "courses_read"   ON public.courses FOR SELECT USING (is_published = TRUE OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'professor', 'cr')));
CREATE POLICY "courses_manage" ON public.courses FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'professor', 'cr')));
CREATE POLICY "modules_manage" ON public.course_modules FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'professor', 'cr')));

CREATE POLICY "progress_own" ON public.course_progress    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "complete_own" ON public.course_completions FOR ALL USING (auth.uid() = user_id);

-- CHANNELS
CREATE POLICY "channels_read" ON public.channels 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'professor', 'cr')) OR
  is_private = FALSE OR
  EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = id AND user_id = auth.uid())
);
CREATE POLICY "channels_manage" ON public.channels FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- CHANNEL MEMBERS
CREATE POLICY "channel_members_manage" ON public.channel_members 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') OR
  auth.uid() = user_id
);

-- MESSAGES
CREATE POLICY "messages_read"   ON public.messages FOR SELECT USING (TRUE);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'professor', 'cr')));
CREATE POLICY "messages_delete" ON public.messages FOR DELETE USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'professor', 'cr')));

-- MESSAGE REACTIONS
CREATE POLICY "reactions_read"   ON public.message_reactions FOR SELECT USING (TRUE);
CREATE POLICY "reactions_insert" ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_update" ON public.message_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reactions_delete" ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);

-- POLLS
CREATE POLICY "polls_read"   ON public.polls FOR SELECT USING (TRUE);
CREATE POLICY "polls_insert" ON public.polls FOR INSERT WITH CHECK (auth.uid() = created_by);

-- ============================================================
-- 4. STORAGE SETUP
-- ============================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('channel-files', 'channel-files', true),
  ('avatars',       'avatars',       true)
ON CONFLICT (id) DO NOTHING;

-- Policies for channel-files
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'channel-files');
CREATE POLICY "Allow public viewing" ON storage.objects FOR SELECT TO public USING (bucket_id = 'channel-files');
CREATE POLICY "Allow individual deletion" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'channel-files' AND (auth.uid() = owner));

-- Policies for avatars
CREATE POLICY "Avatar insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Avatar select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Avatar update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (auth.uid() = owner));
CREATE POLICY "Avatar delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (auth.uid() = owner));

-- ============================================================
-- 5. TRIGGERS & FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, department, year)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'teacher' THEN 'professor'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    END,
    NEW.raw_user_meta_data->>'department',
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
-- 6. ENABLE REALTIME
-- ============================================================
ALTER TABLE public.messages         REPLICA IDENTITY FULL;
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.poll_votes        REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;

-- ============================================================
-- 7. SEED DATA
-- ============================================================
INSERT INTO public.channels (name, description, type, department, year) VALUES
  ('notices',        'Official campus notices',              'official',  NULL,  NULL),
  ('placements',     'Placement updates and opportunities',  'official',  NULL,  NULL),
  ('cse-1st-year',   'CSE First Year Group',                 'academic',  'CSE', 1),
  ('cse-2nd-year',   'CSE Second Year Group',                'academic',  'CSE', 2),
  ('mech-1st-year',  'Mechanical First Year Group',          'academic',  'MECH',1),
  ('robotics-club',  'Robotics Club Official',               'club',      NULL,  NULL)
ON CONFLICT DO NOTHING;
