'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ProjectState,
  ChatMessage,
  CoachType,
  DesignThinkingStage,
  createInitialProjectState,
} from '@/types/design-thinking';
import { STAGE_TO_COACH } from '@/constants/prompts';
import {
  parseActionsFromResponse,
  cleanResponseContent,
  applyActions,
  shouldAdvanceStage,
  getStageCompletion,
} from '@/lib/state-updater';
import {
  saveProjectState,
  loadProjectState,
  loadProjectById,
  getProjectList,
  getLastActivity,
  deleteProject,
  ActivityRecord,
  ProjectSummary,
} from '@/lib/storage';

export function useDesignThinkingChat(initialProjectName: string = 'Design Thinking 專案') {
  const [projectState, setProjectState] = useState<ProjectState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastActivity, setLastActivity] = useState<ActivityRecord | null>(null);
  const [projectList, setProjectList] = useState<ProjectSummary[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化：從 localStorage 載入或建立新專案
  useEffect(() => {
    const savedState = loadProjectState();
    const savedActivity = getLastActivity();
    const savedProjects = getProjectList();

    if (savedState) {
      setProjectState(savedState);
      setLastActivity(savedActivity);
    } else {
      setProjectState(createInitialProjectState(initialProjectName));
    }
    setProjectList(savedProjects);
    setIsInitialized(true);
  }, [initialProjectName]);

  // 更新專案列表（當專案狀態改變時）
  const refreshProjectList = useCallback(() => {
    setProjectList(getProjectList());
  }, []);

  // 自動儲存：當狀態改變時延遲儲存
  useEffect(() => {
    if (!projectState || !isInitialized) return;

    // 清除之前的 timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 延遲 500ms 儲存，避免頻繁寫入
    saveTimeoutRef.current = setTimeout(() => {
      saveProjectState(projectState);
      refreshProjectList();
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projectState, isInitialized, refreshProjectList]);

  // 發送訊息
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading || !projectState) return;

      setError(null);

      // 添加用戶訊息到專案狀態
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };

      const updatedChatHistory = [...projectState.chatHistory, userMessage];

      setProjectState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          chatHistory: updatedChatHistory,
          updatedAt: new Date().toISOString(),
        };
      });

      setIsLoading(true);

      try {
        // 準備發送到 API 的訊息格式
        const apiMessages = updatedChatHistory.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

        abortControllerRef.current = new AbortController();

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: apiMessages,
            projectState: {
              ...projectState,
              chatHistory: updatedChatHistory,
            },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let assistantContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
        }

        // 處理完整的回應
        const actions = parseActionsFromResponse(assistantContent);
        const cleanedContent = cleanResponseContent(assistantContent);

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: cleanedContent,
          coachType: projectState.activeCoach,
          timestamp: new Date().toISOString(),
        };

        setProjectState((prev) => {
          if (!prev) return prev;

          let newState = {
            ...prev,
            chatHistory: [...prev.chatHistory, assistantMessage],
            updatedAt: new Date().toISOString(),
          };

          // 應用 actions
          if (actions.length > 0) {
            newState = applyActions(newState, actions);
          }

          return newState;
        });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [projectState, isLoading]
  );

  // 停止生成
  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  // 補救記錄：當 AI 忘記輸出 JSON action 時，手動觸發記錄
  const retryRecording = useCallback(
    async (messageContent: string) => {
      if (isLoading || !projectState) return;

      setError(null);
      setIsLoading(true);

      try {
        // 根據當前階段和教練，生成補救提示
        const stage = projectState.currentStage;
        const coach = projectState.activeCoach;

        let retryPrompt = '';

        if (coach === 'empathy') {
          retryPrompt = `請仔細閱讀以下內容，並將其中提到的觀察記錄下來。只輸出 JSON action，不需要對話內容。

內容：${messageContent}

請輸出對應的 JSON action 來記錄這個觀察。`;
        } else if (coach === 'define') {
          retryPrompt = `請仔細閱讀以下內容，並將其中提到的 POV 陳述記錄下來。只輸出 JSON action，不需要對話內容。

內容：${messageContent}

請輸出對應的 JSON action 來記錄這個 POV。`;
        } else if (coach === 'ideate') {
          retryPrompt = `請仔細閱讀以下內容，並將其中提到的點子記錄下來。只輸出 JSON action，不需要對話內容。

內容：${messageContent}

請輸出對應的 JSON action 來記錄這個點子。`;
        } else if (coach === 'prototype') {
          retryPrompt = `請仔細閱讀以下內容，並將其中提到的原型記錄下來。只輸出 JSON action，不需要對話內容。

內容：${messageContent}

請輸出對應的 JSON action 來記錄這個原型。`;
        } else {
          // 其他教練不支持補救記錄
          setIsLoading(false);
          return;
        }

        abortControllerRef.current = new AbortController();

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              ...projectState.chatHistory.map((msg) => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
              })),
              { role: 'user' as const, content: retryPrompt },
            ],
            projectState,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let assistantContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
        }

        // 處理補救回應（只處理 actions，不添加到聊天記錄）
        const actions = parseActionsFromResponse(assistantContent);

        if (actions.length > 0) {
          setProjectState((prev) => {
            if (!prev) return prev;

            let newState = { ...prev };

            // 應用 actions
            newState = applyActions(newState, actions);

            return newState;
          });
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [projectState, isLoading]
  );

  // 切換教練
  const switchCoach = useCallback((coach: CoachType) => {
    setProjectState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        activeCoach: coach,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  // 切換到特定階段
  const switchStage = useCallback((stage: DesignThinkingStage) => {
    const coachType = STAGE_TO_COACH[stage];
    setProjectState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentStage: stage,
        activeCoach: coachType,
        stageProgress: prev.stageProgress.map((sp) =>
          sp.stage === stage && sp.status === 'not_started'
            ? { ...sp, status: 'in_progress' as const }
            : sp
        ),
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  // 手動進入下一階段
  const advanceToNextStage = useCallback(() => {
    setProjectState((prev) => {
      if (!prev) return prev;

      const stages: DesignThinkingStage[] = ['empathize', 'define', 'ideate', 'prototype', 'test'];
      const currentIndex = stages.indexOf(prev.currentStage);

      if (currentIndex < stages.length - 1) {
        const nextStage = stages[currentIndex + 1];
        const nextCoach = STAGE_TO_COACH[nextStage];

        return {
          ...prev,
          currentStage: nextStage,
          activeCoach: nextCoach,
          stageProgress: prev.stageProgress.map((sp) => {
            if (sp.stage === prev.currentStage) {
              return { ...sp, status: 'completed' as const };
            }
            if (sp.stage === nextStage) {
              return { ...sp, status: 'in_progress' as const };
            }
            return sp;
          }),
          updatedAt: new Date().toISOString(),
        };
      }
      return prev;
    });
  }, []);

  // 重置專案（建立新專案）
  const resetProject = useCallback((name: string = 'Design Thinking 專案') => {
    const newProject = createInitialProjectState(name);
    setProjectState(newProject);
    setError(null);
    setLastActivity(null);
    // 立即儲存新專案
    saveProjectState(newProject);
    refreshProjectList();
  }, [refreshProjectList]);

  // 切換到指定專案
  const switchProject = useCallback((projectId: string) => {
    const project = loadProjectById(projectId);
    if (project) {
      setProjectState(project);
      setError(null);
      setLastActivity(null);
    }
  }, []);

  // 刪除專案
  const deleteProjectById = useCallback((projectId: string) => {
    deleteProject(projectId);
    refreshProjectList();
  }, [refreshProjectList]);

  // 更新專案名稱
  const updateProjectName = useCallback((name: string) => {
    setProjectState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        name,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  // 清除歡迎訊息
  const dismissWelcomeBack = useCallback(() => {
    setLastActivity(null);
  }, []);

  // 計算階段完成度
  const stageCompletion = projectState ? getStageCompletion(projectState) : {
    empathize: 0,
    define: 0,
    ideate: 0,
    prototype: 0,
    test: 0,
  };

  // 檢查是否可以進入下一階段
  const canAdvance = projectState ? shouldAdvanceStage(projectState) : false;

  // 檢查是否有儲存的資料（用於顯示歡迎訊息）
  const hasStoredData = lastActivity !== null;

  return {
    // 專案狀態
    projectState: projectState || createInitialProjectState(initialProjectName),
    setProjectState,
    isInitialized,

    // 對話相關
    sendMessage,
    isLoading,
    error,
    stopGeneration,
    retryRecording,

    // 教練與階段控制
    switchCoach,
    switchStage,
    advanceToNextStage,

    // 輔助資訊
    stageCompletion,
    canAdvance,

    // 專案控制
    resetProject,
    updateProjectName,
    switchProject,
    deleteProjectById,
    projectList,

    // 歷史記錄
    lastActivity,
    hasStoredData,
    dismissWelcomeBack,
  };
}
