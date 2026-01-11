# Design Thinking AI 教練系統 - 測試策略文檔

## 目錄
1. [測試金字塔](#測試金字塔)
2. [單元測試策略](#單元測試策略)
3. [整合測試策略](#整合測試策略)
4. [端對端測試策略](#端對端測試策略)
5. [提示詞測試策略](#提示詞測試策略)
6. [性能測試策略](#性能測試策略)
7. [CI/CD 整合](#cicd-整合)

---

## 測試金字塔

```
        /\
       /E2E\        10% - 端對端測試 (Playwright)
      /------\
     /整合測試 \     30% - 整合測試 (Vitest)
    /----------\
   /  單元測試   \   60% - 單元測試 (Vitest)
  /--------------\
```

### 測試覆蓋率目標
- **整體程式碼覆蓋率**: ≥ 80%
- **核心邏輯覆蓋率**: ≥ 95% (state-updater, prompts, hooks)
- **UI 元件覆蓋率**: ≥ 70%
- **API 路由覆蓋率**: ≥ 90%

---

## 單元測試策略

### 1. State Management 測試

**測試檔案**: `src/lib/__tests__/state-updater.test.ts`

**測試重點**:
- ✅ `parseActionsFromResponse` 正確解析 JSON action
- ✅ `cleanResponseContent` 正確移除 JSON 區塊
- ✅ `applyAction` 正確處理各種 action 類型
- ✅ `shouldAdvanceStage` 正確判斷階段進度
- ✅ `getStageCompletion` 正確計算完成度

**關鍵測試案例**:
```typescript
describe('parseActionsFromResponse', () => {
  it('應正確解析包含對話內容和 JSON action 的回應', () => {
    const response = `
很好的觀察！我已經記錄了：
📌 **洞察**：年輕人需要線上學習平台

\`\`\`json:action
{
  "type": "ADD_OBSERVATION",
  "data": {
    "content": "年輕人需要線上學習平台",
    "category": "need"
  }
}
\`\`\`
    `;

    const actions = parseActionsFromResponse(response);
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('ADD_OBSERVATION');
    expect(actions[0].data.category).toBe('need');
  });

  it('應能處理多個 JSON action', () => {
    // 測試同時輸出多個 action 的情況
  });

  it('應正確處理格式錯誤的 JSON', () => {
    // 測試容錯能力
  });
});
```

### 2. Prompt 邏輯測試

**測試檔案**: `src/constants/__tests__/prompts.test.ts`

**測試重點**:
- ✅ 所有教練的 prompt 都存在且非空
- ✅ STAGE_TO_COACH 映射正確
- ✅ COACH_CONFIG 包含所有必要欄位

### 3. Utility 函數測試

**測試檔案**: `src/lib/__tests__/storage.test.ts`

**測試重點**:
- ✅ localStorage 儲存/載入專案狀態
- ✅ 專案列表管理
- ✅ 時間格式化

---

## 整合測試策略

### 1. Hooks 整合測試

**測試檔案**: `src/hooks/__tests__/useDesignThinkingChat.test.ts`

**測試重點**:
- ✅ 發送訊息並正確更新狀態
- ✅ 切換教練和階段
- ✅ 自動儲存功能
- ✅ 階段完成度計算

**測試範例**:
```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDesignThinkingChat } from '../useDesignThinkingChat';

describe('useDesignThinkingChat', () => {
  it('應在發送訊息後更新聊天歷史', async () => {
    const { result } = renderHook(() => useDesignThinkingChat());

    await act(async () => {
      await result.current.sendMessage('測試訊息');
    });

    await waitFor(() => {
      expect(result.current.projectState.chatHistory).toHaveLength(2);
      expect(result.current.projectState.chatHistory[0].content).toBe('測試訊息');
    });
  });

  it('應在收到包含 JSON action 的回應後更新觀察記錄', async () => {
    // Mock fetch API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        body: createMockReadableStream(mockAIResponse),
      })
    );

    const { result } = renderHook(() => useDesignThinkingChat());

    await act(async () => {
      await result.current.sendMessage('我觀察到年輕人需要線上平台');
    });

    await waitFor(() => {
      expect(result.current.projectState.observations).toHaveLength(1);
      expect(result.current.projectState.observations[0].category).toBe('need');
    });
  });
});
```

### 2. API 路由測試

**測試檔案**: `src/app/api/chat/__tests__/route.test.ts`

**測試重點**:
- ✅ 正確建構 system prompt
- ✅ 階段指引正確更新
- ✅ 錯誤處理

---

## 端對端測試策略

### 使用 Playwright

**測試檔案**: `e2e/design-thinking-flow.spec.ts`

**測試場景**:

#### 1. 完整的 Design Thinking 流程
```typescript
import { test, expect } from '@playwright/test';

