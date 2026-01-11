# 完整流程整合測試指南

## 📋 概述

本專案包含**完整的設計思考流程整合測試**，可以自動模擬使用者從**同理心階段 → 定義階段 → 發想階段 → 原型階段 → 測試階段**的完整旅程。

## ✅ 測試成果

```
測試檔案：src/hooks/__tests__/useDesignThinkingChat.integration.test.ts
測試數量：3 個整合測試
測試狀態：✅ 全部通過（38/38 tests passed）
```

### 測試涵蓋範圍

| 測試項目 | 說明 | 狀態 |
|---------|------|------|
| **完整流程測試** | 模擬使用者完成 5 個階段的完整流程 | ✅ 通過 |
| **中途儲存測試** | 驗證任何階段都能正確儲存並恢復進度 | ✅ 通過 |
| **錯誤處理測試** | 驗證 API 錯誤時專案狀態保持穩定 | ✅ 通過 |

## 🎯 完整流程測試內容

### 階段 1：同理心階段（Empathize）
```
✅ 切換到同理心教練
✅ 添加觀察 1：痛點類別（年輕人覺得期貨很複雜）
✅ 添加觀察 2：行為類別（在社交媒體上尋找經驗分享）
✅ 添加觀察 3：需求類別（希望有簡單易懂的入門教學）
✅ 驗證階段完成度達到 100%
```

### 階段 2：定義階段（Define）
```
✅ 進入定義階段，切換到定義教練
✅ 建立 POV 陳述：年輕投資者需要簡化的期貨學習路徑，因為傳統教材過於複雜導致他們放棄學習
✅ 驗證 POV 包含使用者、需求、洞察三個要素
✅ 驗證階段完成度達到 100%
```

### 階段 3：發想階段（Ideate）
```
✅ 進入發想階段，切換到發想教練
✅ 添加 15 個點子（製作短影音教學系列等）
✅ 驗證所有點子都包含標題和描述
✅ 驗證階段完成度達到 100%
```

### 階段 4：原型階段（Prototype）
```
✅ 進入原型階段，切換到原型教練
✅ 建立低保真原型（手繪線框圖：首頁包含 3 個 60 秒短影音）
✅ 驗證原型包含名稱、描述、類型、功能清單
✅ 驗證階段完成度達到 100%
```

### 階段 5：測試階段（Test）
```
✅ 進入測試階段，切換到測試教練
✅ 驗證能夠成功進入最後階段
```

### 最終驗證
```
✅ 所有階段進度正確標記（completed/in_progress）
✅ 專案包含完整資料：
   - 3+ 個觀察記錄
   - 1+ 個 POV 陳述
   - 15+ 個點子
   - 1+ 個原型
✅ 聊天歷史完整記錄（40+ 次對話）
✅ 專案名稱正確保存
```

## 🚀 執行測試

### 執行完整流程測試
```bash
# 執行所有整合測試
npm test -- src/hooks/__tests__/useDesignThinkingChat.integration.test.ts

# 執行所有測試（包含單元測試 + 整合測試）
npm test

# 執行測試並生成覆蓋率報告
npm run test:coverage
```

### 測試輸出範例
```
✅ 成功進入測試階段
✅ 完整設計思考流程測試通過！
📊 總共完成 40 次對話
📋 收集 3 個觀察
🎯 建立 1 個 POV
💡 產生 15 個點子
📦 建立 1 個原型

✓ src/hooks/__tests__/useDesignThinkingChat.integration.test.ts (3 tests) 653ms
  ✓ 應該能夠完成完整的設計思考流程（同理 → 定義 → 發想 → 原型 → 測試）
  ✓ 應該能夠在任何階段中途停止並儲存進度
  ✓ 應該能夠處理錯誤並保持專案狀態穩定

Test Files  3 passed (3)
Tests       38 passed (38)
```

## 📖 測試架構說明

### Mock Strategy

整合測試使用 **Mock API 回應** 策略：

```typescript
// Mock fetch API 回應
global.fetch = vi.fn().mockResolvedValueOnce({
  ok: true,
  body: {
    getReader: () => ({
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(
            '對話內容 + JSON action'
          ),
        })
        .mockResolvedValueOnce({ done: true }),
    }),
  },
});
```

### AI 回應格式

每個階段的 AI 回應都包含兩部分：

```
【對話內容】
很好的觀察！讓我記錄這個重要的痛點：
📌 **痛點**：年輕人覺得期貨很複雜，不知道從何開始學習

【JSON Action】
```json:action
{
  "type": "ADD_OBSERVATION",
  "data": {
    "content": "年輕人覺得期貨很複雜，不知道從何開始學習",
    "category": "pain_point"
  }
}
```
```

### Action 類型對照表

| Action 類型 | 階段 | 必要欄位 | 說明 |
|------------|------|---------|------|
| `ADD_OBSERVATION` | 同理心 | `content`, `category` | 添加使用者觀察記錄 |
| `ADD_POV` | 定義 | `user`, `need`, `insight`, `statement` | 建立 POV 陳述 |
| `ADD_IDEA` | 發想 | `title`, `description` | 添加創意點子 |
| `ADD_PROTOTYPE` | 原型 | `name`, `description`, `type`, `features` | 建立原型描述 |
| `NEXT_STAGE` | 任何 | - | 進入下一階段 |

## 🔧 自訂測試場景

### 範例：測試只有 1 個觀察就進入下一階段

