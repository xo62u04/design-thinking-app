'use client';

import {
  ProjectState,
  DesignThinkingStage,
  StageProgress,
  UserObservation,
  POVStatement,
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
} from 'lucide-react';
import { useState } from 'react';

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
}

export default function ProgressBoard({
  projectState,
  onStageClick,
  stageCompletion,
  canAdvance,
  onAdvance,
}: ProgressBoardProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    stages: true,
    observations: true,
    povs: true,
    stats: true,
  });

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
                                className={`p-2 rounded-lg border text-xs sm:text-sm break-words ${categoryColors[obs.category]}`}
                              >
                                {obs.content}
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
                    <POVCard key={pov.id} pov={pov} />
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
    </div>
  );
}

// POV 卡片組件
function POVCard({ pov }: { pov: POVStatement }) {
  return (
    <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
      <p className="text-xs sm:text-sm text-blue-800 font-medium mb-2 break-words">{pov.statement}</p>
      <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs">
        <div className="min-w-0">
          <span className="text-blue-500">使用者</span>
          <p className="text-gray-600 truncate">{pov.user || '-'}</p>
        </div>
        <div className="min-w-0">
          <span className="text-blue-500">需求</span>
          <p className="text-gray-600 truncate">{pov.need || '-'}</p>
        </div>
        <div className="min-w-0">
          <span className="text-blue-500">洞察</span>
          <p className="text-gray-600 truncate">{pov.insight || '-'}</p>
        </div>
      </div>
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
