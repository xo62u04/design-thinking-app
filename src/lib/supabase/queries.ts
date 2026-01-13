/**
 * Supabase 資料庫查詢函數
 */

import { getSupabase } from './client';
import type {
  DesignStage,
  CoachType,
} from './types';
import type {
  ProjectState,
  Collaborator,
  DesignThinkingStage,
} from '@/types/design-thinking';

// ============ Projects ============

export async function createProject(name: string, description: string = '') {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('projects')
    .insert({ name, description } as any)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

export async function getProjectByInviteCode(inviteCode: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('invite_code', inviteCode)
    .single();

  if (error) throw error;
  return data as any;
}

export async function getProjectById(projectId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data as any;
}

export async function updateProject(
  projectId: string,
  updates: { name?: string; description?: string; current_stage?: DesignStage; active_coach?: CoachType }
) {
  const supabase = getSupabase();

  const { data, error } = await (supabase
    .from('projects') as any)
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

// ============ Collaborators ============

const COLORS: readonly string[] = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

export async function joinProject(projectId: string, nickname: string) {
  const supabase = getSupabase();

  // 取得目前協作者數量來決定顏色
  const { count } = await supabase
    .from('collaborators')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  const colorIndex = (count || 0) % COLORS.length;
  const color = COLORS[colorIndex];

  const { data, error } = await supabase
    .from('collaborators')
    .insert({
      project_id: projectId,
      nickname,
      color,
      is_online: true,
    } as any)
    .select()
    .single();

  if (error) {
    // 如果是重複暱稱，嘗試取得現有的
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('collaborators')
        .select()
        .eq('project_id', projectId)
        .eq('nickname', nickname)
        .single();

      if (existing) {
        // 更新為在線
        await (supabase
          .from('collaborators') as any)
          .update({ is_online: true, last_seen_at: new Date().toISOString() })
          .eq('id', (existing as any).id);
        return existing as any;
      }
    }
    throw error;
  }
  return data as any;
}

export async function getCollaborators(projectId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('collaborators')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as any[];
}

export async function updateCollaboratorOnlineStatus(
  collaboratorId: string,
  isOnline: boolean
) {
  const supabase = getSupabase();

  const { error } = await (supabase
    .from('collaborators') as any)
    .update({
      is_online: isOnline,
      last_seen_at: new Date().toISOString(),
    })
    .eq('id', collaboratorId);

  if (error) throw error;
}

// ============ Observations ============

export async function addObservation(
  projectId: string,
  collaboratorId: string | null,
  data: { content: string; category: string; source?: string }
) {
  const supabase = getSupabase();

  const { data: inserted, error } = await supabase
    .from('observations')
    .insert({
      project_id: projectId,
      collaborator_id: collaboratorId,
      content: data.content,
      category: data.category,
      source: data.source,
    } as any)
    .select(`
      *,
      collaborator:collaborators(nickname, color)
    `)
    .single();

  if (error) throw error;
  return inserted as any;
}

export async function getObservations(projectId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('observations')
    .select(`
      *,
      collaborator:collaborators(nickname, color)
    `)
    .eq('project_id', projectId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as any[];
}

// ============ POV Statements ============

export async function addPOVStatement(
  projectId: string,
  collaboratorId: string | null,
  data: { user: string; need: string; insight: string; statement: string }
) {
  const supabase = getSupabase();

  const { data: inserted, error } = await supabase
    .from('pov_statements')
    .insert({
      project_id: projectId,
      collaborator_id: collaboratorId,
      user_desc: data.user,
      need: data.need,
      insight: data.insight,
      statement: data.statement,
    } as any)
    .select(`
      *,
      collaborator:collaborators(nickname, color)
    `)
    .single();

  if (error) throw error;
  return inserted as any;
}

export async function getPOVStatements(projectId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('pov_statements')
    .select(`
      *,
      collaborator:collaborators(nickname, color)
    `)
    .eq('project_id', projectId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as any[];
}

// ============ Ideas ============

export async function addIdea(
  projectId: string,
  collaboratorId: string | null,
  data: { title: string; description?: string; tags?: string[] }
) {
  const supabase = getSupabase();

  const { data: inserted, error } = await supabase
    .from('ideas')
    .insert({
      project_id: projectId,
      collaborator_id: collaboratorId,
      title: data.title,
      description: data.description || '',
      tags: data.tags || [],
    } as any)
    .select(`
      *,
      collaborator:collaborators(nickname, color)
    `)
    .single();

  if (error) throw error;
  return inserted as any;
}

export async function getIdeas(projectId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('ideas')
    .select(`
      *,
      collaborator:collaborators(nickname, color)
    `)
    .eq('project_id', projectId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as any[];
}

export async function voteIdea(ideaId: string, delta: number) {
  const supabase = getSupabase();

  // 先取得目前票數
  const { data: current } = await supabase
    .from('ideas')
    .select('votes')
    .eq('id', ideaId)
    .single();

  const { error } = await (supabase
    .from('ideas') as any)
    .update({ votes: ((current as any)?.votes || 0) + delta })
    .eq('id', ideaId);

  if (error) throw error;
}

// ============ Prototypes ============

export async function addPrototype(
  projectId: string,
  collaboratorId: string | null,
  data: { name: string; description?: string; type?: string; features?: string[] }
) {
  const supabase = getSupabase();

  const { data: inserted, error } = await supabase
    .from('prototypes')
    .insert({
      project_id: projectId,
      collaborator_id: collaboratorId,
      name: data.name,
      description: data.description || '',
      type: data.type || 'low_fidelity',
      features: data.features || [],
    } as any)
    .select(`
      *,
      collaborator:collaborators(nickname, color)
    `)
    .single();

  if (error) throw error;
  return inserted as any;
}

export async function getPrototypes(projectId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('prototypes')
    .select(`
      *,
      collaborator:collaborators(nickname, color),
      feedbacks:prototype_feedbacks(
        *,
        collaborator:collaborators(nickname, color)
      )
    `)
    .eq('project_id', projectId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as any[];
}

export async function addPrototypeFeedback(
  prototypeId: string,
  collaboratorId: string | null,
  data: { content: string; feedbackType: string; source?: string }
) {
  const supabase = getSupabase();

  const { data: inserted, error } = await supabase
    .from('prototype_feedbacks')
    .insert({
      prototype_id: prototypeId,
      collaborator_id: collaboratorId,
      content: data.content,
      feedback_type: data.feedbackType,
      source: data.source,
    } as any)
    .select(`
      *,
      collaborator:collaborators(nickname, color)
    `)
    .single();

  if (error) throw error;
  return inserted as any;
}

export async function updatePrototypeWhiteboardId(
  prototypeId: string,
  whiteboardId: string
) {
  const supabase = getSupabase();

  const { error } = await (supabase
    .from('prototypes') as any)
    .update({ whiteboard_id: whiteboardId })
    .eq('id', prototypeId);

  if (error) throw error;
}

// ============ Chat Messages ============

export async function addChatMessage(
  projectId: string,
  collaboratorId: string | null,
  data: { role: 'user' | 'assistant' | 'system'; content: string; coachType?: string }
) {
  const supabase = getSupabase();

  const { data: inserted, error } = await supabase
    .from('chat_messages')
    .insert({
      project_id: projectId,
      collaborator_id: collaboratorId,
      role: data.role,
      content: data.content,
      coach_type: data.coachType,
    } as any)
    .select(`
      *,
      collaborator:collaborators(nickname, color)
    `)
    .single();

  if (error) throw error;
  return inserted as any;
}

export async function getChatMessages(projectId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      collaborator:collaborators(nickname, color)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as any[];
}

// ============ Stage Progress ============

export async function getStageProgress(projectId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('stage_progress')
    .select('*')
    .eq('project_id', projectId)
    .order('stage', { ascending: true });

  if (error) throw error;
  return (data || []) as any[];
}

export async function updateStageProgress(
  projectId: string,
  stage: DesignThinkingStage,
  updates: { status?: 'not_started' | 'in_progress' | 'completed' }
) {
  const supabase = getSupabase();

  const { error } = await (supabase
    .from('stage_progress') as any)
    .update(updates)
    .eq('project_id', projectId)
    .eq('stage', stage);

  if (error) throw error;
}

// ============ Full Project State ============

export async function loadFullProjectState(projectId: string): Promise<ProjectState | null> {
  try {
    const [
      project,
      collaborators,
      observations,
      povStatements,
      surveys,
      ideas,
      prototypes,
      chatMessages,
      stageProgress,
    ] = await Promise.all([
      getProjectById(projectId),
      getCollaborators(projectId),
      getObservations(projectId),
      getPOVStatements(projectId),
      getProjectSurveys(projectId),
      getIdeas(projectId),
      getPrototypes(projectId),
      getChatMessages(projectId),
      getStageProgress(projectId),
    ]);

    // 為每個問卷獲取回答
    const surveysWithResponses = await Promise.all(
      surveys.map(async (survey: any) => {
        const responses = await getSurveyResponses(survey.id);
        return { ...survey, responses };
      })
    );

    // 轉換為 ProjectState 格式
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      inviteCode: project.invite_code,
      isCollaborative: true,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      currentStage: project.current_stage as DesignThinkingStage,
      activeCoach: project.active_coach,
      collaborators: collaborators.map((c: any) => ({
        id: c.id,
        projectId: c.project_id,
        nickname: c.nickname,
        color: c.color,
        isOnline: c.is_online,
        lastSeenAt: c.last_seen_at,
        createdAt: c.created_at,
      })),
      observations: observations.map((o: any) => ({
        id: o.id,
        content: o.content,
        category: o.category,
        source: o.source || undefined,
        createdAt: o.created_at,
        collaboratorId: o.collaborator_id || undefined,
        collaboratorNickname: o.collaborator?.nickname,
        collaboratorColor: o.collaborator?.color,
      })),
      povStatements: povStatements.map((p: any) => ({
        id: p.id,
        user: p.user_desc,
        need: p.need,
        insight: p.insight,
        statement: p.statement,
        createdAt: p.created_at,
        collaboratorId: p.collaborator_id || undefined,
        collaboratorNickname: p.collaborator?.nickname,
        collaboratorColor: p.collaborator?.color,
      })),
      surveys: surveysWithResponses.map((s: any) => ({
        id: s.id,
        question: s.question,
        type: s.type,
        options: s.options || [],
        responses: (s.responses || []).map((r: any) => ({
          id: r.id,
          surveyId: r.survey_id,
          respondentName: r.respondent_name,
          response: r.response,
          createdAt: r.created_at,
        })),
        createdAt: s.created_at,
        collaboratorId: s.created_by || undefined,
      })),
      ideas: ideas.map((i: any) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        votes: i.votes,
        status: i.status,
        tags: i.tags,
        createdAt: i.created_at,
        collaboratorId: i.collaborator_id || undefined,
        collaboratorNickname: i.collaborator?.nickname,
        collaboratorColor: i.collaborator?.color,
      })),
      prototypes: prototypes.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        type: p.type,
        features: p.features,
        whiteboardId: p.whiteboard_id || undefined,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        feedbacks: (p.feedbacks || []).map((f: any) => ({
          id: f.id,
          content: f.content,
          type: f.feedback_type,
          source: f.source || '',
          createdAt: f.created_at,
        })),
      })),
      chatHistory: chatMessages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        coachType: m.coach_type || undefined,
        timestamp: m.created_at,
        collaboratorId: m.collaborator_id || undefined,
        collaboratorNickname: m.collaborator?.nickname,
        collaboratorColor: m.collaborator?.color,
      })),
      stageProgress: stageProgress.map((s: any) => ({
        stage: s.stage as DesignThinkingStage,
        status: s.status,
        completedTasks: s.completed_tasks,
        notes: s.notes,
      })),
    };
  } catch (error) {
    console.error('Failed to load project state:', error);
    return null;
  }
}

