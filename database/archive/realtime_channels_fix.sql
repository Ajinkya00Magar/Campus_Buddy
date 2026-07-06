-- ============================================================
-- CAMPUS BUDDY — REALTIME CHANNELS & EVENTS FIX
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Enable full data payloads for deletions
ALTER TABLE public.channels REPLICA IDENTITY FULL;
ALTER TABLE public.events   REPLICA IDENTITY FULL;

-- 2. Add tables to the realtime publication
-- We use a DO block to avoid errors if they are already added
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'channels') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'event_participants') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_participants;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'clubs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clubs;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'club_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.club_members;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'courses') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'users') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  END IF;
END $$;
