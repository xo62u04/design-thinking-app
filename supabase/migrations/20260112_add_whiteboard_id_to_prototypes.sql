-- 在 prototypes 表加入 whiteboard_id 欄位
ALTER TABLE prototypes
ADD COLUMN whiteboard_id UUID REFERENCES whiteboards(id) ON DELETE SET NULL;

-- 為 whiteboard_id 建立索引
CREATE INDEX idx_prototypes_whiteboard_id ON prototypes(whiteboard_id);

-- 更新 whiteboards 表，加入反向參考（如果需要的話，確保雙向關聯）
-- 注意：whiteboards 表已經有 prototype_id，這裡只是確保一致性
