/**
 * Supabase Realtime 訂閱管理
 */

import { getSupabase, isSupabaseEnabled, supabase } from './client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from './types';

type TableName = keyof Database['public']['Tables'];

export interface RealtimeCallbacks {
  onObservationInsert?: (payload: any) => void;
  onPOVInsert?: (payload: any) => void;
  onIdeaInsert?: (payload: any) => void;
  onIdeaUpdate?: (payload: any) => void;
  onPrototypeInsert?: (payload: any) => void;
  onPrototypeUpdate?: (payload: any) => void;
  onFeedbackInsert?: (payload: any) => void;
  onMessageInsert?: (payload: any) => void;
  onProjectUpdate?: (payload: any) => void;
  onStageProgressUpdate?: (payload: any) => void;
  onCollaboratorJoin?: (payload: any) => void;
  onCollaboratorUpdate?: (payload: any) => void;
}

export interface PresenceState {
  collaboratorId: string;
  nickname: string;
  color: string;
  onlineAt: string;
}

export interface PresenceCallbacks {
  onSync?: (state: Record<string, PresenceState[]>) => void;
  onJoin?: (key: string, presences: PresenceState[]) => void;
  onLeave?: (key: string, presences: PresenceState[]) => void;
}

/**
 * 建立專案資料變更訂閱
 */
export function subscribeToProjectChanges(
  projectId: string,
  callbacks: RealtimeCallbacks
): RealtimeChannel | null {
  if (!supabase) return null;

  const channel = supabase.channel(`project:${projectId}`);

  // Observations
  if (callbacks.onObservationInsert) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'observations',
        filter: `project_id=eq.${projectId}`,
      },
      callbacks.onObservationInsert
    );
  }

  // POV Statements
  if (callbacks.onPOVInsert) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'pov_statements',
        filter: `project_id=eq.${projectId}`,
      },
      callbacks.onPOVInsert
    );
  }

  // Ideas
  if (callbacks.onIdeaInsert) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ideas',
        filter: `project_id=eq.${projectId}`,
      },
      callbacks.onIdeaInsert
    );
  }
  if (callbacks.onIdeaUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ideas',
        filter: `project_id=eq.${projectId}`,
      },
      callbacks.onIdeaUpdate
    );
  }

  // Prototypes
  if (callbacks.onPrototypeInsert) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'prototypes',
        filter: `project_id=eq.${projectId}`,
      },
      callbacks.onPrototypeInsert
    );
  }
  if (callbacks.onPrototypeUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'prototypes',
        filter: `project_id=eq.${projectId}`,
      },
      callbacks.onPrototypeUpdate
    );
  }

  // Chat Messages
  if (callbacks.onMessageInsert) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `project_id=eq.${projectId}`,
      },
      callbacks.onMessageInsert
    );
  }

  // Project updates
  if (callbacks.onProjectUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'projects',
        filter: `id=eq.${projectId}`,
      },
      callbacks.onProjectUpdate
    );
  }

  // Stage Progress
  if (callbacks.onStageProgressUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'stage_progress',
        filter: `project_id=eq.${projectId}`,
      },
      callbacks.onStageProgressUpdate
    );
  }

  // Collaborators
  if (callbacks.onCollaboratorJoin) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'collaborators',
        filter: `project_id=eq.${projectId}`,
      },
      callbacks.onCollaboratorJoin
    );
  }
  if (callbacks.onCollaboratorUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'collaborators',
        filter: `project_id=eq.${projectId}`,
      },
      callbacks.onCollaboratorUpdate
    );
  }

  channel.subscribe();
  return channel;
}

/**
 * 建立在線狀態 (Presence) 訂閱
 */
export function subscribeToPresence(
  projectId: string,
  currentUser: PresenceState,
  callbacks: PresenceCallbacks
): RealtimeChannel | null {
  if (!supabase) return null;

  const channel = supabase.channel(`presence:${projectId}`, {
    config: {
      presence: {
        key: currentUser.collaboratorId,
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceState>();
      callbacks.onSync?.(state);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      callbacks.onJoin?.(key, newPresences as unknown as PresenceState[]);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      callbacks.onLeave?.(key, leftPresences as unknown as PresenceState[]);
    });

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track(currentUser);
    }
  });

  return channel;
}

/**
 * 取消訂閱頻道
 */
export async function unsubscribe(channel: RealtimeChannel | null) {
  if (channel && supabase) {
    await supabase.removeChannel(channel);
  }
}

/**
 * 取消所有訂閱
 */
export async function unsubscribeAll() {
  if (supabase) {
    await supabase.removeAllChannels();
  }
}
