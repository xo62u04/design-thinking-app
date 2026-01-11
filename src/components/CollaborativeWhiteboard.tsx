'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { getWhiteboard, updateWhiteboard } from '@/lib/supabase/queries';
import { getSupabase } from '@/lib/supabase/client';
import { Loader2, Users, Save, Check } from 'lucide-react';
import type { Whiteboard } from '@/types/design-thinking';

// 引入 Excalidraw 樣式
import '@excalidraw/excalidraw/index.css';

// 動態導入 Excalidraw（避免 SSR 問題）
const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">載入白板中...</p>
        </div>
      </div>
    ),
  }
);

interface CollaborativeWhiteboardProps {
  whiteboardId: string;
  collaboratorId: string;
  nickname: string;
  color: string;
}

export default function CollaborativeWhiteboard({
  whiteboardId,
  collaboratorId,
  nickname,
  color,
}: CollaborativeWhiteboardProps) {
  const [whiteboard, setWhiteboard] = useState<Whiteboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number>(1);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 載入白板資料
  useEffect(() => {
    loadWhiteboard();
  }, [whiteboardId]);

  async function loadWhiteboard() {
    try {
      const data = await getWhiteboard(whiteboardId);
      setWhiteboard({
        id: data.id,
        projectId: data.project_id,
        prototypeId: data.prototype_id,
        name: data.name,
        elements: data.elements || [],
        appState: data.app_state || {},
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load whiteboard:', error);
      setIsLoading(false);
    }
  }

  // 訂閱即時更新
  useEffect(() => {
    if (!whiteboardId) return;

    const supabase = getSupabase();

    // 訂閱白板變更
    const channel = supabase
      .channel(`whiteboard:${whiteboardId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whiteboards',
          filter: `id=eq.${whiteboardId}`,
        },
        (payload) => {
          // 只有當更新不是來自自己時才更新
          const newData = payload.new as any;
          if (excalidrawAPI) {
            excalidrawAPI.updateScene({
              elements: newData.elements || [],
              appState: newData.app_state || {},
            });
          }
        }
      )
      .subscribe();

    // Presence tracking（線上用戶數）
    const presenceChannel = supabase.channel(`whiteboard:${whiteboardId}:presence`, {
      config: {
        presence: {
          key: collaboratorId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setOnlineUsers(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: collaboratorId,
            nickname,
            color,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, [whiteboardId, collaboratorId, nickname, color, excalidrawAPI]);

  // 處理白板變更
  const handleChange = useCallback(
    (elements: readonly any[], appState: any) => {
      // 延遲儲存，避免頻繁寫入
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await updateWhiteboard(whiteboardId, {
            elements: elements as any[],
            appState: {
              viewBackgroundColor: appState.viewBackgroundColor,
              currentItemStrokeColor: appState.currentItemStrokeColor,
              currentItemBackgroundColor: appState.currentItemBackgroundColor,
              currentItemFillStyle: appState.currentItemFillStyle,
              currentItemStrokeWidth: appState.currentItemStrokeWidth,
              currentItemRoughness: appState.currentItemRoughness,
              currentItemOpacity: appState.currentItemOpacity,
            },
          });
        } catch (error) {
          console.error('Failed to save whiteboard:', error);
        } finally {
          setIsSaving(false);
        }
      }, 1000);
    },
    [whiteboardId]
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">載入白板中...</p>
        </div>
      </div>
    );
  }

  if (!whiteboard) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">無法載入白板</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b bg-gray-50 flex items-center justify-between z-10">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">{whiteboard.name}</h1>
          <p className="text-xs text-gray-500">協作白板</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 儲存狀態 */}
          {isSaving ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              儲存中...
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="w-4 h-4" />
              已儲存
            </div>
          )}

          {/* 線上用戶數 */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm">
            <Users className="w-4 h-4" />
            {onlineUsers} 人在線
          </div>
        </div>
      </div>

      {/* Excalidraw 白板 */}
      <div className="flex-1 w-full h-full overflow-hidden">
        <Excalidraw
          initialData={{
            elements: whiteboard.elements,
            appState: whiteboard.appState,
          }}
          onChange={handleChange}
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          UIOptions={{
            canvasActions: {
              loadScene: false,
            },
          }}
        />
      </div>
    </div>
  );
}
