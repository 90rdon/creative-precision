-- Assessment Sessions (Tier 2 Cold Storage)
CREATE TABLE IF NOT EXISTS public.assessment_sessions (
    id UUID PRIMARY KEY,
    transcript JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'quiet',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment Events (Telemetry & Analytics)
CREATE TABLE IF NOT EXISTS public.assessment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NULL,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_events ENABLE ROW LEVEL SECURITY;

-- Anonymous Anon-Key Access (Allowing proxy API inserts)
-- We only allow INSERTS and UPDATES for sessions
CREATE POLICY "Enable insert for anonymous users on sessions" ON public.assessment_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for anonymous users on sessions" ON public.assessment_sessions
    FOR UPDATE USING (true) WITH CHECK (true);

-- We only allow INSERTS for telemetry events
CREATE POLICY "Enable insert for anonymous users on events" ON public.assessment_events
    FOR INSERT WITH CHECK (true);
