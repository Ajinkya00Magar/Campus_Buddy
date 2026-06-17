-- ============================================================
-- CLEAR MESSAGES FROM AVAILABLE CHANNELS
-- This script deletes messages only from active/available channels
-- The CASCADE constraint will automatically delete related message_reactions
-- ============================================================

-- STEP 1: View all available channels before clearing
SELECT id, name, type, department, year FROM public.channels ORDER BY name;

-- STEP 2: Delete polls and poll votes from channels that exist
DELETE FROM public.polls 
WHERE channel_id IN (SELECT id FROM public.channels);

-- STEP 3: Delete messages only from channels that exist
DELETE FROM public.messages 
WHERE channel_id IN (SELECT id FROM public.channels);

-- STEP 4: Verify deletion
SELECT COUNT(*) as total_messages_remaining FROM public.messages;
SELECT COUNT(*) as total_reactions_remaining FROM public.message_reactions;
SELECT COUNT(*) as total_polls_remaining FROM public.polls;
SELECT COUNT(*) as total_poll_votes_remaining FROM public.poll_votes;
