-- ============================================================
-- CAMPUS BUDDY — MIGRATION & REPAIR SCRIPT (Idempotent)
-- Run this in Supabase SQL Editor to fix a broken database
-- ============================================================

-- 1. Ensure User Table and Roles are correct
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'student',
  department  TEXT,
  year        INTEGER,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Safely update role constraints
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'professor', 'cr', 'admin'));

-- Migrate existing 'teacher' role values to 'professor'
UPDATE public.users SET role = 'professor' WHERE role = 'teacher';

-- 2. Ensure all other tables exist
CREATE TABLE IF NOT EXISTS public.events (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT NOT NULL, description TEXT, category TEXT DEFAULT 'general', location TEXT, event_date TIMESTAMPTZ NOT NULL, banner_url TEXT, created_by UUID REFERENCES public.users(id), max_capacity INTEGER, is_published BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.event_participants (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), event_id UUID REFERENCES public.events(id) ON DELETE CASCADE, user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, status TEXT DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')), created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(event_id, user_id));
CREATE TABLE IF NOT EXISTS public.channels (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name TEXT NOT NULL, description TEXT, type TEXT DEFAULT 'academic' CHECK (type IN ('academic', 'subject', 'club', 'official')), department TEXT, year INTEGER, is_private BOOLEAN DEFAULT FALSE, created_by UUID REFERENCES public.users(id), created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.channel_members (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE, user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, joined_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(channel_id, user_id));
CREATE TABLE IF NOT EXISTS public.messages (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE, sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE, content TEXT, file_url TEXT, file_name TEXT, is_pinned BOOLEAN DEFAULT FALSE, reply_to UUID REFERENCES public.messages(id), created_at TIMESTAMPTZ DEFAULT NOW(), edited_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS public.message_reactions (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE, user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, emoji TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(message_id, user_id));

-- 3. Add columns that might be missing in older versions
DO $$ BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='channels' AND column_name='is_private') THEN
    ALTER TABLE public.channels ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 4. Refresh RLS Policies (Fixes permission issues)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read" ON public.users;
CREATE POLICY "users_read" ON public.users FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "channels_read" ON public.channels;
CREATE POLICY "channels_read" ON public.channels FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'professor', 'cr')) OR is_private = FALSE OR EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "channel_members_manage" ON public.channel_members;
CREATE TABLE IF NOT EXISTS public.channel_members (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE, user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, joined_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(channel_id, user_id));
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "channel_members_manage" ON public.channel_members FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') OR auth.uid() = user_id);

DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'professor', 'cr')));

-- Poll vote permissions (required for upsert on poll_votes)
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "votes_read" ON public.poll_votes;
CREATE POLICY "votes_read" ON public.poll_votes FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "votes_insert" ON public.poll_votes;
CREATE POLICY "votes_insert" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "votes_update" ON public.poll_votes;
CREATE POLICY "votes_update" ON public.poll_votes FOR UPDATE USING (auth.uid() = user_id);

-- 5. Storage Buckets (Avatars and Files)
INSERT INTO storage.buckets (id, name, public) VALUES ('channel-files', 'channel-files', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- 6. Update Trigger and Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;

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
    CASE WHEN NEW.raw_user_meta_data->>'year' IS NOT NULL THEN (NEW.raw_user_meta_data->>'year')::INTEGER ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
