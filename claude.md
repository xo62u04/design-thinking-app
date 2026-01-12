# 設計思考協作平台 - 開發文檔

## 專案概述

這是一個基於 Design Thinking 方法論的協作平台，支援多人即時協作完成設計思考的五個階段：同理心、定義、發想、原型、測試。

## 技術棧

- **前端框架**: Next.js 16.1.1 + React 19.2.3
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **AI 模型**: OpenAI (gpt-4o) / Anthropic (Claude Sonnet 4.5)
- **後端**: Supabase (PostgreSQL + Realtime)
- **白板**: Excalidraw 0.18.0
- **部署**: Vercel

## 核心功能

### 1. 五大階段教練系統

每個階段都有對應的 AI 教練協助團隊完成任務：

- **同理心教練** (Empathy Coach): 使用 5 Whys 技巧挖掘情感需求，收集至少 3 個關鍵洞察
- **定義教練** (Define Coach): 引導建立 POV 陳述：[使用者] 需要 [需求]，因為 [驚人洞察]
- **調查教練** (Survey Coach): 設計問卷驗證 POV 假設，收集用戶真實回饋
- **發想教練** (Ideate Coach): 將 POV 轉化為 HMW 問題，收集至少 15 個點子
- **原型教練** (Prototype Coach): 阻止完美主義，10 分鐘快速原型
- **測試教練** (Test Coach): 觀察沈默與挫折，嚴禁解釋只能記錄

### 2. 多人協作功能

#### 協作工作區 (CollaborativeWorkspace)
- 即時同步專案狀態
- 顯示線上協作者頭像
- 邀請連結分享
- 協作者 presence tracking

#### 實時通信
- 使用 Supabase Realtime 訂閱資料庫變更
- 即時顯示其他協作者的貢獻
- 防抖機制避免頻繁寫入

### 3. 協作白板 (CollaborativeWhiteboard)

- **繪圖引擎**: Excalidraw
- **功能**:
  - 多人即時繪製原型設計
  - 自動保存（1秒防抖）
  - 綁定原型記錄（避免重複創建）
  - 線上用戶數顯示
- **路由**: `/whiteboard/[whiteboardId]`

### 4. 協作問卷系統 (CollaborativeSurveyForm)

#### 問卷類型
- **簡答題** (text): 簡短文字回答
- **多選題** (multiple_choice): 單選選項，顯示統計長條圖
- **評分題** (rating): 1-5 星評分，顯示平均分
- **開放題** (open_ended): 詳細文字回答

#### 功能特性
- **即時同步**: 其他協作者填寫後立即顯示
- **問卷編輯**: 創建者可即時編輯問題和選項
- **統計視覺化**:
  - 多選題：百分比長條圖
  - 評分題：平均分 + 星星顯示
  - 文字題：列出所有回答
- **Presence tracking**: 顯示當前線上用戶數
- **路由**: `/survey/[surveyId]`

## 資料庫結構

### 核心表

#### projects
```sql
- id (UUID, PK)
- name (TEXT)
- description (TEXT)
- invite_code (TEXT, UNIQUE)
- current_stage (DesignStage)
- active_coach (CoachType)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### collaborators
```sql
- id (UUID, PK)
- project_id (UUID, FK -> projects)
- nickname (TEXT)
- color (TEXT)
- is_online (BOOLEAN)
- last_seen_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### observations (同理心階段產出)
```sql
- id (UUID, PK)
- project_id (UUID, FK -> projects)
- collaborator_id (UUID, FK -> collaborators)
- content (TEXT)
- category (ObservationCategory)
- source (TEXT)
- created_at (TIMESTAMP)
```

#### pov_statements (定義階段產出)
```sql
- id (UUID, PK)
- project_id (UUID, FK -> projects)
- collaborator_id (UUID, FK -> collaborators)
- user_desc (TEXT)
- need (TEXT)
- insight (TEXT)
- statement (TEXT)
- created_at (TIMESTAMP)
```

#### surveys (定義階段問卷)
```sql
- id (UUID, PK)
- project_id (UUID, FK -> projects)
- question (TEXT)
- type (TEXT) -- 'text' | 'multiple_choice' | 'rating' | 'open_ended'
- options (JSONB) -- 多選題選項
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- created_by (UUID, FK -> collaborators)
```

