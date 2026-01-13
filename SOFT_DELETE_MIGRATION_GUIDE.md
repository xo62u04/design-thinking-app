# 軟刪除功能遷移指南

## 已完成的工作

### 1. 資料庫遷移 ✅
- 檔案: `supabase/migrations/20260113_add_is_active_to_records.sql`
- 為以下表格添加了 `is_active` 欄位：
  - observations
  - pov_statements
  - surveys
  - survey_responses
  - ideas
  - prototypes
- 創建了性能索引

### 2. 類型定義更新 ✅
- `src/lib/supabase/types.ts`: 更新了 Supabase 類型定義
- `src/types/design-thinking.ts`: 為所有紀錄介面添加了 `isActive?: boolean`

### 3. 查詢函數 ✅
- `src/lib/supabase/queries.ts`:
  - 添加了 `toggleRecordActive()` 通用函數
  - 添加了各紀錄類型的專用函數：
    - `toggleObservationActive()`
    - `togglePOVActive()`
    - `toggleSurveyActive()`
    - `toggleIdeaActive()`
    - `togglePrototypeActive()`
  - 修改了查詢函數，添加 `.eq('is_active', true)` 篩選

### 4. UI 組件更新 ✅
- `src/components/ProgressBoard.tsx`:
  - 添加了 `onToggleRecordActive` prop
  - 為觀察紀錄添加了停用按鈕
  - 修改了 POVCard、IdeaCard、PrototypeCard 組件：
    - 添加了 `onToggle` prop
    - 添加了停用按鈕（Eye/EyeOff 圖標）
    - 實作了反灰樣式（opacity-50 + bg-gray-100）

### 5. Hook 整合 ✅
- `src/hooks/useCollaboration.ts`:
  - 添加了 `handleToggleRecordActive()` 函數
  - 實作了本地狀態更新邏輯
- `src/components/CollaborativeWorkspace.tsx`:
  - 傳遞 `handleToggleRecordActive` 到 ProgressBoard

## 執行資料庫遷移

### 方法 1: 使用 Supabase Dashboard

1. 登入 Supabase Dashboard: https://supabase.com/dashboard
2. 選擇您的專案
3. 點擊左側選單的 "SQL Editor"
4. 點擊 "New query"
5. 複製 `supabase/migrations/20260113_add_is_active_to_records.sql` 的內容
6. 貼上並執行

### 方法 2: 使用 Supabase CLI（推薦）

```bash
cd design-thinking-app

# 如果還沒安裝 Supabase CLI
npm install -g supabase

# 連結到您的專案
supabase link --project-ref YOUR_PROJECT_REF

# 執行遷移
supabase db push

# 或者手動執行特定遷移
supabase db push --include supabase/migrations/20260113_add_is_active_to_records.sql
```

### 方法 3: 使用 psql（進階）

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:6543/postgres" < supabase/migrations/20260113_add_is_active_to_records.sql
```

## 驗證遷移成功

執行以下 SQL 查詢來驗證：

```sql
-- 檢查 observations 表是否有 is_active 欄位
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'observations' AND column_name = 'is_active';

-- 應該返回: is_active | boolean | true

-- 檢查所有表格
SELECT
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE column_name = 'is_active'
  AND table_schema = 'public'
ORDER BY table_name;