// ============ Whiteboards ============

export async function createWhiteboard(
  projectId: string,
  collaboratorId: string | null,
  data: {
    name: string;
    prototypeId?: string;
  }
) {
  const supabase = getSupabase();

  const { data: whiteboard, error } = await supabase
    .from('whiteboards')
    .insert({
      project_id: projectId,
      prototype_id: data.prototypeId,
      name: data.name,
      elements: [],
      app_state: {},
      created_by: collaboratorId,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return whiteboard as any;
}

export async function getWhiteboard(whiteboardId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('whiteboards')
    .select('*')
    .eq('id', whiteboardId)
    .single();

  if (error) throw error;
  return data as any;
}

export async function getProjectWhiteboards(projectId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('whiteboards')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any[];
}

export async function updateWhiteboard(
  whiteboardId: string,
  data: {
    elements?: any[];
    appState?: Record<string, any>;
    name?: string;
  }
) {
  const supabase = getSupabase();

  const updateData: {
    elements?: any;
    app_state?: any;
    name?: string;
  } = {};

  if (data.elements !== undefined) updateData.elements = data.elements;
  if (data.appState !== undefined) updateData.app_state = data.appState;
  if (data.name !== undefined) updateData.name = data.name;

  const { data: whiteboard, error } = await (supabase
    .from('whiteboards') as any)
    .update(updateData)
    .eq('id', whiteboardId)
    .select()
    .single();

  if (error) throw error;
  return whiteboard as any;
}

export async function deleteWhiteboard(whiteboardId: string) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('whiteboards')
    .delete()
    .eq('id', whiteboardId);

  if (error) throw error;
}

// ============ Surveys ============

export async function createSurvey(
  projectId: string,
  collaboratorId: string | null,
  data: {
    question: string;
    type: 'text' | 'multiple_choice' | 'rating' | 'open_ended';
    options?: string[];
  }
) {
  const supabase = getSupabase();

  const { data: survey, error } = await supabase
    .from('surveys')
    .insert({
      project_id: projectId,
      question: data.question,
      type: data.type,
      options: data.options || [],
      created_by: collaboratorId,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return survey as any;
}

export async function getSurvey(surveyId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', surveyId)
    .single();

  if (error) throw error;
  return data as any;
}

export async function getProjectSurveys(projectId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any[];
}

export async function updateSurvey(
  surveyId: string,
  data: {
    question?: string;
    type?: 'text' | 'multiple_choice' | 'rating' | 'open_ended';
    options?: string[];
  }
) {
  const supabase = getSupabase();

  const updateData: any = {};
  if (data.question !== undefined) updateData.question = data.question;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.options !== undefined) updateData.options = data.options;

  const { data: survey, error } = await (supabase
    .from('surveys') as any)
    .update(updateData)
    .eq('id', surveyId)
    .select()
    .single();

  if (error) throw error;
  return survey as any;
}

export async function deleteSurvey(surveyId: string) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('surveys')
    .delete()
    .eq('id', surveyId);

  if (error) throw error;
}

// ============ Survey Responses ============

export async function addSurveyResponse(
  surveyId: string,
  collaboratorId: string | null,
  data: {
    respondentName: string;
    response: string;
  }
) {
  const supabase = getSupabase();

  const { data: surveyResponse, error } = await supabase
    .from('survey_responses')
    .insert({
      survey_id: surveyId,
      respondent_name: data.respondentName,
      response: data.response,
      created_by: collaboratorId,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return surveyResponse as any;
}

export async function getSurveyResponses(surveyId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('survey_responses')
    .select('*')
    .eq('survey_id', surveyId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as any[];
}

// ==================== 軟刪除 / 停用功能 ====================

/**
 * 切換紀錄的啟用狀態 (軟刪除)
 */
export async function toggleRecordActive(
  table: 'observations' | 'pov_statements' | 'surveys' | 'survey_responses' | 'ideas' | 'prototypes',
  recordId: string,
  isActive: boolean
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await (supabase.from(table) as any).update({ is_active: isActive }).eq('id', recordId);

  if (error) throw error;
}

/**
 * 停用觀察紀錄
 */
export async function toggleObservationActive(id: string, isActive: boolean) {
  return toggleRecordActive('observations', id, isActive);
}

/**
 * 停用 POV 陳述
 */
export async function togglePOVActive(id: string, isActive: boolean) {
  return toggleRecordActive('pov_statements', id, isActive);
}

/**
 * 停用問卷
 */
export async function toggleSurveyActive(id: string, isActive: boolean) {
  return toggleRecordActive('surveys', id, isActive);
}

/**
 * 停用問卷回答
 */
export async function toggleSurveyResponseActive(id: string, isActive: boolean) {
  return toggleRecordActive('survey_responses', id, isActive);
}

/**
 * 停用點子
 */
export async function toggleIdeaActive(id: string, isActive: boolean) {
  return toggleRecordActive('ideas', id, isActive);
}

/**
 * 停用原型
 */
export async function togglePrototypeActive(id: string, isActive: boolean) {
  return toggleRecordActive('prototypes', id, isActive);
}
