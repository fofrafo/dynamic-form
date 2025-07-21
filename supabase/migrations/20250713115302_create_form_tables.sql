-- Create form_sessions table
CREATE TABLE IF NOT EXISTS form_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tierart TEXT NOT NULL,
    alter TEXT NOT NULL,
    name TEXT NOT NULL,
    anlass TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_responses table
CREATE TABLE IF NOT EXISTS form_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES form_sessions(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    goals_checked JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_sessions_status ON form_sessions(status);
CREATE INDEX IF NOT EXISTS idx_form_sessions_created_at ON form_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_form_responses_session_id ON form_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_created_at ON form_responses(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE form_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on form_sessions" ON form_sessions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on form_responses" ON form_responses
    FOR ALL USING (true) WITH CHECK (true);