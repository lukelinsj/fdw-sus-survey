-- Neon database schema for FDW eService SUS survey responses

CREATE TABLE IF NOT EXISTS sus_responses (
  id SERIAL PRIMARY KEY,
  response_id TEXT UNIQUE NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Contact details
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact TEXT NOT NULL,
  
  -- Screener questions
  residency_status TEXT NOT NULL,
  application_scheme TEXT NOT NULL,
  ea_usage TEXT NOT NULL,
  
  -- SUS responses (1-5 Likert scale)
  sus1 INTEGER NOT NULL CHECK (sus1 BETWEEN 1 AND 5),
  sus2 INTEGER NOT NULL CHECK (sus2 BETWEEN 1 AND 5),
  sus3 INTEGER NOT NULL CHECK (sus3 BETWEEN 1 AND 5),
  sus4 INTEGER NOT NULL CHECK (sus4 BETWEEN 1 AND 5),
  sus5 INTEGER NOT NULL CHECK (sus5 BETWEEN 1 AND 5),
  sus6 INTEGER NOT NULL CHECK (sus6 BETWEEN 1 AND 5),
  sus7 INTEGER NOT NULL CHECK (sus7 BETWEEN 1 AND 5),
  sus8 INTEGER NOT NULL CHECK (sus8 BETWEEN 1 AND 5),
  sus9 INTEGER NOT NULL CHECK (sus9 BETWEEN 1 AND 5),
  sus10 INTEGER NOT NULL CHECK (sus10 BETWEEN 1 AND 5),
  
  -- Computed SUS score (0-100)
  sus_score NUMERIC(4,1) NOT NULL,
  
  -- Computed validity flag
  flagged BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_submitted_at ON sus_responses(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_flagged ON sus_responses(flagged);
