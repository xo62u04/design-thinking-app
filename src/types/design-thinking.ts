/**
 * Design Thinking 專案狀態類型定義
 */

// 設計思維五大階段
export type DesignThinkingStage =
  | 'empathize'   // 同理心
  | 'define'      // 定義
  | 'ideate'      // 發想
  | 'prototype'   // 原型
  | 'test';       // 測試

// 使用者觀察記錄
export interface UserObservation {
  id: string;
  content: string;
  category: 'pain_point' | 'behavior' | 'need' | 'insight';
  createdAt: string;
  source?: string; // 觀察來源（訪談、觀察等）
  // 協作者資訊
  collaboratorId?: string;
  collaboratorNickname?: string;
  collaboratorColor?: string;
}

// POV (Point of View) 觀點陳述
export interface POVStatement {
  id: string;
  user: string;        // 使用者描述
  need: string;        // 需求描述
  insight: string;     // 洞察描述
  statement: string;   // 完整 POV 陳述
  createdAt: string;
  // 協作者資訊
  collaboratorId?: string;
  collaboratorNickname?: string;
  collaboratorColor?: string;
}

// 問卷調查
export interface Survey {
  id: string;
  question: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'open_ended';
  options?: string[];           // 多選選項 (當 type 為 multiple_choice 時使用)
  responses: SurveyResponse[];  // 回答記錄
  createdAt: string;
  // 協作者資訊
  collaboratorId?: string;
  collaboratorNickname?: string;
  collaboratorColor?: string;
}

// 問卷回答
export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentName: string;       // 受訪者姓名
  response: string | number;    // 答案 (文字、選項或評分)
  createdAt: string;
}

// 點子項目
export interface Idea {
  id: string;
  title: string;
  description: string;
  votes: number;
  status: 'raw' | 'refined' | 'selected' | 'discarded';
  createdAt: string;
  tags?: string[];
  // 協作者資訊
  collaboratorId?: string;
  collaboratorNickname?: string;
  collaboratorColor?: string;
}

// 原型描述
export interface Prototype {
  id: string;
  name: string;
  description: string;
  type: 'low_fidelity' | 'medium_fidelity' | 'high_fidelity';
  features: string[];
  feedbacks: PrototypeFeedback[];
  whiteboardId?: string; // 關聯的白板 ID
  createdAt: string;
  updatedAt: string;
  // 協作者資訊
  collaboratorId?: string;
  collaboratorNickname?: string;
  collaboratorColor?: string;
}

// 原型回饋
export interface PrototypeFeedback {
  id: string;
  content: string;
  type: 'positive' | 'negative' | 'suggestion';
  source: string;
  createdAt: string;
}

// 白板（協作繪圖）
export interface Whiteboard {
  id: string;
  projectId: string;
  prototypeId?: string;
  name: string;
  elements: any[]; // Excalidraw 元素陣列
  appState: Record<string, any>; // Excalidraw 應用狀態
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// 階段進度
export interface StageProgress {
  stage: DesignThinkingStage;
  status: 'not_started' | 'in_progress' | 'completed';
  completedTasks: string[];
  notes: string[];
}

// 對話訊息
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  coachType?: CoachType;
  timestamp: string;
  // 協作者資訊 (多人協作時使用)
  collaboratorId?: string;
  collaboratorNickname?: string;
  collaboratorColor?: string;
}

// 協作者
export interface Collaborator {
  id: string;
  projectId: string;
  nickname: string;
  color: string;
  isOnline: boolean;
  lastSeenAt: string;
  createdAt: string;
}

// 協作者顏色配置
export const COLLABORATOR_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
] as const;

// 協作 Session (存在 localStorage)
export interface CollaborationSession {
  projectId: string;
  collaboratorId: string;
  nickname: string;
  color: string;
  inviteCode: string;
}

// 教練類型
export type CoachType =
  | 'empathy'     // 同理心教練
  | 'define'      // 定義教練
  | 'survey'      // 調查教練
  | 'ideate'      // 發想教練
  | 'prototype'   // 原型教練
  | 'test'        // 測試教練
  | 'orchestrator'; // 中控 Agent

// 教練資訊
export interface Coach {
  type: CoachType;
  name: string;
  description: string;
  icon: string;
  color: string;
  stage?: DesignThinkingStage;
}

