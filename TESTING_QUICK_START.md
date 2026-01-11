# 測試快速開始指南

## 🚀 快速上手

### 1. 安裝測試依賴

```bash
cd design-thinking-app

# 安裝所有測試相關的依賴
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom msw
```

### 2. 執行現有測試

```bash
# 執行所有測試
npm test

# 查看覆蓋率
npm run test:coverage

# 開啟互動式 UI
npm run test:ui
```

### 3. 驗證測試設定

測試應該會執行並顯示類似以下的結果：

```
✓ src/lib/__tests__/state-updater.test.ts (25)
  ✓ parseActionsFromResponse (5)
  ✓ cleanResponseContent (2)
  ✓ applyAction (4)
  ✓ shouldAdvanceStage (3)
  ✓ getStageCompletion (4)

✓ src/constants/__tests__/prompts.test.ts (12)
  ✓ 教練提示詞配置 (3)
  ✓ 提示詞一致性檢查 (4)
  ✓ 提示詞長度檢查 (2)
  ✓ 提示詞關鍵字檢查 (5)

Test Files  2 passed (2)
Tests  37 passed (37)
```

---

## 📝 常用測試命令

| 命令 | 說明 |
|------|------|
| `npm test` | 執行所有測試 |
| `npm run test:watch` | 監視模式（自動重新執行） |
| `npm run test:coverage` | 生成覆蓋率報告 |
| `npm run test:ui` | 開啟 Vitest UI |
| `npm test -- state-updater` | 只執行包含 "state-updater" 的測試 |

---

## 🐛 修復現有 BUG 的測試驗證

### BUG 1: 觀察記錄顯示空白

**測試檔案**: `src/lib/__tests__/state-updater.test.ts`

**驗證測試**:
```typescript
it('應正確解析包含對話內容和 JSON action 的回應', () => {
  const response = `
很好的觀察！我已經記錄了：
📌 **洞察**：年輕人需要線上平台
\`\`\`json:action
{"type": "ADD_OBSERVATION", "data": {...}}
\`\`\`
  `;

  const actions = parseActionsFromResponse(response);
  expect(actions).toHaveLength(1);  // ✅ 應該能解析出 action

  const cleaned = cleanResponseContent(response);
  expect(cleaned).toContain('很好的觀察'); // ✅ 對話內容保留
  expect(cleaned).not.toContain('json:action'); // ✅ JSON 被移除
});
```

### BUG 2: 達到 3 個觀察後停止記錄

**測試檔案**: `src/lib/__tests__/state-updater.test.ts`

**驗證測試**:
```typescript
it('同理心階段：應在超過 3 個觀察時仍返回 true', () => {
  const state = {
    ...createInitialProjectState('測試'),
    currentStage: 'empathize',
    observations: Array.from({ length: 5 }, (_, i) => ({
      id: `${i}`,
      content: `觀察${i}`,
      category: 'need',
      createdAt: new Date().toISOString(),
    })),
  };

  const canAdvance = shouldAdvanceStage(state);
  expect(canAdvance).toBe(true); // ✅ 5 個觀察仍可進入下一階段

  // ✅ 但不應自動停止記錄（這由提示詞控制）
});
```

### BUG 3: AI 只輸出對話或只輸出 JSON

**測試檔案**: `tests/fixtures/project-states.ts` (MOCK_AI_RESPONSES)

**使用 fixtures 驗證**:
```typescript
import { MOCK_AI_RESPONSES } from '@/tests/fixtures/project-states';

// ✅ 正確格式應該兩者都有
expect(MOCK_AI_RESPONSES.CORRECT_FORMAT).toContain('📌');
expect(MOCK_AI_RESPONSES.CORRECT_FORMAT).toContain('json:action');

// ❌ 錯誤格式 A - 只有 JSON
expect(MOCK_AI_RESPONSES.ONLY_JSON).toContain('json:action');
expect(MOCK_AI_RESPONSES.ONLY_JSON).not.toContain('📌');

// ❌ 錯誤格式 B - 只有對話
expect(MOCK_AI_RESPONSES.ONLY_DIALOGUE).toContain('📌');
expect(MOCK_AI_RESPONSES.ONLY_DIALOGUE).not.toContain('json:action');
```

---

## 📊 覆蓋率報告

執行 `npm run test:coverage` 後，會生成 HTML 報告：

```bash
# 開啟覆蓋率報告
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

**覆蓋率目標**:
- 🎯 整體：≥ 80%
- 🎯 核心邏輯 (state-updater, prompts)：≥ 95%
- 🎯 UI 元件：≥ 70%
- 🎯 API 路由：≥ 90%

---

## 🔄 持續整合 (CI)

測試會在以下情況自動執行：
1. **Push 到 main/develop 分支**
2. **建立 Pull Request**
3. **每次提交**

GitHub Actions 會：
- ✅ 執行所有測試
- ✅ 檢查覆蓋率是否達標
- ✅ 執行程式碼檢查 (lint)
- ✅ 驗證建置是否成功

---

## 📚 下一步

1. **閱讀完整測試策略**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
2. **查看測試範例**: `src/lib/__tests__/state-updater.test.ts`
3. **使用測試 fixtures**: `tests/fixtures/project-states.ts`
4. **撰寫新測試**: 參考 `tests/README.md`

---

## ❓ 常見問題

### Q: 為什麼要寫測試？

A: 測試可以：
- 🐛 **儘早發現 BUG**：在開發階段就抓出問題
- 🔒 **防止回歸**：確保修復的 BUG 不會再出現
- 📖 **文件化**：測試就是最好的使用範例
- 🚀 **加速開發**：自信地重構和添加功能

### Q: 測試要寫到什麼程度？

A: 遵循測試金字塔：
- 60% 單元測試（快速、穩定）
- 30% 整合測試（測試模組間互動）
- 10% E2E 測試（測試完整流程）

### Q: 如何測試 AI 提示詞？

A: 使用以下方法：
1. **靜態檢查**：驗證提示詞格式、關鍵字
2. **LLM-as-Judge**：讓另一個 AI 評估提示詞效果
3. **回歸測試**：記錄好的回應，確保提示詞修改後仍保持品質

### Q: 測試失敗怎麼辦？

A:
1. 閱讀錯誤訊息，定位問題
2. 使用 `console.log` 或 debugger
3. 檢查測試資料是否正確
4. 確認程式碼邏輯與測試預期一致

---

## 🎯 測試檢查清單

在提交 PR 前，確保：

- [ ] 所有測試通過 (`npm test`)
- [ ] 覆蓋率達標 (`npm run test:coverage`)
- [ ] 程式碼檢查通過 (`npm run lint`)
- [ ] 建置成功 (`npm run build`)
- [ ] 新增的程式碼有對應的測試
- [ ] 測試具有描述性的名稱
- [ ] 沒有被略過的測試 (`.skip` 或 `.only`)

---

Happy Testing! 🧪✨
