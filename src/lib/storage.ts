/**
 * 本地儲存管理
 * 處理專案狀態的持久化
 */

import { ProjectState, createInitialProjectState } from '@/types/design-thinking';

const STORAGE_KEYS = {
  CURRENT_PROJECT_ID: 'dt_current_project_id',
  PROJECTS: 'dt_projects',
  LAST_ACTIVITY: 'dt_last_activity',
} as const;

// 活動記錄類型
export interface ActivityRecord {
  timestamp: string;
  projectId: string;
  projectName: string;
  stage: string;
  coachType: string;
  description: string;
}

// 專案摘要類型
export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  currentStage: string;
  createdAt: string;
  updatedAt: string;
  observationsCount: number;
  povCount: number;
  ideasCount: number;
  prototypesCount: number;
  messagesCount: number;
}

// 檢查是否在瀏覽器環境
const isBrowser = typeof window !== 'undefined';

/**
 * 儲存專案狀態
 */
export function saveProjectState(state: ProjectState): void {
  if (!isBrowser) return;

  try {
    const stateToSave = {
      ...state,
      updatedAt: new Date().toISOString(),
    };

    // 取得所有專案
    const projects = getAllProjects();

    // 更新或新增專案
    const existingIndex = projects.findIndex((p) => p.id === state.id);
    if (existingIndex >= 0) {
      projects[existingIndex] = stateToSave;
    } else {
      projects.unshift(stateToSave);
    }

    // 只保留最近 20 個專案
    const trimmedProjects = projects.slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(trimmedProjects));

    // 設定當前專案 ID
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT_ID, state.id);

    // 記錄最後活動
    saveLastActivity({
      timestamp: new Date().toISOString(),
      projectId: state.id,
      projectName: state.name,
      stage: state.currentStage,
      coachType: state.activeCoach,
      description: getActivityDescription(state),
    });
  } catch (error) {
    console.error('Failed to save project state:', error);
  }
}

/**
 * 取得所有專案
 */
export function getAllProjects(): ProjectState[] {
  if (!isBrowser) return [];

  try {
    const projectsStr = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return projectsStr ? JSON.parse(projectsStr) : [];
  } catch (error) {
    console.error('Failed to get projects:', error);
    return [];
  }
}

/**
 * 取得專案列表摘要
 */
export function getProjectList(): ProjectSummary[] {
  const projects = getAllProjects();

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    currentStage: p.currentStage,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    observationsCount: p.observations?.length || 0,
    povCount: p.povStatements?.length || 0,
    ideasCount: p.ideas?.length || 0,
    prototypesCount: p.prototypes?.length || 0,
    messagesCount: p.chatHistory?.length || 0,
  }));
}

/**
 * 載入當前專案狀態
 */
export function loadProjectState(): ProjectState | null {
  if (!isBrowser) return null;

  try {
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT_ID);
    if (!currentId) return null;

    const projects = getAllProjects();
    const project = projects.find((p) => p.id === currentId);

    if (project && project.id && project.name && project.currentStage) {
      return project;
    }
  } catch (error) {
    console.error('Failed to load project state:', error);
  }

  return null;
}

/**
 * 載入特定專案
 */
export function loadProjectById(projectId: string): ProjectState | null {
  if (!isBrowser) return null;

  try {
    const projects = getAllProjects();
    const project = projects.find((p) => p.id === projectId);

    if (project) {
      // 設定為當前專案
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT_ID, projectId);
      return project;
    }
  } catch (error) {
    console.error('Failed to load project by id:', error);
  }

  return null;
}

/**
 * 刪除專案
 */
export function deleteProject(projectId: string): void {
  if (!isBrowser) return;

  try {
    const projects = getAllProjects();
    const filtered = projects.filter((p) => p.id !== projectId);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));

    // 如果刪除的是當前專案，清除當前專案 ID
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT_ID);
    if (currentId === projectId) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT_ID);
    }
  } catch (error) {
    console.error('Failed to delete project:', error);
  }
}

/**
 * 儲存最後活動記錄
 */
function saveLastActivity(activity: ActivityRecord): void {
  if (!isBrowser) return;

  try {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, JSON.stringify(activity));
  } catch (error) {
    console.error('Failed to save last activity:', error);
  }
}

/**
 * 取得最後活動記錄
 */
export function getLastActivity(): ActivityRecord | null {
  if (!isBrowser) return null;

  try {
    const activityStr = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    return activityStr ? JSON.parse(activityStr) : null;
  } catch (error) {
    console.error('Failed to get last activity:', error);
    return null;
  }
}

/**
 * 生成活動描述
 */
function getActivityDescription(state: ProjectState): string {
  const { currentStage, observations, povStatements, ideas, prototypes, chatHistory } = state;

  const stageNames: Record<string, string> = {
    empathize: '同理心',
    define: '定義',
    ideate: '發想',
    prototype: '原型',
    test: '測試',
  };

  const stageName = stageNames[currentStage] || currentStage;
  const parts: string[] = [`進行中：${stageName}階段`];

  if (observations?.length > 0) {
    parts.push(`${observations.length} 個觀察`);
  }
  if (povStatements?.length > 0) {
    parts.push(`${povStatements.length} 個 POV`);
  }
  if (ideas?.length > 0) {
    parts.push(`${ideas.length} 個點子`);
  }
  if (prototypes?.length > 0) {
    parts.push(`${prototypes.length} 個原型`);
  }

  // 最後一則訊息預覽
  if (chatHistory?.length > 0) {
    const lastUserMsg = [...chatHistory].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      const preview = lastUserMsg.content.slice(0, 30);
      parts.push(`最後訊息：「${preview}${lastUserMsg.content.length > 30 ? '...' : ''}」`);
    }
  }

  return parts.join(' | ');
}

/**
 * 建立新專案並儲存
 */
export function createAndSaveNewProject(name: string, description: string = ''): ProjectState {
  const newProject = createInitialProjectState(name, description);
  saveProjectState(newProject);
  return newProject;
}

/**
 * 清除所有儲存的資料
 */
export function clearAllData(): void {
  if (!isBrowser) return;

  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT_ID);
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
}

/**
 * 計算時間差描述
 */
export function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '剛剛';
  if (minutes < 60) return `${minutes} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  if (days < 7) return `${days} 天前`;

  return then.toLocaleDateString('zh-TW');
}