// 專案狀態 (主要 JSON Schema)
export interface ProjectState {
  // 專案基本資訊
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;

  // 協作資訊
  inviteCode?: string;              // 邀請碼
  collaborators?: Collaborator[];   // 協作者列表
  isCollaborative?: boolean;        // 是否為協作模式

  // 當前階段
  currentStage: DesignThinkingStage;

  // 各階段產出
  observations: UserObservation[];      // 使用者觀察
  povStatements: POVStatement[];        // POV 陳述
  surveys: Survey[];                    // 問卷調查
  ideas: Idea[];                        // 點子清單
  prototypes: Prototype[];              // 原型描述

  // 階段進度追蹤
  stageProgress: StageProgress[];

  // 對話歷史
  chatHistory: ChatMessage[];

  // 當前活躍的教練
  activeCoach: CoachType;
}

// 專案狀態 JSON Schema (用於驗證)
export const ProjectStateSchema = {
  type: 'object',
  required: [
    'id',
    'name',
    'currentStage',
    'observations',
    'povStatements',
    'ideas',
    'prototypes',
    'stageProgress',
    'chatHistory',
    'activeCoach'
  ],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    currentStage: {
      type: 'string',
      enum: ['empathize', 'define', 'ideate', 'prototype', 'test']
    },
    observations: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'content', 'category', 'createdAt'],
        properties: {
          id: { type: 'string' },
          content: { type: 'string' },
          category: {
            type: 'string',
            enum: ['pain_point', 'behavior', 'need', 'insight']
          },
          createdAt: { type: 'string', format: 'date-time' },
          source: { type: 'string' }
        }
      }
    },
    povStatements: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'user', 'need', 'insight', 'statement', 'createdAt'],
        properties: {
          id: { type: 'string' },
          user: { type: 'string' },
          need: { type: 'string' },
          insight: { type: 'string' },
          statement: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    },
    ideas: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'title', 'description', 'votes', 'status', 'createdAt'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          votes: { type: 'number' },
          status: {
            type: 'string',
            enum: ['raw', 'refined', 'selected', 'discarded']
          },
          createdAt: { type: 'string', format: 'date-time' },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    prototypes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'description', 'type', 'features', 'feedbacks', 'createdAt'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          type: {
            type: 'string',
            enum: ['low_fidelity', 'medium_fidelity', 'high_fidelity']
          },
          features: { type: 'array', items: { type: 'string' } },
          feedbacks: { type: 'array' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    },
    stageProgress: {
      type: 'array',
      items: {
        type: 'object',
        required: ['stage', 'status', 'completedTasks', 'notes'],
        properties: {
          stage: {
            type: 'string',
            enum: ['empathize', 'define', 'ideate', 'prototype', 'test']
          },
          status: {
            type: 'string',
            enum: ['not_started', 'in_progress', 'completed']
          },
          completedTasks: { type: 'array', items: { type: 'string' } },
          notes: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    chatHistory: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'role', 'content', 'timestamp'],
        properties: {
          id: { type: 'string' },
          role: { type: 'string', enum: ['user', 'assistant', 'system'] },
          content: { type: 'string' },
          coachType: {
            type: 'string',
            enum: ['empathy', 'define', 'ideate', 'prototype', 'test', 'orchestrator']
          },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    },
    activeCoach: {
      type: 'string',
      enum: ['empathy', 'define', 'ideate', 'prototype', 'test', 'orchestrator']
    }
  }
} as const;

// 初始專案狀態
export const createInitialProjectState = (name: string, description: string = ''): ProjectState => ({
  id: crypto.randomUUID(),
  name,
  description,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  currentStage: 'empathize',
  observations: [],
  povStatements: [],
  surveys: [],
  ideas: [],
  prototypes: [],
  stageProgress: [
    { stage: 'empathize', status: 'not_started', completedTasks: [], notes: [] },
    { stage: 'define', status: 'not_started', completedTasks: [], notes: [] },
    { stage: 'ideate', status: 'not_started', completedTasks: [], notes: [] },
    { stage: 'prototype', status: 'not_started', completedTasks: [], notes: [] },
    { stage: 'test', status: 'not_started', completedTasks: [], notes: [] },
  ],
  chatHistory: [],
  activeCoach: 'orchestrator',
});
