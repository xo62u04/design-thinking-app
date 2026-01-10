'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isSupabaseEnabled } from '@/lib/supabase/client';
import { getProjectByInviteCode, joinProject } from '@/lib/supabase/queries';
import JoinProjectModal from '@/components/JoinProjectModal';
import CollaborativeWorkspace from '@/components/CollaborativeWorkspace';
import { Loader2, AlertCircle, WifiOff } from 'lucide-react';

// Session storage key
const SESSION_KEY = 'dt_collaboration_session';

interface CollaborationSession {
  projectId: string;
  collaboratorId: string;
  nickname: string;
  color: string;
  inviteCode: string;
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = params.inviteCode as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // 檢查 Supabase 是否啟用
  useEffect(() => {
    if (!isSupabaseEnabled) {
      setError('協作功能未啟用。請設定 Supabase 環境變數。');
      setIsLoading(false);
      return;
    }

    // 檢查是否有已存在的 session
    const storedSession = localStorage.getItem(SESSION_KEY);
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession) as CollaborationSession;
        if (parsed.inviteCode === inviteCode) {
          setSession(parsed);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }

    // 載入專案資訊
    loadProject();
  }, [inviteCode]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      const projectData = await getProjectByInviteCode(inviteCode);
      setProject(projectData);

      // 如果沒有 session，顯示加入 modal
      const storedSession = localStorage.getItem(SESSION_KEY);
      if (storedSession) {
        const parsed = JSON.parse(storedSession) as CollaborationSession;
        if (parsed.inviteCode === inviteCode && parsed.projectId === projectData.id) {
          setSession(parsed);
        } else {
          setShowJoinModal(true);
        }
      } else {
        setShowJoinModal(true);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
      setError('找不到此專案，請確認邀請連結是否正確。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (nickname: string) => {
    if (!project) return;

    try {
      const collaborator = await joinProject(project.id, nickname);

      const newSession: CollaborationSession = {
        projectId: project.id,
        collaboratorId: collaborator.id,
        nickname: collaborator.nickname,
        color: collaborator.color,
        inviteCode,
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      setSession(newSession);
      setShowJoinModal(false);
    } catch (err) {
      console.error('Failed to join:', err);
      throw new Error('加入專案失敗，請稍後再試');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">載入專案中...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          {error.includes('未啟用') ? (
            <WifiOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          ) : (
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          )}
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {error.includes('未啟用') ? '協作功能未啟用' : '無法載入專案'}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  // Join modal
  if (showJoinModal && project) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-100 to-gray-200">
        <JoinProjectModal
          projectName={project.name}
          onJoin={handleJoin}
        />
      </div>
    );
  }

  // Main workspace
  if (session && project) {
    return (
      <CollaborativeWorkspace
        projectId={project.id}
        inviteCode={inviteCode}
        collaboratorId={session.collaboratorId}
        nickname={session.nickname}
        color={session.color}
      />
    );
  }

  return null;
}
