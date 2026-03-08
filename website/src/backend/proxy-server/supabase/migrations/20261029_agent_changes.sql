-- Create agent_changes table
CREATE TABLE IF NOT EXISTS public.agent_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier SMALLINT NOT NULL CHECK (tier IN (1, 2)),
    title TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    proposed_diff TEXT,
    status TEXT NOT NULL DEFAULT 'pending_approval',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.agent_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts to agent_changes"
ON public.agent_changes
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public select on agent_changes"
ON public.agent_changes
FOR SELECT
TO public
USING (true);
