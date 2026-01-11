import { describe, it, expect } from 'vitest';
import {
  parseActionsFromResponse,
  cleanResponseContent,
  applyAction,
  shouldAdvanceStage,
  getStageCompletion,
} from '../state-updater';
import { createInitialProjectState } from '@/types/design-thinking';

describe('parseActionsFromResponse', () => {
  it('應正確解析包含對話內容和 JSON action 的回應', () => {
    const response = `
很好的觀察！我已經記錄了這個重要發現：

📌 **洞察**：年輕人認為期貨比加密貨幣更有保障，因為有專業人員監管

這個觀察點出了「信任感」的重要性。讓我們繼續探討...

\`\`\`json:action
{
  "type": "ADD_OBSERVATION",
  "data": {
    "content": "年輕人認為期貨比加密貨幣更有保障，因為有專業人員監管",
    "category": "insight"
  }
}
\`\`\`
    `;

    const actions = parseActionsFromResponse(response);

    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('ADD_OBSERVATION');
    expect(actions[0].data).toEqual({
      content: '年輕人認為期貨比加密貨幣更有保障，因為有專業人員監管',
      category: 'insight',
    });
  });

  it('應能處理多個 JSON action', () => {
    const response = `
我記錄了兩個觀察：

\`\`\`json:action
{
  "type": "ADD_OBSERVATION",
  "data": {
    "content": "觀察1",
    "category": "need"
  }
}
\`\`\`

\`\`\`json:action
{
  "type": "ADD_OBSERVATION",
  "data": {
    "content": "觀察2",
    "category": "pain_point"
  }
}
\`\`\`
    `;

    const actions = parseActionsFromResponse(response);

    expect(actions).toHaveLength(2);
    expect(actions[0].data.content).toBe('觀察1');
    expect(actions[1].data.content).toBe('觀察2');
  });

  it('應正確處理格式錯誤的 JSON', () => {
    const response = `
\`\`\`json:action
{
  "type": "ADD_OBSERVATION"
  "data": { // 缺少逗號，JSON 格式錯誤
    "content": "測試"
  }
}
\`\`\`
    `;

    const actions = parseActionsFromResponse(response);

    // 應該返回空陣列，不會崩潰
    expect(actions).toHaveLength(0);
  });

  it('應正確解析 NEXT_STAGE action', () => {
    const response = '{ "action": "NEXT_STAGE" }';

    const actions = parseActionsFromResponse(response);

    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('NEXT_STAGE');
  });

  it('應能處理沒有 action 的純對話回應', () => {
    const response = '這是一個很好的問題！讓我們深入探討...';

    const actions = parseActionsFromResponse(response);

    expect(actions).toHaveLength(0);
  });
});

describe('cleanResponseContent', () => {
  it('應移除 JSON action 區塊，保留對話內容', () => {
    const response = `
很好的觀察！我已經記錄了：

📌 **洞察**：年輕人需要線上學習平台

這將使學習更靈活。

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

    const cleaned = cleanResponseContent(response);

    expect(cleaned).not.toContain('```json:action');
    expect(cleaned).not.toContain('ADD_OBSERVATION');
    expect(cleaned).toContain('很好的觀察');
    expect(cleaned).toContain('📌 **洞察**');
    expect(cleaned).toContain('這將使學習更靈活');
  });

  it('應移除 orchestrator 的 NEXT_STAGE 格式', () => {
    const response = '已達成目標 { "action": "NEXT_STAGE" }';

    const cleaned = cleanResponseContent(response);

    expect(cleaned).not.toContain('NEXT_STAGE');
    expect(cleaned).toContain('已達成目標');
  });
});

