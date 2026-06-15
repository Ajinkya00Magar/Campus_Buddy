-- Fix poll votes not registering (missing RLS policies on poll_votes).
-- Run this in Supabase SQL Editor if channel poll votes fail silently.

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "votes_read" ON public.poll_votes;
CREATE POLICY "votes_read" ON public.poll_votes
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "votes_insert" ON public.poll_votes;
CREATE POLICY "votes_insert" ON public.poll_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "votes_update" ON public.poll_votes;
CREATE POLICY "votes_update" ON public.poll_votes
  FOR UPDATE
  USING (auth.uid() = user_id);

ALTER TABLE public.poll_votes REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
