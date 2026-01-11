-- 創建白板表
CREATE TABLE IF NOT EXISTS whiteboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  prototype_id UUID,
  name TEXT NOT NULL,
  elements JSONB DEFAULT '[]'::jsonb,
  app_state JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES collaborators(id)
);

-- 為 project_id 建立索引以加快查詢
CREATE INDEX IF NOT EXISTS idx_whiteboards_project_id ON whiteboards(project_id);

-- 為 prototype_id 建立索引
CREATE INDEX IF NOT EXISTS idx_whiteboards_prototype_id ON whiteboards(prototype_id);

-- 啟用 Row Level Security
ALTER TABLE whiteboards ENABLE ROW LEVEL SECURITY;

-- 允許所有人讀取白板（與專案權限一致）
CREATE POLICY "Allow read access to whiteboards"
  ON whiteboards FOR SELECT
  USING (true);

-- 允許協作者建立白板
CREATE POLICY "Allow collaborators to create whiteboards"
  ON whiteboards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collaborators
      WHERE collaborators.id = created_by
      AND collaborators.project_id = whiteboards.project_id
    )
  );

-- 允許協作者更新白板
CREATE POLICY "Allow collaborators to update whiteboards"
  ON whiteboards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM collaborators
      WHERE collaborators.project_id = whiteboards.project_id
    )
  );

-- 建立自動更新 updated_at 的觸發器
CREATE OR REPLACE FUNCTION update_whiteboard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whiteboard_updated_at
  BEFORE UPDATE ON whiteboards
  FOR EACH ROW
  EXECUTE FUNCTION update_whiteboard_updated_at();