#### survey_responses (問卷回答)
```sql
- id (UUID, PK)
- survey_id (UUID, FK -> surveys, ON DELETE CASCADE)
- respondent_name (TEXT)
- response (TEXT) -- 回答內容或選項
- created_at (TIMESTAMP)
- created_by (UUID, FK -> collaborators)
```

#### ideas (發想階段產出)
```sql
- id (UUID, PK)
- project_id (UUID, FK -> projects)
- collaborator_id (UUID, FK -> collaborators)
- title (TEXT)
- description (TEXT)
- votes (INTEGER)
- status (IdeaStatus)
- tags (TEXT[])
- created_at (TIMESTAMP)
```

#### prototypes (原型階段產出)
```sql
- id (UUID, PK)
- project_id (UUID, FK -> projects)
- collaborator_id (UUID, FK -> collaborators)
- name (TEXT)
- description (TEXT)
- type (PrototypeType)
- features (TEXT[])
- whiteboard_id (UUID, FK -> whiteboards)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### whiteboards (協作白板)
```sql
- id (UUID, PK)
- project_id (UUID, FK -> projects)
- prototype_id (UUID, FK -> prototypes)
- name (TEXT)
- elements (JSONB) -- Excalidraw 繪圖元素
- app_state (JSONB) -- Excalidraw 應用狀態
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- created_by (UUID, FK -> collaborators)
```

## 專案結構

```
design-thinking-app/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # 首頁（本地版）
│   │   ├── api/chat/route.ts           # AI 聊天 API
│   │   ├── project/[inviteCode]/       # 協作專案頁面
│   │   ├── survey/[surveyId]/          # 問卷頁面
│   │   └── whiteboard/[whiteboardId]/  # 白板頁面
│   │
│   ├── components/
│   │   ├── ChatPanel.tsx                      # 聊天面板
│   │   ├── ProgressBoard.tsx                  # 進度看板
│   │   ├── CollaborativeWorkspace.tsx         # 協作工作區
│   │   ├── CollaborativeWhiteboard.tsx        # 協作白板
│   │   ├── CollaborativeSurveyForm.tsx        # 協作問卷表單
│   │   ├── SurveyCard.tsx                     # 問卷卡片
│   │   ├── MessageItem.tsx                    # 聊天訊息
│   │   ├── CollaboratorAvatars.tsx            # 協作者頭像
│   │   ├── InviteLinkShare.tsx                # 邀請連結分享
│   │   ├── JoinProjectModal.tsx               # 加入專案模態框
│   │   └── ProjectSelector.tsx                # 專案選擇器
│   │
│   ├── hooks/
│   │   ├── useDesignThinkingChat.ts   # 本地版狀態管理
│   │   └── useCollaboration.ts        # 協作版實時同步
│   │
│   ├── lib/
│   │   ├── state-updater.ts           # 狀態更新邏輯
│   │   ├── storage.ts                 # localStorage 管理
│   │   └── supabase/
│   │       ├── client.ts              # Supabase 客戶端
│   │       ├── queries.ts             # 資料庫查詢函數
│   │       ├── realtime.ts            # 即時訂閱
│   │       └── types.ts               # 資料庫 Schema 類型
│   │
│   ├── types/
│   │   └── design-thinking.ts         # 核心類型定義
│   │
│   └── constants/
│       └── prompts.ts                 # AI 教練系統提示詞
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 20260111_create_whiteboards.sql
│       ├── 20260112_add_whiteboard_id_to_prototypes.sql
│       └── 20260112_create_surveys.sql
│
├── .env.local                         # 環境變數
├── next.config.ts                     # Next.js 配置
└── tailwind.config.ts                 # Tailwind 配置
```

## 狀態管理

### 本地版 (useDesignThinkingChat)
- 使用 React useState
- 儲存在 localStorage
- 單人使用模式

### 協作版 (useCollaboration)
- 使用 Supabase Realtime
- 即時同步到資料庫
- 多人協作模式

### Action 系統
所有狀態更新通過 Action 機制：

```typescript
type ActionType =
  | 'ADD_OBSERVATION'      // 添加觀察
  | 'ADD_POV'              // 添加 POV 陳述
  | 'ADD_SURVEY'           // 添加問卷
  | 'ADD_SURVEY_RESPONSE'  // 添加問卷回答
  | 'ADD_IDEA'             // 添加點子
  | 'ADD_PROTOTYPE'        // 添加原型
  | 'ADD_FEEDBACK'         // 添加回饋
  | 'NEXT_STAGE'           // 進入下一階段
  | 'UPDATE_STAGE_PROGRESS'; // 更新階段進度