test('完整的同理心階段流程', async ({ page }) => {
  await page.goto('/');

  // 1. 建立新專案
  await page.click('button:has-text("新專案")');
  await page.fill('input[type="text"]', '期貨業 Design Thinking');
  await page.click('button:has-text("確定")');

  // 2. 選擇同理心教練
  await page.click('button:has-text("同理心教練")');

  // 3. 分享第一個觀察
  await page.fill('input[placeholder="輸入訊息..."]', '年輕人認為期貨風險太高');
  await page.click('button[type="submit"]');

  // 4. 等待 AI 回應
  await expect(page.locator('text=📌')).toBeVisible({ timeout: 10000 });

  // 5. 驗證觀察記錄已更新
  await page.click('button:has-text("進度")');
  await expect(page.locator('text=使用者觀察')).toBeVisible();
  await expect(page.locator('text=1')).toBeVisible(); // 觀察數量

  // 6. 繼續添加更多觀察直到達到 3 個
  // ... (重複步驟 3-5)

  // 7. 驗證不會在 3 個觀察後停止記錄
  await page.fill('input[placeholder="輸入訊息..."]', '第四個觀察');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=4')).toBeVisible();
});
```

#### 2. 協作功能測試
```typescript
test('多人協作流程', async ({ browser }) => {
  // 建立兩個瀏覽器 context 模擬兩個使用者
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // 使用者 1: 建立協作專案
  await page1.goto('/');
  await page1.click('button:has-text("協作")');
  // ... 取得邀請連結

  // 使用者 2: 加入協作專案
  await page2.goto(inviteLink);
  await page2.fill('input[placeholder="輸入暱稱"]', '協作者B');
  await page2.click('button:has-text("加入")');

  // 驗證即時同步
  await page1.fill('input', '使用者1的訊息');
  await page1.click('button[type="submit"]');

  await expect(page2.locator('text=使用者1的訊息')).toBeVisible({ timeout: 5000 });
});
```

#### 3. 錯誤處理測試
```typescript
test('應正確處理 API 錯誤', async ({ page }) => {
  // 模擬網路錯誤
  await page.route('**/api/chat', route => route.abort());

  await page.goto('/');
  await page.fill('input', '測試訊息');
  await page.click('button[type="submit"]');

  // 驗證錯誤訊息顯示
  await expect(page.locator('text=發生錯誤')).toBeVisible();
});
```

---

## 提示詞測試策略

### 1. 提示詞一致性測試

**目標**: 確保所有教練的提示詞遵循相同的格式規範

**測試檔案**: `tests/prompts/__tests__/prompt-consistency.test.ts`

```typescript
describe('提示詞一致性檢查', () => {
  it('所有教練提示詞都應包含 JSON action 格式說明', () => {
    Object.values(COACH_PROMPTS).forEach(prompt => {
      expect(prompt).toContain('json:action');
      expect(prompt).toContain('對話內容');
    });
  });

  it('同理心教練應強調不要在 3 個觀察後停止記錄', () => {
    expect(EMPATHY_COACH_PROMPT).toContain('即使已經達到 3 個觀察');
    expect(EMPATHY_COACH_PROMPT).toContain('仍然要繼續記錄');
  });
});
```

### 2. 提示詞效果測試 (使用 LLM-as-Judge)

**測試檔案**: `tests/prompts/__tests__/prompt-effectiveness.test.ts`

```typescript
/**
 * 使用 LLM-as-Judge 模式測試提示詞效果
 * 需要設定 OPENAI_API_KEY 或 ANTHROPIC_API_KEY
 */
describe('提示詞效果測試', () => {
  it('同理心教練應在收到觀察時同時輸出對話內容和 JSON', async () => {
    const response = await testPromptWithLLM(
      EMPATHY_COACH_PROMPT,
      '年輕人覺得期貨很複雜',
      {
        observations: [],
        currentStage: 'empathize'
      }
    );

    // 驗證回應格式
    expect(response).toMatch(/📌|💡|😞|⚡/); // 包含表情符號
    expect(response).toContain('```json:action'); // 包含 JSON action

    // 驗證 JSON 可解析
    const actions = parseActionsFromResponse(response);
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('ADD_OBSERVATION');
  });

  it('同理心教練在達到 3 個觀察後仍應繼續記錄', async () => {
    const response = await testPromptWithLLM(
      EMPATHY_COACH_PROMPT,
      '第四個觀察：年輕人需要更多教育資源',
      {
        observations: [
          { content: '觀察1', category: 'need' },
          { content: '觀察2', category: 'pain_point' },
          { content: '觀察3', category: 'insight' },
        ],
        currentStage: 'empathize'
      }
    );

    const actions = parseActionsFromResponse(response);
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('ADD_OBSERVATION');
  });
});
```

### 3. 提示詞版本控制與 A/B 測試

**建立提示詞版本檔案**: `src/constants/prompts.versions.ts`

```typescript
/**
 * 提示詞版本管理
 * 用於 A/B 測試和效果追蹤
 */
