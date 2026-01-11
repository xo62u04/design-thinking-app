'use client';

import { useState } from 'react';
import { useDesignThinkingChat } from '@/hooks/useDesignThinkingChat';
import { DesignThinkingStage } from '@/types/design-thinking';
import ChatPanel from '@/components/ChatPanel';
import ProgressBoard from '@/components/ProgressBoard';
import WelcomeBack from '@/components/WelcomeBack';
import ProjectSelector from '@/components/ProjectSelector';
import {
  Sparkles,
  AlertCircle,
  MessageSquare,
  LayoutDashboard,
  Plus,
  Save,
  Check,
  Users,
  Loader2,
} from 'lucide-react';
import { isSupabaseEnabled } from '@/lib/supabase/client';
import { createProject } from '@/lib/supabase/queries';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'chat' | 'progress'>('chat');
  const [showWelcome, setShowWelcome] = useState(true);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [isCreatingCollab, setIsCreatingCollab] = useState(false);

  const {
    projectState,
    sendMessage,
    isLoading,
    error,
    retryRecording,
    switchCoach,
    switchStage,
    advanceToNextStage,
    stageCompletion,
    canAdvance,
    isInitialized,
    lastActivity,
    hasStoredData,
    dismissWelcomeBack,
    resetProject,
    updateProjectName,
    switchProject,
    deleteProjectById,
    projectList,
  } = useDesignThinkingChat('Design Thinking 專案');

  const handleStageClick = (stage: DesignThinkingStage) => {
    switchStage(stage);
  };

  const handleContinue = () => {
    setShowWelcome(false);
    dismissWelcomeBack();
  };

  const handleNewProject = () => {
    const name = prompt('請輸入新專案名稱：', 'Design Thinking 專案');
    if (name) {
      resetProject(name);
    }
    setShowWelcome(false);
    dismissWelcomeBack();
  };

  // 顯示儲存指示器
  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
    // 顯示儲存成功提示
    setShowSaveIndicator(true);
    setTimeout(() => setShowSaveIndicator(false), 2000);
  };

  // 建立協作專案
  const handleCreateCollabProject = async () => {
    if (!isSupabaseEnabled) {
      alert('協作功能未啟用。請設定 Supabase 環境變數。');
      return;
    }

    const name = prompt('請輸入協作專案名稱：', 'Design Thinking 協作專案');
    if (!name) return;

    setIsCreatingCollab(true);
    try {
      const project = await createProject(name);
      router.push(`/project/${project.invite_code}`);
    } catch (err) {
      console.error('Failed to create collaborative project:', err);
      alert('建立協作專案失敗，請稍後再試');
    } finally {
      setIsCreatingCollab(false);
    }
  };

  // 載入中顯示
  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
      {/* Welcome Back Modal */}
      {hasStoredData && showWelcome && lastActivity && (
        <WelcomeBack
          activity={lastActivity}
          onContinue={handleContinue}
          onNewProject={handleNewProject}
        />
      )}

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
                  {/* Save indicator */}
                  {showSaveIndicator && (
                    <span className="flex items-center gap-1 text-xs text-green-600 animate-in fade-in">
                      <Check className="w-3 h-3" />
                      <span className="hidden sm:inline">已儲存</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 hidden sm:block">
                  AI 驅動的設計思維教練系統
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">教練思考中...</span>
                </div>
              )}

              {/* Project Selector */}
              <ProjectSelector
                currentProjectId={projectState.id}
                projects={projectList}
                onSelectProject={switchProject}
                onDeleteProject={deleteProjectById}
              />

              {/* New Project Button */}
              <button
                onClick={handleNewProject}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="建立新專案"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">新專案</span>
              </button>

              {/* Collaborative Project Button */}
              <button
                onClick={handleCreateCollabProject}
                disabled={isCreatingCollab}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                title="建立多人協作專案"
              >
                {isCreatingCollab ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">協作</span>
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
          {/* Left: Chat Panel */}
          <div className="lg:col-span-2 min-h-0">
            <ChatPanel
              messages={projectState.chatHistory}
              activeCoach={projectState.activeCoach}
              onSendMessage={handleSendMessage}
              onCoachChange={switchCoach}
              onRetryRecording={retryRecording}
              isLoading={isLoading}
            />
          </div>

          {/* Right: Progress Board */}
          <div className="lg:col-span-1 min-h-0">
            <ProgressBoard
              projectState={projectState}
              onStageClick={handleStageClick}
              stageCompletion={stageCompletion}
              canAdvance={canAdvance}
              onAdvance={advanceToNextStage}
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
            />
          ) : (
            <ProgressBoard
              projectState={projectState}
              onStageClick={handleStageClick}
              stageCompletion={stageCompletion}
              canAdvance={canAdvance}
              onAdvance={advanceToNextStage}
            />
          )}
        </div>
      </main>

      {/* Auto-save Status Bar */}
      <div className="flex-shrink-0 bg-gray-50 border-t px-4 py-1 text-center">
        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
          <Save className="w-3 h-3" />
          自動儲存已啟用 · 上次更新：
          {new Date(projectState.updatedAt).toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