```typescript
it('應該能夠在未達最低目標時手動進入下一階段', async () => {
  const { result } = renderHook(() => useDesignThinkingChat('測試專案'));

  await waitFor(() => {
    expect(result.current.isInitialized).toBe(true);
  });

  // 只添加 1 個觀察（最低要求是 3 個）
  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    body: {
      getReader: () => ({
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              '📌 **痛點**：只有一個觀察\n\n' +
              '```json:action\n' +
              JSON.stringify({
                type: 'ADD_OBSERVATION',
                data: { content: '只有一個觀察', category: 'pain_point' },
              }) +
              '\n```'
            ),
          })
          .mockResolvedValueOnce({ done: true }),
      }),
    },
  });

  await act(async () => {
    await result.current.sendMessage('只有一個觀察');
  });

  // 驗證未達成目標
  expect(result.current.canAdvance).toBe(false);
  expect(result.current.stageCompletion.empathize).toBeLessThan(100);

  // 手動進入下一階段
  await act(async () => {
    result.current.advanceToNextStage();
  });

  expect(result.current.projectState.currentStage).toBe('define');
});
```

### 範例：測試協作功能

```typescript
it('應該能夠記錄協作者資訊', async () => {
  const { result } = renderHook(() => useDesignThinkingChat('協作測試'));

  await waitFor(() => {
    expect(result.current.isInitialized).toBe(true);
  });

  // Mock 包含協作者資訊的觀察
  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    body: {
      getReader: () => ({
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              '```json:action\n' +
              JSON.stringify({
                type: 'ADD_OBSERVATION',
                data: {
                  content: '協作者的觀察',
                  category: 'insight',
                  collaboratorId: 'user-123',
                  collaboratorNickname: 'Alice',
                  collaboratorColor: '#3B82F6',
                },
              }) +
              '\n```'
            ),
          })
          .mockResolvedValueOnce({ done: true }),
      }),
    },
  });

  await act(async () => {
    await result.current.sendMessage('協作者的觀察');
  });

  const observation = result.current.projectState.observations[0];
  expect(observation.collaboratorNickname).toBe('Alice');
  expect(observation.collaboratorColor).toBe('#3B82F6');
});
```

## 📊 測試覆蓋率

執行覆蓋率測試：
```bash
npm run test:coverage
```

目前覆蓋率：
```
File                         | % Stmts | % Branch | % Funcs | % Lines |
-----------------------------|---------|----------|---------|---------|
All files                    |   75.00 |    51.72 |   81.81 |   78.87 |
 constants/prompts.ts        |  100.00 |   100.00 |  100.00 |  100.00 |
 lib/state-updater.ts        |   71.64 |    51.72 |   81.81 |   75.80 |
 hooks/useDesignThinkingChat | 待測試   | 待測試    | 待測試   | 待測試   |
```

## 🎓 最佳實踐

### 1. Mock 資料要符合實際格式
```typescript
// ❌ 錯誤：使用 content 欄位
{ type: 'ADD_POV', data: { content: '...' } }

// ✅ 正確：使用 statement 欄位
{ type: 'ADD_POV', data: {
  user: '年輕投資者',
  need: '簡化的學習路徑',
  insight: '傳統教材過於複雜',
  statement: '年輕投資者需要簡化的學習路徑，因為傳統教材過於複雜'
}}
```

### 2. 使用 act() 包裝狀態更新
```typescript
// ✅ 正確
await act(async () => {
  await result.current.sendMessage('訊息');
});

// ✅ 正確
await act(async () => {
  result.current.advanceToNextStage();
});
```

### 3. 使用 waitFor 等待非同步更新
```typescript
await waitFor(() => {
  expect(result.current.projectState.observations).toHaveLength(1);
});
```

### 4. 每個測試前清空 localStorage
```typescript
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
```

## 🐛 常見問題

### Q1: 測試失敗：activeCoach 是 'orchestrator' 而不是 'empathy'
**A:** 初始狀態的 activeCoach 預設是 'orchestrator'，需要手動切換到對應教練：
```typescript
await act(async () => {
  result.current.switchCoach('empathy');
});
```

### Q2: 測試失敗：POV/Prototype 沒有被添加
**A:** 檢查 Mock 資料的欄位名稱是否正確：
- POV 需要 `statement`（不是 `content`）
- Prototype 需要 `name`（不是 `content`）

### Q3: 出現 "An update to TestComponent inside a test was not wrapped in act(...)" 警告
**A:** 這是自動儲存功能的非關鍵警告，可以忽略。如果想移除，可以在測試中等待儲存完成：
```typescript
// 等待自動儲存完成（500ms 延遲 + 額外緩衝）
await new Promise((resolve) => setTimeout(resolve, 600));
```

## 📚 相關文檔

- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - 完整測試策略
- [TESTING_QUICK_START.md](./TESTING_QUICK_START.md) - 快速開始指南
- [TESTING_SUMMARY.md](./TESTING_SUMMARY.md) - 測試框架總結
- [tests/README.md](./tests/README.md) - 測試詳細說明

## 🎉 總結

完整流程整合測試提供：

✅ **自動化端對端測試** - 無需手動操作，一鍵完成 5 個階段測試
✅ **真實使用者場景** - 模擬真實的設計思考流程
✅ **快速回饋** - 2 秒內完成完整流程測試
✅ **可擴展性** - 易於添加新的測試場景
✅ **CI/CD 就緒** - 可整合至自動化部署流程

測試結果：**38/38 tests passed** ✨

---

**建立日期：** 2026-01-11
**測試版本：** Vitest 4.0.16
**維護者：** Design Thinking App Team
