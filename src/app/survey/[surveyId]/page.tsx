'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CollaborativeSurveyForm from '@/components/CollaborativeSurveyForm';
import { Loader2 } from 'lucide-react';

export default function SurveyPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [collaborationSession, setCollaborationSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 檢查協作 session（從 localStorage 讀取）
    const sessionStr = localStorage.getItem('dt_collaboration_session');
    if (!sessionStr) {
      router.push('/');
      return;
    }

    try {
      const session = JSON.parse(sessionStr);
      setCollaborationSession(session);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to parse collaboration session:', error);
      router.push('/');
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-gray-50">
      <CollaborativeSurveyForm
        surveyId={unwrappedParams.surveyId}
        collaboratorId={collaborationSession.collaboratorId}
        nickname={collaborationSession.nickname}
        color={collaborationSession.color}
      />
    </div>
  );
}
