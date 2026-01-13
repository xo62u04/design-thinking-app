# 實作計劃：為所有紀錄類型添加「停用（反灰）」功能

## 目標

為以下紀錄類型添加「停用/反灰」功能：
- 使用者觀察 (observations)
- POV 陳述 (pov_statements)
- 問卷調查 (surveys + survey_responses)
- 創意點子 (ideas)
- 原型設計 (prototypes)

## 實作步驟

### 1. 資料庫遷移 ✅ 已完成

**檔案**: `supabase/migrations/20260113_add_is_active_to_records.sql`

已為以下表格添加 `is_active BOOLEAN DEFAULT true` 欄位：
- observations
- pov_statements
- surveys
- survey_responses
- ideas
- prototypes

並創建索引以提升查詢效能。

### 2. 更新 TypeScript 類型定義

#### 2.1 更新 `src/lib/supabase/types.ts`

為以下表格的 Row, Insert, Update 類型添加 `is_active: boolean`:
- observations
- pov_statements
- surveys (同時添加完整的 surveys 和 survey_responses 類型定義)
- survey_responses
- ideas
- prototypes

修改 Update 類型從 `never` 改為允許更新 `is_active`。

#### 2.2 更新 `src/types/design-thinking.ts`

為以下介面添加 `isActive?: boolean`:
- Observation
- POVStatement
- Survey
- SurveyResponse
- Idea
- Prototype

### 3. 更新資料庫查詢函數

**檔案**: `src/lib/supabase/queries.ts`

#### 3.1 添加停用/啟用函數

```typescript
// 通用的停用/啟用函數
export async function toggleRecordActive(
  table: 'observations' | 'pov_statements' | 'surveys' | 'ideas' | 'prototypes',
  recordId: string,
  isActive: boolean
): Promise<void>

// 或者為每個表格創建獨立函數
export async function toggleObservationActive(id: string, isActive: boolean)
export async function togglePOVActive(id: string, isActive: boolean)
export async function toggleSurveyActive(id: string, isActive: boolean)
export async function toggleIdeaActive(id: string, isActive: boolean)
export async function togglePrototypeActive(id: string, isActive: boolean)
```

#### 3.2 更新查詢函數

修改現有的查詢函數，預設只返回 active 的紀錄：
- `getObservations()` - 添加 `.eq('is_active', true)`
- `getPOVStatements()` - 添加 `.eq('is_active', true)`
- `getSurveys()` - 添加 `.eq('is_active', true)`
- `getIdeas()` - 添加 `.eq('is_active', true)`
- `getPrototypes()` - 添加 `.eq('is_active', true)`

### 4. 更新 UI 組件

**檔案**: `src/components/ProgressBoard.tsx`

#### 4.1 添加停用按鈕

為每個紀錄項目添加停用按鈕（垃圾桶圖示或眼睛圖示）：

```tsx
<button
  onClick={() => handleToggleActive(record.id, false)}
  className="text-gray-400 hover:text-red-500"
  title="停用此紀錄"
>
  <EyeOff className="h-4 w-4" />
</button>
```

#### 4.2 實作反灰樣式

為已停用的紀錄添加視覺效果：

```tsx
<div className={cn(
  "p-4 border rounded",
  !record.isActive && "opacity-50 bg-gray-100"
)}>
```

#### 4.3 添加「顯示已停用」切換開關

```tsx
const [showInactive, setShowInactive] = useState(false);

// 篩選顯示的紀錄
const displayedRecords = showInactive
  ? allRecords
  : allRecords.filter(r => r.isActive);
```

### 5. 更新實時訂閱邏輯

**檔案**: `src/hooks/useCollaboration.ts`

確保 Realtime 訂閱能正確處理 `is_active` 欄位的更新：

```typescript
.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'observations',
}, (payload) => {
  // 處理 is_active 的變更
})
```

### 6. 添加確認對話框（可選）

**新檔案**: `src/components/ConfirmDialog.tsx`

創建一個通用的確認對話框組件：

```tsx
<ConfirmDialog
  title="停用此紀錄"
  message="此紀錄將被標記為停用，您可以隨時重新啟用它。"
  onConfirm={() => handleToggleActive(id, false)}
/>
```

### 7. 測試計劃

#### 7.1 資料庫測試
- 執行遷移腳本
- 驗證所有表格都有 `is_active` 欄位
- 驗證預設值為 `true`
- 驗證索引已創建

#### 7.2 功能測試
對每種紀錄類型進行測試：
1. 創建新紀錄 → 確認 `isActive = true`
2. 停用紀錄 → 確認反灰顯示
3. 再次點擊 → 確認可重新啟用
4. 切換「顯示已停用」→ 確認篩選功能正常
5. 檢查 Realtime 同步 → 確認其他協作者能看到變更

#### 7.3 邊界測試
- 停用已有回答的問卷 → 回答應該保留
- 停用有 whiteboard 的原型 → whiteboard 應該保留
- 多次快速點擊停用按鈕 → 不應產生錯誤

## 實作優先順序

1. **Phase 1**: 資料庫 + 類型定義 (✅ 已完成資料庫遷移)
2. **Phase 2**: 查詢函數 + 停用/啟用 API
3. **Phase 3**: UI 更新 (按鈕 + 反灰樣式)
4. **Phase 4**: 測試並修復問題

## 技術決策

### Q: 為什麼用 `is_active` 而不是 `deleted_at`？
A: `is_active` 更直觀，且是布林值，查詢效能更好。未來可擴展為 `status` 欄位支援更多狀態。

### Q: 是否需要「永久刪除」功能？
A: 目前不需要。所有紀錄都保留在資料庫中，只是標記為停用。管理員可通過資料庫直接刪除。

### Q: 停用後的紀錄是否影響統計？
A: 是的。停用的紀錄不應計入統計（如「已收集 3 個洞察」）。需要在統計邏輯中過濾 `isActive === true` 的紀錄。

### Q: 協作者看到的是即時的嗎？
A: 是的。透過 Supabase Realtime 訂閱，所有協作者會即時看到紀錄的停用/啟用狀態變更。

## 潛在問題與解決方案

### 問題 1: 遷移已有資料
**解決**: 遷移腳本使用 `DEFAULT true`，所有現有紀錄會自動設為 `is_active = true`。

### 問題 2: TypeScript 類型錯誤
**解決**: 更新類型定義後，需要檢查所有使用這些類型的地方，確保處理 `isActive` 欄位。

### 問題 3: Realtime 訂閱沒有觸發
**解決**: 確保訂閱包含 `UPDATE` 事件，並且 RLS 政策允許更新操作。

## 完成標準

- [ ] 資料庫遷移成功執行
- [ ] 所有類型定義已更新
- [ ] 查詢函數支援停用/啟用
- [ ] UI 顯示停用按鈕
- [ ] 已停用紀錄顯示為反灰
- [ ] 「顯示已停用」切換開關正常運作
- [ ] Realtime 同步正常
- [ ] 所有紀錄類型都經過測試
- [ ] 無 TypeScript 錯誤
- [ ] 無 Console 錯誤

## 預估時間

- Phase 1: 1 小時 (✅ 已完成)
- Phase 2: 1.5 小時
- Phase 3: 2 小時
- Phase 4: 1 小時

**總計**: 約 5.5 小時
