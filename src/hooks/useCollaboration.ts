'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  ProjectState,
  ChatMessage,
  CoachType,
  DesignThinkingStage,
  Collaborator,
  UserObservation,
  POVStatement,
  Idea,
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
  loadFullProjectState,
  addChatMessage,
  addObservation,
  addPOVStatement,
  addIdea,
  addPrototype,
  updateProject,
  getCollaborators,
} from '@/lib/supabase/queries';
import {
  subscribeToProjectChanges,
  subscribeToPresence,
  unsubscribe,
  PresenceState,
} from '@/lib/supabase/realtime';

interface UseCollaborationOptions {
  projectId: string;
  collaboratorId: string;
  nickname: string;
  color: string;
}

export function useCollaboration({
  projectId,
  collaboratorId,
  nickname,
  color,
}: UseCollaborationOptions) {
  const [projectState, setProjectState] = useState<ProjectState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [onlineCollaborators, setOnlineCollaborators] = useState<Collaborator[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const changesChannelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);

  // 初始化：載入專案狀態並訂閱即時更新
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // 載入完整專案狀態
        const state = await loadFullProjectState(projectId);
        if (!mounted) return;

        if (state) {
          setProjectState(state);
        }

        // 載入協作者
        const collaborators = await getCollaborators(projectId);
        if (!mounted) return;

        setOnlineCollaborators(
          collaborators.map((c) => ({
            id: c.id,
            projectId: c.project_id,
            nickname: c.nickname,
            color: c.color,
            isOnline: c.is_online,
            lastSeenAt: c.last_seen_at,
            createdAt: c.created_at,
          }))
        );

        // 訂閱資料庫變更
        changesChannelRef.current = subscribeToProjectChanges(projectId, {
          onObservationInsert: (payload) => {
            if (!mounted) return;
            const newObs = payload.new;
            setProjectState((prev) => {
              if (!prev) return prev;
              // 避免重複添加（自己發送的）
              if (prev.observations.some((o) => o.id === newObs.id)) return prev;
              return {
                ...prev,
                observations: [
                  ...prev.observations,
                  {
                    id: newObs.id,
                    content: newObs.content,
                    category: newObs.category,
                    source: newObs.source,
                    createdAt: newObs.created_at,
                    collaboratorId: newObs.collaborator_id,
                  },
                ],
              };
            });
          },
          onPOVInsert: (payload) => {
            if (!mounted) return;
            const newPov = payload.new;
            setProjectState((prev) => {
              if (!prev) return prev;
              if (prev.povStatements.some((p) => p.id === newPov.id)) return prev;
              return {
                ...prev,
                povStatements: [
                  ...prev.povStatements,
                  {
                    id: newPov.id,
                    user: newPov.user_desc,
                    need: newPov.need,
                    insight: newPov.insight,
                    statement: newPov.statement,
                    createdAt: newPov.created_at,
                    collaboratorId: newPov.collaborator_id,
                  },
                ],
              };
            });
          },
          onIdeaInsert: (payload) => {
            if (!mounted) return;
            const newIdea = payload.new;
            setProjectState((prev) => {
              if (!prev) return prev;
              if (prev.ideas.some((i) => i.id === newIdea.id)) return prev;
              return {
                ...prev,
                ideas: [
                  ...prev.ideas,
                  {
                    id: newIdea.id,
                    title: newIdea.title,
                    description: newIdea.description,
                    votes: newIdea.votes,
                    status: newIdea.status,
                    tags: newIdea.tags,
                    createdAt: newIdea.created_at,
                    collaboratorId: newIdea.collaborator_id,
                  },
                ],
              };
            });
          },
          onMessageInsert: (payload) => {
            if (!mounted) return;
            const newMsg = payload.new;
            setProjectState((prev) => {
              if (!prev) return prev;
              if (prev.chatHistory.some((m) => m.id === newMsg.id)) return prev;
              return {
                ...prev,
                chatHistory: [
                  ...prev.chatHistory,
                  {
                    id: newMsg.id,
                    role: newMsg.role,
                    content: newMsg.content,
                    coachType: newMsg.coach_type,
                    timestamp: newMsg.created_at,
                    collaboratorId: newMsg.collaborator_id,
                  },
                ],
              };
            });
          },
          onProjectUpdate: (payload) => {
            if (!mounted) return;
            const updated = payload.new;
            setProjectState((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                name: updated.name,
                description: updated.description,
                currentStage: updated.current_stage,
                activeCoach: updated.active_coach,
                updatedAt: updated.updated_at,
              };
            });
          },
          onCollaboratorJoin: (payload) => {
            if (!mounted) return;
            const newCollab = payload.new;
            setOnlineCollaborators((prev) => {
              if (prev.some((c) => c.id === newCollab.id)) return prev;
              return [
                ...prev,
                {
                  id: newCollab.id,
                  projectId: newCollab.project_id,
                  nickname: newCollab.nickname,
                  color: newCollab.color,
                  isOnline: newCollab.is_online,
                  lastSeenAt: newCollab.last_seen_at,
                  createdAt: newCollab.created_at,
                },
              ];
            });
          },
          onCollaboratorUpdate: (payload) => {
            if (!mounted) return;
            const updated = payload.new;
            setOnlineCollaborators((prev) =>
              prev.map((c) =>
                c.id === updated.id
                  ? { ...c, isOnline: updated.is_online, lastSeenAt: updated.last_seen_at }
                  : c
              )
            );
          },
        });

        // 訂閱 Presence
        presenceChannelRef.current = subscribeToPresence(
          projectId,
          {
            collaboratorId,
            nickname,
            color,
            onlineAt: new Date().toISOString(),
          },
          {
            onSync: (state) => {
              if (!mounted) return;
              const online = Object.values(state).flat();
              setOnlineCollaborators((prev) =>
                prev.map((c) => ({
                  ...c,
                  isOnline: online.some((o) => o.collaboratorId === c.id),
                }))
              );
            },
          }
        );

        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize collaboration:', err);
        setError(err instanceof Error ? err : new Error('初始化失敗'));
      }
    };

    init();

    return () => {
      mounted = false;
      unsubscribe(changesChannelRef.current);
      unsubscribe(presenceChannelRef.current);
    };
  }, [projectId, collaboratorId, nickname, color]);

  // 發送訊息
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading || !projectState) return;

      setError(null);
      setIsLoading(true);

      try {
        // 添加用戶訊息到資料庫
        const userMessage = await addChatMessage(projectId, collaboratorId, {
          role: 'user',
          content,
        });

        // 樂觀更新本地狀態
        const updatedChatHistory: ChatMessage[] = [
          ...projectState.chatHistory,
          {
            id: userMessage.id,
            role: 'user',
            content,
            timestamp: userMessage.created_at,
            collaboratorId,
            collaboratorNickname: nickname,
            collaboratorColor: color,
          },
        ];

        setProjectState((prev) =>
          prev ? { ...prev, chatHistory: updatedChatHistory } : prev
        );

        // 準備發送到 API
        const apiMessages = updatedChatHistory.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

        abortControllerRef.current = new AbortController();

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            projectState: { ...projectState, chatHistory: updatedChatHistory },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let assistantContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantContent += decoder.decode(value, { stream: true });
        }

        // 處理 AI 回應
        const actions = parseActionsFromResponse(assistantContent);
        const cleanedContent = cleanResponseContent(assistantContent);

        // 儲存 AI 訊息到資料庫
        const assistantMessage = await addChatMessage(projectId, null, {
          role: 'assistant',
          content: cleanedContent,
          coachType: projectState.activeCoach,
        });

        // 應用 actions（添加到資料庫）
        for (const action of actions) {
          try {
            const data = action.data as Record<string, any> | undefined;
            switch (action.type) {
              case 'ADD_OBSERVATION':
                if (data?.content) {
                  await addObservation(projectId, collaboratorId, {
                    content: data.content as string,
                    category: data.category as string,
                    source: data.source as string | undefined,
                  });
                }
                break;
              case 'ADD_POV':
                if (data?.statement) {
                  await addPOVStatement(projectId, collaboratorId, {
                    user: data.user as string,
                    need: data.need as string,
                    insight: data.insight as string,
                    statement: data.statement as string,
                  });
                }
                break;
              case 'ADD_IDEA':
                if (data?.title) {
                  await addIdea(projectId, collaboratorId, {
                    title: data.title as string,
                    description: data.description as string | undefined,
                    tags: data.tags as string[] | undefined,
                  });
                }
                break;
              case 'ADD_PROTOTYPE':
                if (data?.name) {
                  await addPrototype(projectId, collaboratorId, {
                    name: data.name as string,
                    description: data.description as string | undefined,
                    type: data.type as string | undefined,
                    features: data.features as string[] | undefined,
                  });
                }
                break;
              case 'NEXT_STAGE':
                const stages: DesignThinkingStage[] = [
                  'empathize', 'define', 'ideate', 'prototype', 'test'
                ];
                const currentIndex = stages.indexOf(projectState.currentStage);
                if (currentIndex < stages.length - 1) {
                  const nextStage = stages[currentIndex + 1];
                  await updateProject(projectId, {
                    current_stage: nextStage,
                    active_coach: STAGE_TO_COACH[nextStage],
                  });
                }
                break;
            }
          } catch (actionErr) {
            console.error('Failed to apply action:', action.type, actionErr);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err : new Error('發送訊息失敗'));
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [projectState, projectId, collaboratorId, nickname, color, isLoading]
  );

  // 切換教練
  const switchCoach = useCallback(
    async (coach: CoachType) => {
      try {
        await updateProject(projectId, { active_coach: coach });
      } catch (err) {
        console.error('Failed to switch coach:', err);
      }
    },
    [projectId]
  );

  // 切換階段
  const switchStage = useCallback(
    async (stage: DesignThinkingStage) => {
      try {
        const coachType = STAGE_TO_COACH[stage];
        await updateProject(projectId, {
          current_stage: stage,
          active_coach: coachType,
        });
      } catch (err) {
        console.error('Failed to switch stage:', err);
      }
    },
    [projectId]
  );

  // 進入下一階段
  const advanceToNextStage = useCallback(async () => {
    if (!projectState) return;

    const stages: DesignThinkingStage[] = [
      'empathize', 'define', 'ideate', 'prototype', 'test'
    ];
    const currentIndex = stages.indexOf(projectState.currentStage);

    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      await switchStage(nextStage);
    }
  }, [projectState, switchStage]);

  // 補救記錄：當 AI 忘記輸出 JSON action 時，手動觸發記錄
  const retryRecording = useCallback(
    async (messageContent: string) => {
      if (isLoading || !projectState) return;

      setError(null);
      setIsLoading(true);

      try {
        // 根據當前階段和教練，生成補救提示
        const coach = projectState.activeCoach;

        let retryPrompt = '';

        if (coach === 'empathy') {
          retryPrompt = `請仔細閱讀以下內容，並將其中提到的觀察記錄下來。只輸出 JSON action，不需要對話內容。

內容：${messageContent}

請輸出對應的 JSON action 來記錄這個觀察。格式範例：
\`\`\`json:action
{
  "type": "ADD_OBSERVATION",
  "data": {
    "content": "觀察內容",
    "category": "insight"
  }
}
\`\`\``;
        } else if (coach === 'define') {
          retryPrompt = `請仔細閱讀以下內容，並將其中提到的 POV 陳述記錄下來。只輸出 JSON action，不需要對話內容。

內容：${messageContent}

請輸出對應的 JSON action 來記錄這個 POV。必須包含 user（使用者）、need（需求）、insight（洞察）、statement（完整陳述）四個欄位。格式範例：
\`\`\`json:action
{
  "type": "ADD_POV",
  "data": {
    "user": "使用者角色",
    "need": "需求描述",
    "insight": "洞察發現",
    "statement": "完整的 POV 陳述"
  }
}
\`\`\``;
        } else if (coach === 'ideate') {
          retryPrompt = `請仔細閱讀以下內容，並將其中提到的點子記錄下來。只輸出 JSON action，不需要對話內容。

內容：${messageContent}

請輸出對應的 JSON action 來記錄這個點子。格式範例：
\`\`\`json:action
{
  "type": "ADD_IDEA",
  "data": {
    "title": "點子標題",
    "description": "點子描述",
    "tags": ["標籤1", "標籤2"]
  }
}
\`\`\``;
        } else if (coach === 'prototype') {
          retryPrompt = `請仔細閱讀以下內容，並將其中提到的原型記錄下來。只輸出 JSON action，不需要對話內容。

內容：${messageContent}

請輸出對應的 JSON action 來記錄這個原型。格式範例：
\`\`\`json:action
{
  "type": "ADD_PROTOTYPE",
  "data": {
    "name": "原型名稱",
    "description": "原型描述",
    "type": "low_fidelity",
    "features": ["功能1", "功能2"]
  }
}
\`\`\``;
        } else {
          // 其他教練不支持補救記錄
          setIsLoading(false);
          return;
        }

        abortControllerRef.current = new AbortController();

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let assistantContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantContent += decoder.decode(value, { stream: true });
        }

        // 處理補救回應（只處理 actions，不添加到聊天記錄）
        const actions = parseActionsFromResponse(assistantContent);

        // 應用 actions（添加到資料庫）
        for (const action of actions) {
          try {
            const data = action.data as Record<string, any> | undefined;
            switch (action.type) {
              case 'ADD_OBSERVATION':
                if (data?.content) {
                  await addObservation(projectId, collaboratorId, {
                    content: data.content as string,
                    category: data.category as string,
                    source: data.source as string | undefined,
                  });
                }
                break;
              case 'ADD_POV':
                if (data?.statement) {
                  await addPOVStatement(projectId, collaboratorId, {
                    user: data.user as string,
                    need: data.need as string,
                    insight: data.insight as string,
                    statement: data.statement as string,
                  });
                }
                break;
              case 'ADD_IDEA':
                if (data?.title) {
                  await addIdea(projectId, collaboratorId, {
                    title: data.title as string,
                    description: data.description as string | undefined,
                    tags: data.tags as string[] | undefined,
                  });
                }
                break;
              case 'ADD_PROTOTYPE':
                if (data?.name) {
                  await addPrototype(projectId, collaboratorId, {
                    name: data.name as string,
                    description: data.description as string | undefined,
                    type: data.type as string | undefined,
                    features: data.features as string[] | undefined,
                  });
                }
                break;
            }
          } catch (actionErr) {
            console.error('Failed to apply retry action:', action.type, actionErr);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err : new Error('補救記錄失敗'));
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [projectState, projectId, collaboratorId, isLoading]
  );

  // 更新專案名稱
  const updateProjectName = useCallback(
    async (name: string) => {
      try {
        await updateProject(projectId, { name });
      } catch (err) {
        console.error('Failed to update project name:', err);
      }
    },
    [projectId]
  );

  // 計算階段完成度
  const stageCompletion = projectState
    ? getStageCompletion(projectState)
    : { empathize: 0, define: 0, ideate: 0, prototype: 0, test: 0 };

  // 檢查是否可以進入下一階段
  const canAdvance = projectState ? shouldAdvanceStage(projectState) : false;

  return {
    projectState,
    isLoading,
    error,
    isInitialized,
    onlineCollaborators,
    sendMessage,
    retryRecording,
    switchCoach,
    switchStage,
    advanceToNextStage,
    updateProjectName,
    stageCompletion,
    canAdvance,
    currentCollaborator: {
      id: collaboratorId,
      nickname,
      color,
    },
  };
}
