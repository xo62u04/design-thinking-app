/**
 * Supabase Database Types
 * 這些類型對應資料庫 Schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enum types (defined first for use in Database interface)
export type DesignStage = 'empathize' | 'define' | 'ideate' | 'prototype' | 'test';
export type CoachType = 'orchestrator' | 'empathy' | 'define' | 'ideate' | 'prototype' | 'test';
export type ObservationCategory = 'pain_point' | 'behavior' | 'need' | 'insight';
export type IdeaStatus = 'raw' | 'refined' | 'selected' | 'discarded';
export type PrototypeType = 'low_fidelity' | 'medium_fidelity' | 'high_fidelity';
export type FeedbackType = 'positive' | 'negative' | 'suggestion';
export type MessageRole = 'user' | 'assistant' | 'system';
export type StageStatus = 'not_started' | 'in_progress' | 'completed';

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string;
          invite_code: string;
          current_stage: DesignStage;
          active_coach: CoachType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          invite_code?: string;
          current_stage?: DesignStage;
          active_coach?: CoachType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          invite_code?: string;
          current_stage?: DesignStage;
          active_coach?: CoachType;
          updated_at?: string;
        };
      };
      collaborators: {
        Row: {
          id: string;
          project_id: string;
          nickname: string;
          color: string;
          is_online: boolean;
          last_seen_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          nickname: string;
          color: string;
          is_online?: boolean;
          last_seen_at?: string;
          created_at?: string;
        };
        Update: {
          nickname?: string;
          color?: string;
          is_online?: boolean;
          last_seen_at?: string;
        };
      };
      observations: {
        Row: {
          id: string;
          project_id: string;
          collaborator_id: string | null;
          content: string;
          category: ObservationCategory;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          collaborator_id?: string | null;
          content: string;
          category: ObservationCategory;
          source?: string | null;
          created_at?: string;
        };
        Update: never; // Append-only
      };
      pov_statements: {
        Row: {
          id: string;
          project_id: string;
          collaborator_id: string | null;
          user_desc: string;
          need: string;
          insight: string;
          statement: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          collaborator_id?: string | null;
          user_desc: string;
          need: string;
          insight: string;
          statement: string;
          created_at?: string;
        };
        Update: never; // Append-only
      };
      ideas: {
        Row: {
          id: string;
          project_id: string;
          collaborator_id: string | null;
          title: string;
          description: string;
          votes: number;
          status: IdeaStatus;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          collaborator_id?: string | null;
          title: string;
          description?: string;
          votes?: number;
          status?: IdeaStatus;
          tags?: string[];
          created_at?: string;
        };
        Update: {
          votes?: number;
          status?: IdeaStatus;
        };
      };
      prototypes: {
        Row: {
          id: string;
          project_id: string;
          collaborator_id: string | null;
          name: string;
          description: string;
          type: PrototypeType;
          features: string[];
          whiteboard_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          collaborator_id?: string | null;
          name: string;
          description?: string;
          type?: PrototypeType;
          features?: string[];
          whiteboard_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          type?: PrototypeType;
          features?: string[];
          whiteboard_id?: string | null;
          updated_at?: string;
        };
      };
      prototype_feedbacks: {
        Row: {
          id: string;
          prototype_id: string;
          collaborator_id: string | null;
          content: string;
          feedback_type: FeedbackType;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          prototype_id: string;
          collaborator_id?: string | null;
          content: string;
          feedback_type: FeedbackType;
          source?: string | null;
          created_at?: string;
        };
        Update: never; // Append-only
      };
      chat_messages: {
        Row: {
          id: string;
          project_id: string;
          collaborator_id: string | null;
          role: MessageRole;
          content: string;
          coach_type: CoachType | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          collaborator_id?: string | null;
          role: MessageRole;
          content: string;
          coach_type?: CoachType | null;
          created_at?: string;
        };
        Update: never; // Append-only
      };
      stage_progress: {
        Row: {
          id: string;
          project_id: string;
          stage: DesignStage;
          status: StageStatus;
          completed_tasks: string[];
          notes: string[];
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          stage: DesignStage;
          status?: StageStatus;
          completed_tasks?: string[];
          notes?: string[];
          updated_at?: string;
        };
        Update: {
          status?: StageStatus;
          completed_tasks?: string[];
          notes?: string[];
          updated_at?: string;
        };
      };
      whiteboards: {
        Row: {
          id: string;
          project_id: string;
          prototype_id: string | null;
          name: string;
          elements: Json;
          app_state: Json;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          prototype_id?: string | null;
          name: string;
          elements?: Json;
          app_state?: Json;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          elements?: Json;
          app_state?: Json;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      design_stage: DesignStage;
      coach_type: CoachType;
      observation_category: ObservationCategory;
      idea_status: IdeaStatus;
      prototype_type: PrototypeType;
      feedback_type: FeedbackType;
      message_role: MessageRole;
      stage_status: StageStatus;
    };
  };
}

// Collaborator colors palette
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

// Helper type for table rows
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
