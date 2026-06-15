-- Add last_read_at and muted to channel_members
ALTER TABLE public.channel_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.channel_members ADD COLUMN IF NOT EXISTS muted BOOLEAN DEFAULT FALSE;

-- Ensure real-time publication for channel_members
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;