export const PROMPT_VERSIONS = {
  EMPATHY_COACH: {
    v1: `原始版本...`,
    v2: `改進版本 (2026-01-11): 加強 3 個觀察後繼續記錄的指引`,
    v3: `最新版本 (2026-01-11): 明確禁止只輸出對話或只輸出 JSON`,
    current: 'v3',
  },
};

// 測試用：可以切換版本進行比較
export function getPromptVersion(
  coachType: CoachType,
  version: string = 'current'
): string {
  // ...
}
```

---

## 性能測試策略

### 1. 負載測試

**工具**: k6 或 Artillery

**測試場景**:
```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // 暖身
    { duration: '3m', target: 50 },  // 正常負載
    { duration: '1m', target: 100 }, // 尖峰負載
    { duration: '1m', target: 0 },   // 降溫
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% 請求應在 5 秒內完成
    http_req_failed: ['rate<0.01'],    // 錯誤率低於 1%
  },
};

export default function () {
  const payload = JSON.stringify({
    messages: [
      { role: 'user', content: '年輕人覺得期貨很複雜' }
    ],
    projectState: {
      currentStage: 'empathize',
      observations: [],
      // ...
    },
  });

  const res = http.post('http://localhost:3000/api/chat', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  sleep(1);
}
```

### 2. AI 回應時間監控

**實作監控中介軟體**: `src/middleware/performance.ts`

```typescript
export async function measureAIResponseTime(
  request: Request,
  next: () => Promise<Response>
) {
  const start = Date.now();
  const response = await next();
  const duration = Date.now() - start;

  // 記錄到監控系統
  console.log(`[Performance] AI 回應時間: ${duration}ms`);

  // 警報：如果超過 10 秒
  if (duration > 10000) {
    console.warn(`[Performance] AI 回應過慢: ${duration}ms`);
  }

  return response;
}
```

---

## CI/CD 整合

### GitHub Actions 工作流程

**檔案**: `.github/workflows/test.yml`

```yaml
name: 自動化測試

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-test:
    name: 單元測試
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json

  integration-test:
    name: 整合測試
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:integration

  e2e-test:
    name: E2E 測試
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  prompt-test:
    name: 提示詞測試
    runs-on: ubuntu-latest
    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:prompts

  performance-test:
    name: 性能測試
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/k6-action@v0.3.1
        with:
          filename: tests/performance/load-test.js
```

---

## 測試資料管理

### 測試 Fixtures

**檔案**: `tests/fixtures/project-states.ts`

```typescript
/**
 * 標準測試資料
 */
export const TEST_FIXTURES = {
  // 空專案
  EMPTY_PROJECT: createInitialProjectState('測試專案'),

  // 有 3 個觀察的專案
  PROJECT_WITH_3_OBSERVATIONS: {
    ...createInitialProjectState('測試專案'),
    observations: [
      {
        id: '1',
        content: '年輕人覺得期貨風險高',
        category: 'pain_point',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        content: '加密貨幣 KYC 比較快',
        category: 'behavior',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        content: '需要線上學習平台',
        category: 'need',
        createdAt: new Date().toISOString(),
      },
    ],
  },

  // 完整的 Design Thinking 流程專案
  COMPLETE_PROJECT: {
    // ...
  },
};
```

---

## 測試執行命令

更新 `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:prompts": "vitest run --config vitest.prompts.config.ts",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:performance": "k6 run tests/performance/load-test.js",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

---

## 測試最佳實踐

### 1. 遵循 AAA 模式
- **Arrange**: 準備測試資料
- **Act**: 執行被測試的功能
- **Assert**: 驗證結果

### 2. 測試命名規範
```typescript
// ✅ 好的命名
it('應在收到包含 JSON action 的回應後更新觀察記錄', () => {});

// ❌ 不好的命名
it('test1', () => {});
```

### 3. 避免測試間相互依賴
每個測試應該獨立可執行

### 4. Mock 外部依賴
- Mock AI API 呼叫
- Mock Supabase 連線
- Mock localStorage

### 5. 定期更新測試
每次修改提示詞或核心邏輯時，同步更新測試

---

## 監控與警報

### 1. 測試失敗警報
- GitHub Actions 失敗時發送 Slack/Email 通知
- 標記失敗的 PR，禁止合併

### 2. 覆蓋率追蹤
- 使用 Codecov 追蹤覆蓋率趨勢
- 設定最低覆蓋率門檻 (80%)

### 3. 性能回歸檢測
- 比較 PR 前後的性能測試結果
- 如果回應時間增加超過 20%，發出警告

---

## 總結

這個測試策略涵蓋：
1. ✅ **單元測試** - 測試核心邏輯函數
2. ✅ **整合測試** - 測試 Hooks 和 API 路由
3. ✅ **E2E 測試** - 測試完整使用者流程
4. ✅ **提示詞測試** - 使用 LLM-as-Judge 驗證提示詞效果
5. ✅ **性能測試** - 負載測試和回應時間監控
6. ✅ **CI/CD 整合** - 自動化執行所有測試

**下一步**: 開始實作測試框架和第一批測試案例
