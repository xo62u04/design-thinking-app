'use client';

import {
  ProjectState,
  DesignThinkingStage,
  StageProgress,
  UserObservation,
  POVStatement,
  Survey,
  Idea,
  Prototype,
} from '@/types/design-thinking';
import { COACH_CONFIG, STAGE_TO_COACH } from '@/constants/prompts';
import {
  Heart,
  Target,
  Lightbulb,
  Box,
  FlaskConical,
  CheckCircle2,
  Circle,
  PlayCircle,
  ChevronRight,
  ChevronDown,
  Users,
  MessageSquare,
  Sparkles,
  Layers,
  Frown,
  Eye,
  Zap,
  HelpCircle,
  Pen,
  ClipboardList,
  Plus,
  EyeOff,
} from 'lucide-react';
import { useState } from 'react';
import SurveyCard from './SurveyCard';
import CreateSurveyModal from './CreateSurveyModal';

const stageIcons = {
  empathize: Heart,
  define: Target,
  ideate: Lightbulb,
  prototype: Box,
  test: FlaskConical,
};

const stageNames: Record<DesignThinkingStage, string> = {
  empathize: '同理心',
  define: '定義',
  ideate: '發想',
  prototype: '原型',
  test: '測試',
};

const categoryIcons: Record<UserObservation['category'], typeof Frown> = {
  pain_point: Frown,
  behavior: Eye,
  need: Zap,
  insight: Lightbulb,
};

const categoryLabels: Record<UserObservation['category'], string> = {
  pain_point: '痛點',
  behavior: '行為',
  need: '需求',
  insight: '洞察',
};

const categoryColors: Record<UserObservation['category'], string> = {
  pain_point: 'bg-red-50 text-red-700 border-red-200',
  behavior: 'bg-blue-50 text-blue-700 border-blue-200',
  need: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  insight: 'bg-purple-50 text-purple-700 border-purple-200',
};

interface ProgressBoardProps {
  projectState: ProjectState;
  onStageClick: (stage: DesignThinkingStage) => void;
  stageCompletion?: Record<DesignThinkingStage, number>;
  canAdvance?: boolean;
  onAdvance?: () => void;
  onOpenWhiteboard?: (prototypeId: string) => void;
  onOpenSurvey?: (surveyId: string) => void;
  onToggleRecordActive?: (
    type: 'observation' | 'pov' | 'survey' | 'idea' | 'prototype',
    id: string,
    isActive: boolean
  ) => void;
  onCreateSurvey?: (surveyData: {
    question: string;
    type: 'text' | 'multiple_choice' | 'rating' | 'open_ended';
    options?: string[];
  }) => void;
}

