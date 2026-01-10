import {
  ProjectState,
  UserObservation,
  POVStatement,
  Idea,
  Prototype,
  DesignThinkingStage,
} from '@/types/design-thinking';
import { STAGE_TO_COACH } from '@/constants/prompts';

// Action 類型定義
export type ActionType =
  | 'ADD_OBSERVATION'
  | 'ADD_POV'
  | 'ADD_IDEA'
  | 'ADD_PROTOTYPE'
  | 'ADD_FEEDBACK'
  | 'NEXT_STAGE'
  | 'UPDATE_STAGE_PROGRESS';

export interface Action {
  type: ActionType;
  data?: Record<string, unknown>;
}

// 從 AI 回應中解析 JSON action
export function parseActionsFromResponse(response: string): Action[] {
  const actions: Action[] = [];

  // 匹配 ```json:action ... ``` 格式
  const actionPattern = /```json:action\s*([\s\S]*?)```/g;
  let match;

  while ((match = actionPattern.exec(response)) !== null) {
    try {
      const jsonStr = match[1].trim();
      const action = JSON.parse(jsonStr) as Action;
      if (action.type) {
        actions.push(action);
      }
    } catch (e) {
      console.error('Failed to parse action JSON:', e);
    }
  }

  // 也檢查 orchestrator 的 NEXT_STAGE 格式
  if (response.includes('"action"') && response.includes('"NEXT_STAGE"')) {
    const nextStagePattern = /\{\s*"action"\s*:\s*"NEXT_STAGE"\s*\}/;
    if (nextStagePattern.test(response)) {
      actions.push({ type: 'NEXT_STAGE' });
    }
  }

  return actions;
}

// 移除回應中的 action JSON 區塊，只保留對話內容
export function cleanResponseContent(response: string): string {
  return response
    .replace(/```json:action\s*[\s\S]*?```/g, '')
    .replace(/\{\s*"action"\s*:\s*"NEXT_STAGE"\s*\}/g, '')
    .trim();
}

// 取得下一個階段
function getNextStage(currentStage: DesignThinkingStage): DesignThinkingStage {
  const stages: DesignThinkingStage[] = ['empathize', 'define', 'ideate', 'prototype', 'test'];
  const currentIndex = stages.indexOf(currentStage);
  if (currentIndex < stages.length - 1) {
    return stages[currentIndex + 1];
  }
  return currentStage; // 已經是最後階段
}

// 應用單個 action 到專案狀態
export function applyAction(state: ProjectState, action: Action): ProjectState {
  const now = new Date().toISOString();

  switch (action.type) {
    case 'ADD_OBSERVATION': {
      const data = action.data as {
        content: string;
        category: 'pain_point' | 'behavior' | 'need' | 'insight';
        source?: string;
      };

      if (!data?.content) return state;

      const newObservation: UserObservation = {
        id: crypto.randomUUID(),
        content: data.content,
        category: data.category || 'insight',
        createdAt: now,
        source: data.source,
      };

      return {
        ...state,
        observations: [...state.observations, newObservation],
        updatedAt: now,
        stageProgress: updateStageProgress(state.stageProgress, 'empathize', 'in_progress'),
      };
    }

    case 'ADD_POV': {
      const data = action.data as {
        user: string;
        need: string;
        insight: string;
        statement: string;
      };

      if (!data?.statement) return state;

      const newPOV: POVStatement = {
        id: crypto.randomUUID(),
        user: data.user || '',
        need: data.need || '',
        insight: data.insight || '',
        statement: data.statement,
        createdAt: now,
      };

      return {
        ...state,
        povStatements: [...state.povStatements, newPOV],
        updatedAt: now,
        stageProgress: updateStageProgress(state.stageProgress, 'define', 'in_progress'),
      };
    }

    case 'ADD_IDEA': {
      const data = action.data as {
        title: string;
        description: string;
        tags?: string[];
      };

      if (!data?.title) return state;

      const newIdea: Idea = {
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description || '',
        votes: 0,
        status: 'raw',
        createdAt: now,
        tags: data.tags,
      };

      return {
        ...state,
        ideas: [...state.ideas, newIdea],
        updatedAt: now,
        stageProgress: updateStageProgress(state.stageProgress, 'ideate', 'in_progress'),
      };
    }

    case 'ADD_PROTOTYPE': {
      const data = action.data as {
        name: string;
        description: string;
        type?: 'low_fidelity' | 'medium_fidelity' | 'high_fidelity';
        features?: string[];
      };

      if (!data?.name) return state;

      const newPrototype: Prototype = {
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description || '',
        type: data.type || 'low_fidelity',
        features: data.features || [],
        feedbacks: [],
        createdAt: now,
        updatedAt: now,
      };

      return {
        ...state,
        prototypes: [...state.prototypes, newPrototype],
        updatedAt: now,
        stageProgress: updateStageProgress(state.stageProgress, 'prototype', 'in_progress'),
      };
    }

    case 'NEXT_STAGE': {
      const nextStage = getNextStage(state.currentStage);
      const nextCoach = STAGE_TO_COACH[nextStage];

      return {
        ...state,
        currentStage: nextStage,
        activeCoach: nextCoach,
        updatedAt: now,
        stageProgress: state.stageProgress.map((sp) => {
          if (sp.stage === state.currentStage) {
            return { ...sp, status: 'completed' as const };
          }
          if (sp.stage === nextStage) {
            return { ...sp, status: 'in_progress' as const };
          }
          return sp;
        }),
      };
    }

    default:
      return state;
  }
}

// 應用多個 actions
export function applyActions(state: ProjectState, actions: Action[]): ProjectState {
  return actions.reduce((currentState, action) => applyAction(currentState, action), state);
}

// 更新階段進度
function updateStageProgress(
  stageProgress: ProjectState['stageProgress'],
  stage: DesignThinkingStage,
  status: 'not_started' | 'in_progress' | 'completed'
) {
  return stageProgress.map((sp) => {
    if (sp.stage === stage && sp.status === 'not_started') {
      return { ...sp, status };
    }
    return sp;
  });
}

// 檢查是否應該自動進入下一階段
export function shouldAdvanceStage(state: ProjectState): boolean {
  const { currentStage, observations, povStatements, ideas, prototypes } = state;

  switch (currentStage) {
    case 'empathize':
      return observations.length >= 3;
    case 'define':
      return povStatements.length >= 1;
    case 'ideate':
      return ideas.length >= 15;
    case 'prototype':
      return prototypes.length >= 1;
    case 'test':
      // 測試階段不自動進入下一階段
      return false;
    default:
      return false;
  }
}

// 取得階段完成度百分比
export function getStageCompletion(state: ProjectState): Record<DesignThinkingStage, number> {
  const { observations, povStatements, ideas, prototypes } = state;

  return {
    empathize: Math.min(100, (observations.length / 3) * 100),
    define: povStatements.length >= 1 ? 100 : 0,
    ideate: Math.min(100, (ideas.length / 15) * 100),
    prototype: prototypes.length >= 1 ? 100 : 0,
    test: 0, // 測試階段需要手動評估
  };
}
