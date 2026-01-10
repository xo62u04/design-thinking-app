-- Design Thinking Collaboration Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  current_stage TEXT NOT NULL DEFAULT 'empathize'
    CHECK (current_stage IN ('empathize', 'define', 'ideate', 'prototype', 'test')),
  active_coach TEXT NOT NULL DEFAULT 'orchestrator'
    CHECK (active_coach IN ('orchestrator', 'empathy', 'define', 'ideate', 'prototype', 'test')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Collaborators table
CREATE TABLE collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  color TEXT NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(project_id, nickname)
);

-- Observations table (append-only)
CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  collaborator_id UUID REFERENCES collaborators(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('pain_point', 'behavior', 'need', 'insight')),
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POV Statements table (append-only)
CREATE TABLE pov_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  collaborator_id UUID REFERENCES collaborators(id) ON DELETE SET NULL,
  user_desc TEXT NOT NULL,
  need TEXT NOT NULL,
  insight TEXT NOT NULL,
  statement TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ideas table (append-only, but votes/status can be updated)
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  collaborator_id UUID REFERENCES collaborators(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  votes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'raw'
    CHECK (status IN ('raw', 'refined', 'selected', 'discarded')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prototypes table
CREATE TABLE prototypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  collaborator_id UUID REFERENCES collaborators(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'low_fidelity'
    CHECK (type IN ('low_fidelity', 'medium_fidelity', 'high_fidelity')),
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prototype Feedbacks table (append-only)
CREATE TABLE prototype_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prototype_id UUID NOT NULL REFERENCES prototypes(id) ON DELETE CASCADE,
  collaborator_id UUID REFERENCES collaborators(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative', 'suggestion')),
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat Messages table (append-only)
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  collaborator_id UUID REFERENCES collaborators(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  coach_type TEXT CHECK (coach_type IN ('orchestrator', 'empathy', 'define', 'ideate', 'prototype', 'test')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stage Progress table
CREATE TABLE stage_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('empathize', 'define', 'ideate', 'prototype', 'test')),
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_tasks TEXT[] DEFAULT '{}',
  notes TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(project_id, stage)
);

-- Indexes for performance
CREATE INDEX idx_observations_project ON observations(project_id);
CREATE INDEX idx_pov_statements_project ON pov_statements(project_id);
CREATE INDEX idx_ideas_project ON ideas(project_id);
CREATE INDEX idx_prototypes_project ON prototypes(project_id);
CREATE INDEX idx_chat_messages_project ON chat_messages(project_id);
CREATE INDEX idx_collaborators_project ON collaborators(project_id);
CREATE INDEX idx_projects_invite_code ON projects(invite_code);
CREATE INDEX idx_prototype_feedbacks_prototype ON prototype_feedbacks(prototype_id);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pov_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE prototypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prototype_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for anonymous access - we validate via invite_code in app)
CREATE POLICY "Allow all on projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on collaborators" ON collaborators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on observations" ON observations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pov_statements" ON pov_statements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ideas" ON ideas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on prototypes" ON prototypes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on prototype_feedbacks" ON prototype_feedbacks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on chat_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on stage_progress" ON stage_progress FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE collaborators;
ALTER PUBLICATION supabase_realtime ADD TABLE observations;
ALTER PUBLICATION supabase_realtime ADD TABLE pov_statements;
ALTER PUBLICATION supabase_realtime ADD TABLE ideas;
ALTER PUBLICATION supabase_realtime ADD TABLE prototypes;
ALTER PUBLICATION supabase_realtime ADD TABLE prototype_feedbacks;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE stage_progress;

-- Function to initialize stage_progress when project is created
CREATE OR REPLACE FUNCTION init_stage_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stage_progress (project_id, stage, status)
  VALUES
    (NEW.id, 'empathize', 'in_progress'),
    (NEW.id, 'define', 'not_started'),
    (NEW.id, 'ideate', 'not_started'),
    (NEW.id, 'prototype', 'not_started'),
    (NEW.id, 'test', 'not_started');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_project_created
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION init_stage_progress();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_prototypes_updated_at
  BEFORE UPDATE ON prototypes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stage_progress_updated_at
  BEFORE UPDATE ON stage_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