export default function ProgressBoard({
  projectState,
  onStageClick,
  stageCompletion,
  canAdvance,
  onAdvance,
  onOpenWhiteboard,
  onOpenSurvey,
  onCreateSurvey,
  onToggleRecordActive,
}: ProgressBoardProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    stages: true,
    observations: true,
    povs: true,
    surveys: true,
    ideas: true,
    prototypes: true,
    stats: true,
  });
  const [isCreateSurveyModalOpen, setIsCreateSurveyModalOpen] = useState(false);

  const stages: DesignThinkingStage[] = [
    'empathize',
    'define',
    'ideate',
    'prototype',
    'test',
  ];

  const getStageStatus = (stage: DesignThinkingStage): StageProgress => {
    return (
      projectState.stageProgress.find((s) => s.stage === stage) || {
        stage,
        status: 'not_started',
        completedTasks: [],
        notes: [],
      }
    );
  };

  const getStatusIcon = (status: StageProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />;
      case 'in_progress':
        return <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />;
      default:
        return <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300" />;
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // 依類別分組觀察記錄
  const groupedObservations = projectState.observations.reduce((acc, obs) => {
    if (!acc[obs.category]) {
      acc[obs.category] = [];
    }
    acc[obs.category].push(obs);
    return acc;
  }, {} as Record<UserObservation['category'], UserObservation[]>);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-800 text-sm sm:text-base truncate">專案進度看板</h2>
            <p className="text-xs text-gray-500 truncate">{projectState.name || '新專案'}</p>
          </div>
          {canAdvance && onAdvance && (
            <button
              onClick={onAdvance}
              className="flex-shrink-0 px-2 sm:px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              下一階段
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Stage Progress */}
        <div className="border-b">
          <button
            onClick={() => toggleSection('stages')}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <h3 className="text-xs font-medium text-gray-500">階段進度</h3>
            {expandedSections.stages ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {expandedSections.stages && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="space-y-1">
                {stages.map((stage, index) => {
                  const stageProgress = getStageStatus(stage);
                  const coachType = STAGE_TO_COACH[stage];
                  const coachConfig = COACH_CONFIG[coachType];
                  const Icon = stageIcons[stage];
                  const isActive = projectState.currentStage === stage;
                  const completion = stageCompletion?.[stage] || 0;

                  return (
                    <div key={stage}>
                      <button
                        onClick={() => onStageClick(stage)}
                        className={`w-full flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg transition-all ${
                          isActive
                            ? `${coachConfig.bgColor} ring-2 ring-offset-1 ${coachConfig.color.replace('text', 'ring')}`
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 p-1 sm:p-1.5 rounded-lg ${
                            isActive ? 'bg-white' : coachConfig.bgColor
                          }`}
                        >
                          <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${coachConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span
                              className={`text-xs sm:text-sm font-medium truncate ${
                                isActive ? coachConfig.color : 'text-gray-700'
                              }`}
                            >
                              {stageNames[stage]}
                            </span>
                            {getStatusIcon(stageProgress.status)}
                          </div>
                          {stageCompletion && (
                            <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  completion >= 100 ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(100, completion)}%` }}
                              />
                            </div>
                          )}
                        </div>
                        <ChevronRight
                          className={`flex-shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                            isActive ? coachConfig.color : 'text-gray-300'
                          }`}
                        />
                      </button>
                      {index < stages.length - 1 && (
                        <div className="ml-4 sm:ml-5 h-1 w-px bg-gray-200" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Observations Section */}
        <div className="border-b">
          <button
            onClick={() => toggleSection('observations')}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                使用者觀察
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                {projectState.observations.length}
              </span>
            </div>
            {expandedSections.observations ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {expandedSections.observations && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              {projectState.observations.length === 0 ? (
                <div className="text-center py-3 sm:py-4">
                  <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-400">尚無觀察記錄</p>
                  <p className="text-xs text-gray-300 mt-1">
                    與同理心教練對話收集洞察
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {(['pain_point', 'need', 'behavior', 'insight'] as const).map(
                    (category) => {
                      const items = groupedObservations[category];
                      if (!items || items.length === 0) return null;

                      const CategoryIcon = categoryIcons[category];

                      return (
                        <div key={category}>
                          <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
                            <CategoryIcon className="w-3 h-3 text-gray-500" />
                            <span className="text-xs font-medium text-gray-500">
                              {categoryLabels[category]}
                            </span>
                          </div>
                          <div className="space-y-1.5 sm:space-y-2">
                            {items.map((obs) => (
                              <div
                                key={obs.id}
                                className={`p-2 rounded-lg border text-xs sm:text-sm break-words ${categoryColors[obs.category]} ${obs.isActive === false ? 'opacity-50 bg-gray-100' : ''} flex items-start justify-between gap-2`}
                              >
                                <span className="flex-1">{obs.content}</span>
                                {onToggleRecordActive && (
                                  <button
                                    onClick={() => onToggleRecordActive('observation', obs.id, obs.isActive === false)}
                                    className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                                    title={obs.isActive === false ? '啟用此紀錄' : '停用此紀錄'}
                                  >
                                    {obs.isActive === false ? (
                                      <Eye className="h-3.5 w-3.5" />
                                    ) : (
                                      <EyeOff className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* POV Statements Section */}
        <div className="border-b">
          <button
            onClick={() => toggleSection('povs')}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                POV 陳述
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                {projectState.povStatements.length}
              </span>
            </div>
            {expandedSections.povs ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {expandedSections.povs && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              {projectState.povStatements.length === 0 ? (
                <div className="text-center py-3 sm:py-4">
                  <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-400">尚無 POV 陳述</p>
                  <p className="text-xs text-gray-300 mt-1">
                    與定義教練建立 POV
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {projectState.povStatements.map((pov) => (
                    <POVCard
                      key={pov.id}
                      pov={pov}
                      onToggle={(id, isActive) => onToggleRecordActive?.('pov', id, isActive)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Surveys Section */}
        <div className="border-b">
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
            <button
              onClick={() => toggleSection('surveys')}
              className="flex items-center gap-2 hover:bg-gray-50 rounded px-2 py-1 -ml-2"
            >
              <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                問卷調查
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 text-xs bg-indigo-100 text-indigo-600 rounded-full">
                {projectState.surveys.length}
              </span>
              {expandedSections.surveys ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {/* 建立問卷按鈕 */}
            {onCreateSurvey && (
              <button
                onClick={() => setIsCreateSurveyModalOpen(true)}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">建立問卷</span>
              </button>
            )}
          </div>

          {expandedSections.surveys && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              {projectState.surveys.length === 0 ? (
                <div className="text-center py-3 sm:py-4">
                  <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-400">尚無問卷調查</p>
                  <p className="text-xs text-gray-300 mt-1">
                    與調查教練設計問卷
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {projectState.surveys.map((survey) => (
                    <SurveyCard
                      key={survey.id}
                      survey={survey}
                      onOpenSurvey={onOpenSurvey}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ideas Section */}
        <div className="border-b">
          <button
            onClick={() => toggleSection('ideas')}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                創意點子
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 text-xs bg-yellow-100 text-yellow-600 rounded-full">
                {projectState.ideas.length}
              </span>
            </div>
            {expandedSections.ideas ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {expandedSections.ideas && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              {projectState.ideas.length === 0 ? (
                <div className="text-center py-3 sm:py-4">
                  <Lightbulb className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-400">尚無創意點子</p>
                  <p className="text-xs text-gray-300 mt-1">
                    與發想教練產生點子
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {projectState.ideas.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      onToggle={(id, isActive) => onToggleRecordActive?.('idea', id, isActive)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prototypes Section */}
        <div className="border-b">
          <button
            onClick={() => toggleSection('prototypes')}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                原型設計
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded-full">
                {projectState.prototypes.length}
              </span>
            </div>
            {expandedSections.prototypes ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {expandedSections.prototypes && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              {projectState.prototypes.length === 0 ? (
                <div className="text-center py-3 sm:py-4">
                  <Box className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-400">尚無原型設計</p>
                  <p className="text-xs text-gray-300 mt-1">
                    與原型教練建立原型
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {projectState.prototypes.map((prototype) => (
                    <PrototypeCard
                      key={prototype.id}
                      prototype={prototype}
                      onOpenWhiteboard={onOpenWhiteboard}
                      onToggle={(id, isActive) => onToggleRecordActive?.('prototype', id, isActive)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div>
          <button
            onClick={() => toggleSection('stats')}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <h3 className="text-xs font-medium text-gray-500">產出統計</h3>
            {expandedSections.stats ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {expandedSections.stats && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  icon={<Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />}
                  value={projectState.observations.length}
                  label="觀察"
                  target={3}
                />
                <StatCard
                  icon={<MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />}
                  value={projectState.povStatements.length}
                  label="POV"
                  target={1}
                />
                <StatCard
                  icon={<Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />}
                  value={projectState.ideas.length}
                  label="點子"
                  target={15}
                />
                <StatCard
                  icon={<Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />}
                  value={projectState.prototypes.length}
                  label="原型"
                  target={1}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 建立問卷模態框 */}
      {onCreateSurvey && (
        <CreateSurveyModal
          isOpen={isCreateSurveyModalOpen}
          onClose={() => setIsCreateSurveyModalOpen(false)}
          onCreateSurvey={onCreateSurvey}
        />
      )}
    </div>
  );
}

// POV 卡片組件
function POVCard({ pov, onToggle }: { pov: POVStatement; onToggle?: (id: string, isActive: boolean) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = pov.statement.length > 80;

  return (
    <div className={`p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200 ${pov.isActive === false ? 'opacity-50 bg-gray-100' : ''} relative`}>
      {onToggle && (
        <button
          onClick={() => onToggle(pov.id, pov.isActive === false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
          title={pov.isActive === false ? '啟用此紀錄' : '停用此紀錄'}
        >
          {pov.isActive === false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
      )}
      <div className="mb-2">
        <p className={`text-xs sm:text-sm text-blue-800 font-medium break-words ${!isExpanded && shouldTruncate ? 'line-clamp-2' : ''}`}>
          {pov.statement}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium"
          >
            {isExpanded ? '收合' : '展開全部'}
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs">
        <div className="min-w-0">
          <span className="text-blue-500 block">使用者</span>
          <p className="text-gray-600 break-words">{pov.user || '-'}</p>
        </div>
        <div className="min-w-0">
          <span className="text-blue-500 block">需求</span>
          <p className="text-gray-600 break-words">{pov.need || '-'}</p>
        </div>
        <div className="min-w-0">
          <span className="text-blue-500 block">洞察</span>
          <p className="text-gray-600 break-words">{pov.insight || '-'}</p>
        </div>
      </div>
    </div>
  );
}

// 點子卡片組件
function IdeaCard({ idea, onToggle }: { idea: Idea; onToggle?: (id: string, isActive: boolean) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = idea.description.length > 80;

  const statusLabels = {
    raw: '初步',
    refined: '精煉',
    selected: '已選',
    discarded: '捨棄',
  };

  const statusColors = {
    raw: 'bg-gray-100 text-gray-700',
    refined: 'bg-blue-100 text-blue-700',
    selected: 'bg-green-100 text-green-700',
    discarded: 'bg-red-100 text-red-700',
  };

  return (
    <div className={`p-2 sm:p-3 bg-yellow-50 rounded-lg border border-yellow-200 ${idea.isActive === false ? 'opacity-50 bg-gray-100' : ''} relative`}>
      {onToggle && (
        <button
          onClick={() => onToggle(idea.id, idea.isActive === false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
          title={idea.isActive === false ? '啟用此紀錄' : '停用此紀錄'}
        >
          {idea.isActive === false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-xs sm:text-sm text-yellow-800 font-medium break-words flex-1">
          {idea.title}
        </h4>
        <span className={`flex-shrink-0 px-1.5 py-0.5 text-xs rounded ${statusColors[idea.status]}`}>
          {statusLabels[idea.status]}
        </span>
      </div>
      <div className="mb-2">
        <p className={`text-xs text-gray-700 break-words ${!isExpanded && shouldTruncate ? 'line-clamp-2' : ''}`}>
          {idea.description}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-yellow-600 hover:text-yellow-700 mt-1 font-medium"
          >
            {isExpanded ? '收合' : '展開全部'}
          </button>
        )}
      </div>
      {idea.tags && idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {idea.tags.map((tag, idx) => (
            <span key={idx} className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// 原型卡片組件
function PrototypeCard({
  prototype,
  onOpenWhiteboard,
  onToggle,
}: {
  prototype: Prototype;
  onOpenWhiteboard?: (prototypeId: string) => void;
  onToggle?: (id: string, isActive: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = prototype.description.length > 80;

  const typeLabels = {
    low_fidelity: '低保真',
    medium_fidelity: '中保真',
    high_fidelity: '高保真',
  };

  const typeColors = {
    low_fidelity: 'bg-green-100 text-green-700',
    medium_fidelity: 'bg-blue-100 text-blue-700',
    high_fidelity: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className={`p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200 ${prototype.isActive === false ? 'opacity-50 bg-gray-100' : ''} relative`}>
      {onToggle && (
        <button
          onClick={() => onToggle(prototype.id, prototype.isActive === false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
          title={prototype.isActive === false ? '啟用此紀錄' : '停用此紀錄'}
        >
          {prototype.isActive === false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-xs sm:text-sm text-green-800 font-medium break-words flex-1">
          {prototype.name}
        </h4>
        <span className={`flex-shrink-0 px-1.5 py-0.5 text-xs rounded ${typeColors[prototype.type]}`}>
          {typeLabels[prototype.type]}
        </span>
      </div>
      <div className="mb-2">
        <p className={`text-xs text-gray-700 break-words ${!isExpanded && shouldTruncate ? 'line-clamp-2' : ''}`}>
          {prototype.description}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-green-600 hover:text-green-700 mt-1 font-medium"
          >
            {isExpanded ? '收合' : '展開全部'}
          </button>
        )}
      </div>
      {prototype.features && prototype.features.length > 0 && (
        <div className="mb-2">
          <span className="text-xs text-green-600 font-medium">功能特色：</span>
          <ul className="mt-1 space-y-0.5">
            {prototype.features.map((feature, idx) => (
              <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                <span className="text-green-500 mt-0.5">•</span>
                <span className="break-words flex-1">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* 開啟白板按鈕 */}
      {onOpenWhiteboard && (
        <button
          onClick={() => onOpenWhiteboard(prototype.id)}
          className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
        >
          <Pen className="w-3 h-3" />
          開啟協作白板
        </button>
      )}
    </div>
  );
}

// 統計卡片組件
function StatCard({
  icon,
  value,
  label,
  target,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  target: number;
}) {
  const progress = Math.min(100, (value / target) * 100);
  const isComplete = value >= target;

  return (
    <div className="p-1.5 sm:p-2 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
        {icon}
        <span className="text-base sm:text-lg font-semibold text-gray-800">{value}</span>
        <span className="text-xs text-gray-400">/{target}</span>
      </div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isComplete ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