describe('applyAction', () => {
  it('應正確添加觀察記錄', () => {
    const initialState = createInitialProjectState('測試專案');

    const action = {
      type: 'ADD_OBSERVATION' as const,
      data: {
        content: '年輕人覺得期貨風險太高',
        category: 'pain_point' as const,
      },
    };

    const newState = applyAction(initialState, action);

    expect(newState.observations).toHaveLength(1);
    expect(newState.observations[0].content).toBe('年輕人覺得期貨風險太高');
    expect(newState.observations[0].category).toBe('pain_point');
    expect(newState.observations[0].id).toBeDefined();
    expect(newState.observations[0].createdAt).toBeDefined();
  });

  it('應正確添加 POV 陳述', () => {
    const initialState = createInitialProjectState('測試專案');

    const action = {
      type: 'ADD_POV' as const,
      data: {
        user: '年輕投資者',
        need: '降低風險',
        insight: '他們缺乏專業知識',
        statement: '年輕投資者需要降低風險，因為他們缺乏專業知識',
      },
    };

    const newState = applyAction(initialState, action);

    expect(newState.povStatements).toHaveLength(1);
    expect(newState.povStatements[0].statement).toBe(
      '年輕投資者需要降低風險，因為他們缺乏專業知識'
    );
  });

  it('應正確處理 NEXT_STAGE action', () => {
    const initialState = createInitialProjectState('測試專案');
    initialState.currentStage = 'empathize';
    initialState.activeCoach = 'empathy';

    const action = {
      type: 'NEXT_STAGE' as const,
    };

    const newState = applyAction(initialState, action);

    expect(newState.currentStage).toBe('define');
    expect(newState.activeCoach).toBe('define');

    // 檢查階段進度更新
    const empathizeProgress = newState.stageProgress.find(
      (sp) => sp.stage === 'empathize'
    );
    const defineProgress = newState.stageProgress.find(
      (sp) => sp.stage === 'define'
    );

    expect(empathizeProgress?.status).toBe('completed');
    expect(defineProgress?.status).toBe('in_progress');
  });

  it('應在 data 為空時不添加記錄', () => {
    const initialState = createInitialProjectState('測試專案');

    const action = {
      type: 'ADD_OBSERVATION' as const,
      data: {
        content: '',
        category: 'need' as const,
      },
    };

    const newState = applyAction(initialState, action);

    expect(newState.observations).toHaveLength(0);
  });
});

describe('shouldAdvanceStage', () => {
  it('同理心階段：應在達到 3 個觀察時返回 true', () => {
    const state = createInitialProjectState('測試專案');
    state.currentStage = 'empathize';
    state.observations = [
      {
        id: '1',
        content: '觀察1',
        category: 'need',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        content: '觀察2',
        category: 'pain_point',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        content: '觀察3',
        category: 'insight',
        createdAt: new Date().toISOString(),
      },
    ];

    const result = shouldAdvanceStage(state);

    expect(result).toBe(true);
  });

  it('同理心階段：應在少於 3 個觀察時返回 false', () => {
    const state = createInitialProjectState('測試專案');
    state.currentStage = 'empathize';
    state.observations = [
      {
        id: '1',
        content: '觀察1',
        category: 'need',
        createdAt: new Date().toISOString(),
      },
    ];

    const result = shouldAdvanceStage(state);

    expect(result).toBe(false);
  });

  it('同理心階段：應在超過 3 個觀察時仍返回 true', () => {
    const state = createInitialProjectState('測試專案');
    state.currentStage = 'empathize';
    state.observations = Array.from({ length: 5 }, (_, i) => ({
      id: `${i + 1}`,
      content: `觀察${i + 1}`,
      category: 'need' as const,
      createdAt: new Date().toISOString(),
    }));

    const result = shouldAdvanceStage(state);

    expect(result).toBe(true);
  });

  it('發想階段：應在達到 15 個點子時返回 true', () => {
    const state = createInitialProjectState('測試專案');
    state.currentStage = 'ideate';
    state.ideas = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      title: `點子${i + 1}`,
      description: '描述',
      votes: 0,
      status: 'raw' as const,
      createdAt: new Date().toISOString(),
    }));

    const result = shouldAdvanceStage(state);

    expect(result).toBe(true);
  });
});

describe('getStageCompletion', () => {
  it('應正確計算同理心階段完成度', () => {
    const state = createInitialProjectState('測試專案');
    state.observations = [
      {
        id: '1',
        content: '觀察1',
        category: 'need',
        createdAt: new Date().toISOString(),
      },
    ];

    const completion = getStageCompletion(state);

    expect(completion.empathize).toBeCloseTo(33.33, 1); // 1/3 * 100
  });

  it('應在達到目標時返回 100', () => {
    const state = createInitialProjectState('測試專案');
    state.observations = Array.from({ length: 3 }, (_, i) => ({
      id: `${i + 1}`,
      content: `觀察${i + 1}`,
      category: 'need' as const,
      createdAt: new Date().toISOString(),
    }));

    const completion = getStageCompletion(state);

    expect(completion.empathize).toBe(100);
  });

  it('應在超過目標時仍返回 100', () => {
    const state = createInitialProjectState('測試專案');
    state.observations = Array.from({ length: 5 }, (_, i) => ({
      id: `${i + 1}`,
      content: `觀察${i + 1}`,
      category: 'need' as const,
      createdAt: new Date().toISOString(),
    }));

    const completion = getStageCompletion(state);

    expect(completion.empathize).toBe(100); // Math.min(100, ...)
  });

  it('應正確計算發想階段完成度', () => {
    const state = createInitialProjectState('測試專案');
    state.ideas = Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      title: `點子${i + 1}`,
      description: '描述',
      votes: 0,
      status: 'raw' as const,
      createdAt: new Date().toISOString(),
    }));

    const completion = getStageCompletion(state);

    expect(completion.ideate).toBeCloseTo(66.67, 1); // 10/15 * 100
  });
});