-- 應該顯示 6 個表格: observations, pov_statements, surveys, survey_responses, ideas, prototypes
```

## 測試步驟

### 1. 執行 TypeScript 類型檢查

```bash
cd design-thinking-app
npm run build
```

應該沒有 TypeScript 錯誤。

### 2. 啟動開發伺服器

```bash
npm run dev
```

### 3. 手動測試功能

1. **創建測試紀錄**
   - 登入應用程式
   - 創建一個協作專案或使用現有專案
   - 添加一些觀察紀錄、POV 陳述、點子、原型

2. **測試停用功能**
   - 在 ProgressBoard 中找到任何一條紀錄
   - 點擊紀錄右側的 "眼睛關閉" (EyeOff) 圖標
   - 確認紀錄變為反灰顯示
   - 檢查資料庫中 `is_active` 是否變為 `false`

3. **測試啟用功能**
   - 點擊已停用紀錄的 "眼睛" (Eye) 圖標
   - 確認紀錄恢復正常顯示
   - 檢查資料庫中 `is_active` 是否變回 `true`

4. **測試篩選功能**
   - 停用一些紀錄
   - 重新載入頁面
   - 確認已停用的紀錄不會顯示在統計數字中
   - 確認已停用的紀錄不會出現在列表中（因為查詢有 `.eq('is_active', true)`）

5. **測試 Realtime 同步**
   - 開啟兩個瀏覽器視窗，使用相同的邀請碼加入專案
   - 在一個視窗中停用一條紀錄
   - 確認另一個視窗也即時看到變更

## 已知限制

### 目前不支援「顯示已停用」切換開關
由於時間限制，目前沒有實作「顯示已停用紀錄」的切換開關。已停用的紀錄會從列表中完全消失（因為查詢有 `is_active = true` 篩選）。

如需實作此功能，需要：
1. 在 ProgressBoard 添加狀態：`const [showInactive, setShowInactive] = useState(false)`
2. 在 queries.ts 修改查詢函數，添加可選的 `includeInactive` 參數
3. 在 UI 添加切換開關

### 統計數字更新
目前統計數字（如「已收集 3 個觀察」）會自動排除已停用的紀錄，因為它們基於 `projectState.observations.length`，而查詢已經篩選掉了停用的紀錄。

## 回滾步驟（如果需要）

如果需要回滾此功能：

```sql
-- 移除 is_active 欄位
ALTER TABLE observations DROP COLUMN IF EXISTS is_active;
ALTER TABLE pov_statements DROP COLUMN IF EXISTS is_active;
ALTER TABLE surveys DROP COLUMN IF EXISTS is_active;
ALTER TABLE survey_responses DROP COLUMN IF EXISTS is_active;
ALTER TABLE ideas DROP COLUMN IF EXISTS is_active;
ALTER TABLE prototypes DROP COLUMN IF EXISTS is_active;

-- 移除索引
DROP INDEX IF EXISTS idx_observations_is_active;
DROP INDEX IF EXISTS idx_pov_statements_is_active;
DROP INDEX IF EXISTS idx_surveys_is_active;
DROP INDEX IF EXISTS idx_ideas_is_active;
DROP INDEX IF EXISTS idx_prototypes_is_active;
DROP INDEX IF EXISTS idx_survey_responses_is_active;
```

然後使用 git 恢復程式碼變更：

```bash
git checkout src/lib/supabase/types.ts
git checkout src/lib/supabase/queries.ts
git checkout src/types/design-thinking.ts
git checkout src/components/ProgressBoard.tsx
git checkout src/hooks/useCollaboration.ts
git checkout src/components/CollaborativeWorkspace.tsx
```

## 後續改進建議

1. **添加「顯示已停用」切換開關**
   - 讓用戶可以選擇是否顯示已停用的紀錄
   - 修改查詢函數支援此選項

2. **批量操作**
   - 選擇多條紀錄並批量停用/啟用
   - 添加「全選」功能

3. **刪除確認對話框**
   - 添加確認對話框防止誤操作
   - 提供「撤銷」功能

4. **審計日誌**
   - 記錄誰在何時停用了哪條紀錄
   - 添加 `deactivated_at` 和 `deactivated_by` 欄位

5. **永久刪除功能**
   - 為管理員提供永久刪除的選項
   - 添加確認步驟和備份機制

## 支援

如有問題，請檢查：
1. Supabase Dashboard 的 Logs 查看錯誤訊息
2. 瀏覽器 Console 查看 JavaScript 錯誤
3. 確認 `.env.local` 檔案中的 Supabase 憑證正確

---

最後更新: 2026-01-13
