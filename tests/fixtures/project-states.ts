import { ProjectState, createInitialProjectState } from '@/types/design-thinking';

/**
 * 測試用的標準專案狀態 fixtures
 */

export const EMPTY_PROJECT = createInitialProjectState('測試專案');

export const PROJECT_WITH_1_OBSERVATION: ProjectState = {
  ...createInitialProjectState('測試專案'),
  observations: [
    {
      id: '1',
      content: '年輕人覺得期貨風險太高',
      category: 'pain_point',
      createdAt: '2026-01-11T10:00:00Z',
    },
  ],
};

export const PROJECT_WITH_3_OBSERVATIONS: ProjectState = {
  ...createInitialProjectState('測試專案'),
  observations: [
    {
      id: '1',
      content: '年輕人覺得期貨風險太高',
      category: 'pain_point',
      createdAt: '2026-01-11T10:00:00Z',
    },
    {
      id: '2',
      content: '加密貨幣 KYC 審核速度比期貨快',
      category: 'behavior',
      createdAt: '2026-01-11T10:05:00Z',
    },
    {
      id: '3',
      content: '年輕人需要線上學習平台',
      category: 'need',
      createdAt: '2026-01-11T10:10:00Z',
    },
  ],
};

export const PROJECT_WITH_5_OBSERVATIONS: ProjectState = {
  ...PROJECT_WITH_3_OBSERVATIONS,
  observations: [
    ...PROJECT_WITH_3_OBSERVATIONS.observations,
    {
      id: '4',
      content: '期貨有專業人員監管，比加密貨幣更可信',
      category: 'insight',
      createdAt: '2026-01-11T10:15:00Z',
    },
    {
      id: '5',
      content: '年輕人偏好使用手機 App 交易',
      category: 'behavior',
      createdAt: '2026-01-11T10:20:00Z',
    },
  ],
};

export const PROJECT_WITH_POV: ProjectState = {
  ...PROJECT_WITH_3_OBSERVATIONS,
  currentStage: 'define',
  activeCoach: 'define',
  povStatements: [
    {
      id: '1',
      user: '20-30 歲的數位原住民',
      need: '降低投資風險並獲得專業指導',
      insight: '他們認為期貨專業門檻高但比加密貨幣可信',
      statement:
        '20-30 歲的數位原住民需要降低投資風險並獲得專業指導，因為他們認為期貨專業門檻高但比加密貨幣可信',
      createdAt: '2026-01-11T11:00:00Z',
    },
  ],
};

export const PROJECT_WITH_IDEAS: ProjectState = {
  ...PROJECT_WITH_POV,
  currentStage: 'ideate',
  activeCoach: 'ideate',
  ideas: Array.from({ length: 10 }, (_, i) => ({
    id: `${i + 1}`,
    title: `點子 ${i + 1}: 創新解決方案`,
    description: `這是第 ${i + 1} 個創意點子的描述`,
    votes: Math.floor(Math.random() * 10),
    status: 'raw' as const,
    createdAt: new Date(2026, 0, 11, 12, i).toISOString(),
    tags: ['期貨', '年輕人', '數位化'],
  })),
};

export const PROJECT_WITH_15_IDEAS: ProjectState = {
  ...PROJECT_WITH_POV,
  currentStage: 'ideate',
  activeCoach: 'ideate',
  ideas: Array.from({ length: 15 }, (_, i) => ({
    id: `${i + 1}`,
    title: `點子 ${i + 1}`,
    description: `描述 ${i + 1}`,
    votes: 0,
    status: 'raw' as const,
    createdAt: new Date(2026, 0, 11, 12, i).toISOString(),
  })),
};

export const COMPLETE_DESIGN_THINKING_PROJECT: ProjectState = {
  ...createInitialProjectState('完整的 Design Thinking 專案'),
  currentStage: 'test',
  activeCoach: 'test',
  observations: PROJECT_WITH_5_OBSERVATIONS.observations,
  povStatements: PROJECT_WITH_POV.povStatements,
  ideas: PROJECT_WITH_15_IDEAS.ideas,
  prototypes: [
    {
      id: '1',
      name: '期貨學習 App 原型',
      description: '為年輕人設計的簡化版期貨學習平台',
      type: 'low_fidelity',
      features: [
        '互動式教學課程',
        '模擬交易環境',
        '風險評估工具',
        '社群討論區',
      ],
      feedbacks: [
        {
          id: '1',
          content: '介面很直觀',
          type: 'positive',
          source: '測試使用者A',
          createdAt: '2026-01-11T14:00:00Z',
        },
        {
          id: '2',
          content: '希望有更多實際案例',
          type: 'suggestion',
          source: '測試使用者B',
          createdAt: '2026-01-11T14:05:00Z',
        },
      ],
      createdAt: '2026-01-11T13:00:00Z',
      updatedAt: '2026-01-11T14:10:00Z',
    },
  ],
  stageProgress: [
    { stage: 'empathize', status: 'completed', completedTasks: [], notes: [] },
    { stage: 'define', status: 'completed', completedTasks: [], notes: [] },
    { stage: 'ideate', status: 'completed', completedTasks: [], notes: [] },
    { stage: 'prototype', status: 'completed', completedTasks: [], notes: [] },
    { stage: 'test', status: 'in_progress', completedTasks: [], notes: [] },
  ],
};

/**
 * Mock AI 回應範例
 */
export const MOCK_AI_RESPONSES = {
  // 正確格式：包含對話內容和 JSON action
  CORRECT_FORMAT: `
很好的觀察！我已經記錄了這個重要發現：

📌 **痛點**：年輕人覺得期貨風險太高，不敢輕易嘗試

這反映了風險認知的問題。讓我們繼續探討...

\`\`\`json:action
{
  "type": "ADD_OBSERVATION",
  "data": {
    "content": "年輕人覺得期貨風險太高，不敢輕易嘗試",
    "category": "pain_point"
  }
}
\`\`\`
  `,

  // 錯誤格式A：只有 JSON，沒有對話內容
  ONLY_JSON: `
讓我記錄這個觀察：

\`\`\`json:action
{
  "type": "ADD_OBSERVATION",
  "data": {
    "content": "年輕人需要線上學習平台",
    "category": "need"
  }
}
\`\`\`
  `,

  // 錯誤格式B：只有對話內容，沒有 JSON
  ONLY_DIALOGUE: `
很好的觀察！我已經記錄了這個需求：

⚡ **需求**：年輕人希望有線上學習平台，以便方便地學習期貨交易課程

這將使學習更靈活。如果你有更多觀察，隨時分享！
  `,

  // NEXT_STAGE 格式
  NEXT_STAGE: `
太棒了！我們已經收集了足夠的洞察。

{ "action": "NEXT_STAGE" }
  `,

  // 純對話，不需要記錄
  PURE_DIALOGUE: `
這是一個很好的問題！讓我們使用 5 Whys 技巧深入探討：

為什麼年輕人覺得期貨風險高？
→ 因為他們缺乏相關知識

為什麼他們缺乏相關知識？
→ ...

請繼續分享您的觀察！
  `,
};
