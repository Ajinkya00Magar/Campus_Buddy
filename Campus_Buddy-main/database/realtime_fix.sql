-- Ensure Realtime Deletion works by including all columns in the deletion payload
-- This is necessary if we want to filter by channel_id in the frontend realtime subscription
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Also enable it for other realtime tables for consistency
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.poll_votes REPLICA IDENTITY FULL;
