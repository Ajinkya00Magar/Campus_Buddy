-- Campus Buddy channel upgrades for WhatsApp-style chat features.
-- Run this in Supabase SQL Editor if your database was created before these changes.

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE
  USING (
    auth.uid() = sender_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','teacher'))
  );

DROP POLICY IF EXISTS "messages_delete" ON public.messages;
CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE
  USING (
    auth.uid() = sender_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','teacher'))
  );

DROP POLICY IF EXISTS "reactions_read" ON public.message_reactions;
CREATE POLICY "reactions_read" ON public.message_reactions
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "reactions_insert" ON public.message_reactions;
CREATE POLICY "reactions_insert" ON public.message_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reactions_update" ON public.message_reactions;
CREATE POLICY "reactions_update" ON public.message_reactions
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reactions_delete" ON public.message_reactions;
CREATE POLICY "reactions_delete" ON public.message_reactions
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "votes_update" ON public.poll_votes;
CREATE POLICY "votes_update" ON public.poll_votes
  FOR UPDATE
  USING (auth.uid() = user_id);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
