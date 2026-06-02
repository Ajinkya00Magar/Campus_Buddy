-- ============================================================
-- CAMPUS BUDDY — v2.0 UPDATE SCRIPT
-- Run this in Supabase SQL Editor to update an existing database
-- ============================================================

-- 1. Enable Full Realtime Sync (Fixes deletion lag)
ALTER TABLE public.messages         REPLICA IDENTITY FULL;
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.poll_votes        REPLICA IDENTITY FULL;

-- 2. Setup Avatar Storage System
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for avatars bucket
DROP POLICY IF EXISTS "Avatar insert" ON storage.objects;
CREATE POLICY "Avatar insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar select" ON storage.objects;
CREATE POLICY "Avatar select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar update" ON storage.objects;
CREATE POLICY "Avatar update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (auth.uid() = owner));

DROP POLICY IF EXISTS "Avatar delete" ON storage.objects;
CREATE POLICY "Avatar delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (auth.uid() = owner));

-- 3. Update User Trigger (Handles flexible email formats and optional year)
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
    CASE 
      WHEN NEW.raw_user_meta_data->>'year' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'year')::INTEGER
      ELSE NULL 
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 4. Ensure RLS Policies include the latest Professor and CR roles
-- Messages
DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'professor', 'cr')));

DROP POLICY IF EXISTS "messages_delete" ON public.messages;
CREATE POLICY "messages_delete" ON public.messages FOR DELETE USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'professor', 'cr')));

-- Channels
DROP POLICY IF EXISTS "channels_read" ON public.channels;
CREATE POLICY "channels_read" ON public.channels FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'professor', 'cr')) OR is_private = FALSE OR EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = id AND user_id = auth.uid()));

-- Events
DROP POLICY IF EXISTS "events_read" ON public.events;
CREATE POLICY "events_read" ON public.events FOR SELECT USING (is_published = TRUE OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'professor', 'cr')));

DROP POLICY IF EXISTS "events_insert" ON public.events;
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'professor', 'cr')));
