# 測試說明

## 安裝測試依賴

```bash
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom msw
```

## 執行測試

### 執行所有測試
```bash
npm test
```

### 執行單元測試
```bash
npm run test:unit
```

### 監視模式（開發時使用）
```bash
npm run test:watch
```

### 生成覆蓋率報告
```bash
npm run test:coverage
```

### 開啟 UI 介面
```bash
npm run test:ui
```

## 測試檔案結構

```
design-thinking-app/
├── src/
│   ├── lib/
│   │   └── __tests__/
│   │       └── state-updater.test.ts
│   ├── constants/
│   │   └── __tests__/
│   │       └── prompts.test.ts
│   └── hooks/
│       └── __tests__/
│           └── useDesignThinkingChat.test.ts
├── tests/
│   ├── setup.ts              # 測試設定
│   └── fixtures/             # 測試資料
│       └── project-states.ts
└── vitest.config.ts          # Vitest 配置
```

## 撰寫新測試

### 單元測試範例

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myModule';

describe('myFunction', () => {
  it('應該正確處理輸入', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### 使用 Fixtures

```typescript
import { PROJECT_WITH_3_OBSERVATIONS } from '@/tests/fixtures/project-states';

describe('專案狀態測試', () => {
  it('應該有 3 個觀察記錄', () => {
    expect(PROJECT_WITH_3_OBSERVATIONS.observations).toHaveLength(3);
  });
});
```

## 覆蓋率目標

- 整體程式碼覆蓋率：≥ 80%
- 核心邏輯覆蓋率：≥ 95%
- UI 元件覆蓋率：≥ 70%
- API 路由覆蓋率：≥ 90%

## CI/CD

測試會在以下情況自動執行：
- Push 到 main 或 develop 分支
- 建立 Pull Request
- 可在 GitHub Actions 中查看測試結果

## 常見問題

### Q: 測試失敗但本地可以執行？
A: 確保已清除快取：`npm run test -- --clearCache`

### Q: 如何只執行特定測試？
A: 使用 `npm test -- state-updater` 只執行包含 "state-updater" 的測試

### Q: 如何 debug 測試？
A: 在測試中添加 `console.log`，或使用 `npm run test:ui` 開啟 UI 介面

## 相關資源

- [Vitest 文檔](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [測試策略文檔](../TESTING_STRATEGY.md)
