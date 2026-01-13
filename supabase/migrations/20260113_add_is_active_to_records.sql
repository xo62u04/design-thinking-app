-- 為所有紀錄類型添加 is_active 欄位（軟刪除/停用功能）

-- 1. observations 表
ALTER TABLE observations
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. pov_statements 表
ALTER TABLE pov_statements
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 3. surveys 表
ALTER TABLE surveys
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 4. ideas 表
ALTER TABLE ideas
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 5. prototypes 表
ALTER TABLE prototypes
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 6. survey_responses 表（問卷回答也需要能停用）
ALTER TABLE survey_responses
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 建立索引以提升查詢效能（只查詢 active 的紀錄）
CREATE INDEX IF NOT EXISTS idx_observations_is_active ON observations(project_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pov_statements_is_active ON pov_statements(project_id, is_active);
CREATE INDEX IF NOT EXISTS idx_surveys_is_active ON surveys(project_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ideas_is_active ON ideas(project_id, is_active);
CREATE INDEX IF NOT EXISTS idx_prototypes_is_active ON prototypes(project_id, is_active);
CREATE INDEX IF NOT EXISTS idx_survey_responses_is_active ON survey_responses(survey_id, is_active);
