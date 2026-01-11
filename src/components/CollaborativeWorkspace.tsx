'use client';

import { useState } from 'react';
import { useCollaboration } from '@/hooks/useCollaboration';
import { DesignThinkingStage } from '@/types/design-thinking';
import ChatPanel from '@/components/ChatPanel';
import ProgressBoard from '@/components/ProgressBoard';
import CollaboratorAvatars from '@/components/CollaboratorAvatars';
import InviteLinkShare from '@/components/InviteLinkShare';
import {
  Sparkles,
  AlertCircle,
  MessageSquare,
  LayoutDashboard,
  Save,
  Check,
  Loader2,
  Users,
  LogOut,
  Home,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createWhiteboard, updatePrototypeWhiteboardId } from '@/lib/supabase/queries';

interface CollaborativeWorkspaceProps {
  projectId: string;
  inviteCode: string;
  collaboratorId: string;
  nickname: string;
  color: string;
}

export default function CollaborativeWorkspace({
  projectId,
  inviteCode,
  collaboratorId,
  nickname,
  color,
}: CollaborativeWorkspaceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'chat' | 'progress'>('chat');
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);

  const {
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
    currentCollaborator,
  } = useCollaboration({
    projectId,
    collaboratorId,
    nickname,
    color,
  });

  const handleStageClick = (stage: DesignThinkingStage) => {
    switchStage(stage);
  };

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
    setShowSaveIndicator(true);
    setTimeout(() => setShowSaveIndicator(false), 2000);
  };

  const handleLeaveCollaboration = () => {
    const confirm = window.confirm(
      '確定要離開協作專案嗎？\n\n離開後您可以隨時透過邀請連結重新加入。'
    );
    if (confirm) {
      // 清除協作 session
      localStorage.removeItem('dt_collaboration_session');
      // 返回首頁
      router.push('/');
    }
  };

  // 開啟或創建白板
  const handleOpenWhiteboard = async (prototypeId: string) => {
    if (!projectState) return;

    try {
      // 找到對應的原型
      const prototype = projectState.prototypes.find((p) => p.id === prototypeId);
      if (!prototype) {
        alert('找不到原型');
        return;
      }

      // 如果原型已有白板，直接開啟
      if (prototype.whiteboardId) {
        window.open(`/whiteboard/${prototype.whiteboardId}`, '_blank');
        return;
      }

      // 創建新白板
      const whiteboard = await createWhiteboard(projectId, collaboratorId, {
        name: `${prototype.name} - 協作白板`,
        prototypeId: prototype.id,
      });

      // 更新原型的 whiteboardId
      await updatePrototypeWhiteboardId(prototype.id, whiteboard.id);

      // 開啟白板
      window.open(`/whiteboard/${whiteboard.id}`, '_blank');
    } catch (error) {
      console.error('Failed to open whiteboard:', error);
      alert('開啟白板失敗，請稍後再試');
    }
  };

  // Loading state
  if (!isInitialized || !projectState) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">載入協作空間中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex-shrink-0 p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1
                    className="text-sm sm:text-lg font-bold text-gray-800 truncate cursor-pointer hover:text-blue-600"
                    onClick={() => {
                      const name = prompt('修改專案名稱：', projectState.name);
                      if (name) updateProjectName(name);
                    }}
                    title="點擊修改專案名稱"
                  >
                    {projectState.name}
                  </h1>
                  {/* Collaboration badge */}
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    <Users className="w-3 h-3" />
                    <span className="hidden sm:inline">協作中</span>
                  </span>
                  {showSaveIndicator && (
                    <span className="flex items-center gap-1 text-xs text-green-600 animate-in fade-in">
                      <Check className="w-3 h-3" />
                      <span className="hidden sm:inline">已同步</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 hidden sm:block">
                  AI 驅動的設計思維教練系統
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">教練思考中...</span>
                </div>
              )}

              {/* Collaborator Avatars */}
              <CollaboratorAvatars
                collaborators={onlineCollaborators}
                currentUserId={collaboratorId}
              />

              {/* Invite Link */}
              <InviteLinkShare inviteCode={inviteCode} />

              {/* Leave Collaboration Button */}
              <button
                onClick={handleLeaveCollaboration}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="離開協作專案"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">離開</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="flex-shrink-0 max-w-7xl mx-auto w-full px-3 sm:px-4 pt-2 sm:pt-4">
          <div className="flex items-center gap-2 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">發生錯誤：{error.message}</span>
          </div>
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="flex-shrink-0 lg:hidden bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            對話
            {projectState.chatHistory.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                {projectState.chatHistory.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'progress'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            進度
            {canAdvance && (
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-2 sm:p-4 overflow-hidden">
        {/* Desktop: Side by side layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-4 h-full">
          <div className="lg:col-span-2 min-h-0">
            <ChatPanel
              messages={projectState.chatHistory}
              activeCoach={projectState.activeCoach}
              onSendMessage={handleSendMessage}
              onCoachChange={switchCoach}
              onRetryRecording={retryRecording}
              isLoading={isLoading}
              showCollaborators
            />
          </div>
          <div className="lg:col-span-1 min-h-0">
            <ProgressBoard
              projectState={projectState}
              onStageClick={handleStageClick}
              stageCompletion={stageCompletion}
              canAdvance={canAdvance}
              onAdvance={advanceToNextStage}
              onOpenWhiteboard={handleOpenWhiteboard}
            />
          </div>
        </div>

        {/* Mobile: Tab-based layout */}
        <div className="lg:hidden h-full">
          {activeTab === 'chat' ? (
            <ChatPanel
              messages={projectState.chatHistory}
              activeCoach={projectState.activeCoach}
              onSendMessage={handleSendMessage}
              onCoachChange={switchCoach}
              onRetryRecording={retryRecording}
              isLoading={isLoading}
              showCollaborators
            />
          ) : (
            <ProgressBoard
              projectState={projectState}
              onStageClick={handleStageClick}
              stageCompletion={stageCompletion}
              canAdvance={canAdvance}
              onAdvance={advanceToNextStage}
              onOpenWhiteboard={handleOpenWhiteboard}
            />
          )}
        </div>
      </main>

      {/* Status Bar */}
      <div className="flex-shrink-0 bg-gray-50 border-t px-4 py-1 text-center">
        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
          <Save className="w-3 h-3" />
          即時同步已啟用 · {onlineCollaborators.filter((c) => c.isOnline).length} 人在線
        </p>
      </div>
    </div>
  );
}