```

## AI 教練系統

### System Prompt 結構

每個教練的系統提示詞包含：
1. **角色定義**: 教練的身份和職責
2. **目標**: 該階段需要達成的最低要求
3. **JSON Action 格式**: 如何記錄產出
4. **提示指引**: 當學員需要提示時的回應策略

### JSON Action 解析

AI 回應包含兩部分：
1. **對話內容**: 給學員看的文字
2. **JSON Action**: 系統解析並執行的指令

範例：
```
📌 我已經記錄了這個觀察！

```json:action
{
  "type": "ADD_OBSERVATION",
  "data": {
    "content": "使用者在結帳時經常放棄購物車",
    "category": "pain_point"
  }
}
```
```

## Realtime 功能實現

### 訂閱機制

```typescript
// 訂閱資料庫變更
const channel = supabase
  .channel(`table:${tableName}:${projectId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: tableName,
    filter: `project_id=eq.${projectId}`,
  }, (payload) => {
    // 處理新增資料
  })
  .subscribe();

// Presence tracking
const presenceChannel = supabase
  .channel(`presence:${resourceId}`, {
    config: { presence: { key: collaboratorId } }
  })
  .on('presence', { event: 'sync' }, () => {
    const state = presenceChannel.presenceState();
    setOnlineUsers(Object.keys(state).length);
  })
  .subscribe();
```

## 環境變數設定

創建 `.env.local` 文件：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# AI Provider (選擇一個)
AI_PROVIDER=openai  # 或 anthropic
AI_MODEL=gpt-4o     # 或 claude-sonnet-4-5-20250514

# OpenAI (如果使用)
OPENAI_API_KEY=your_openai_key

# Anthropic (如果使用)
ANTHROPIC_API_KEY=your_anthropic_key
```

## 開發指令

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 構建生產版本
npm run build

# 啟動生產版本
npm start

# 運行測試
npm test
```

## 最近更新

### 2026-01-12: 協作問卷系統

新增協作問卷功能，讓團隊可以在定義階段設計問卷並收集回饋：

#### 新增功能
- ✅ 四種問卷類型：簡答、多選、評分、開放題
- ✅ 即時同步問卷回答
- ✅ 問卷統計視覺化（長條圖、星星評分）
- ✅ 問卷編輯功能（創建者權限）
- ✅ Presence tracking 顯示線上用戶
- ✅ 在 ProgressBoard 添加「開啟協作問卷」按鈕

#### 技術實現
- 創建 `surveys` 和 `survey_responses` 資料庫表
- 實現 `CollaborativeSurveyForm` 組件
- 添加問卷相關 Supabase 查詢函數
- Realtime 訂閱問卷回答和編輯

#### 相關 Commits
- `a742f9f` - 實作問卷調查功能：定義階段可設計問卷收集用戶回饋
- `797df13` - 實作協作問卷功能：支援多人共編問卷和即時填寫
- `e8f608c` - 修正協作問卷功能的 TypeScript 類型錯誤

### 2026-01-11: 協作白板功能

- ✅ 整合 Excalidraw 實現協作繪圖
- ✅ 白板綁定原型，避免重複創建
- ✅ 即時同步繪圖元素
- ✅ 防抖保存機制（1秒）

### 2026-01-10: 進度面板改進

- ✅ 新增點子和原型展示區塊
- ✅ 支援展開/收合長文字
- ✅ 優化響應式設計

## 已知問題

1. **PDF 匯出**: 尚未實現匯出功能
2. **離線模式**: 目前需要網路連線
3. **通知系統**: 尚未實現推播通知

## 未來計劃

- [ ] 匯出功能（PDF、圖片）
- [ ] 通知系統（新回覆、階段完成）
- [ ] 模板系統（常用問卷模板）
- [ ] 權限管理（觀看者、編輯者、管理員）
- [ ] 歷史版本（回溯專案狀態）
- [ ] 離線支援（PWA）

## 貢獻者

- **開發者**: [Your Name]
- **AI 助手**: Claude Sonnet 4.5 (Anthropic)

## 授權

MIT License

---

最後更新: 2026-01-12
