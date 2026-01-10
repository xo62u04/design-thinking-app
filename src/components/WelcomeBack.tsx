'use client';

import { ActivityRecord, getTimeAgo } from '@/lib/storage';
import { COACH_CONFIG } from '@/constants/prompts';
import { CoachType } from '@/types/design-thinking';
import {
  X,
  Clock,
  ArrowRight,
  Heart,
  Target,
  Lightbulb,
  Box,
  FlaskConical,
  Brain,
  RefreshCw,
} from 'lucide-react';

const stageIcons = {
  empathize: Heart,
  define: Target,
  ideate: Lightbulb,
  prototype: Box,
  test: FlaskConical,
};

const stageNames: Record<string, string> = {
  empathize: '同理心',
  define: '定義',
  ideate: '發想',
  prototype: '原型',
  test: '測試',
};

interface WelcomeBackProps {
  activity: ActivityRecord;
  onContinue: () => void;
  onNewProject: () => void;
}

export default function WelcomeBack({
  activity,
  onContinue,
  onNewProject,
}: WelcomeBackProps) {
  const StageIcon = stageIcons[activity.stage as keyof typeof stageIcons] || Brain;
  const coachConfig = COACH_CONFIG[activity.coachType as CoachType];
  const timeAgo = getTimeAgo(activity.timestamp);
  const stageName = stageNames[activity.stage] || activity.stage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">歡迎回來！</h2>
              <p className="text-sm text-white/80">您有未完成的專案</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Project Info */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 text-lg mb-1">
              {activity.projectName}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              上次編輯：{timeAgo}
            </p>
          </div>

          {/* Current Stage */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${coachConfig?.bgColor || 'bg-purple-100'}`}>
                <StageIcon className={`w-5 h-5 ${coachConfig?.color || 'text-purple-600'}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">目前階段</p>
                <p className="font-medium text-gray-800">{stageName}階段</p>
              </div>
            </div>

            {/* Activity Description */}
            <p className="text-sm text-gray-600 break-words">
              {activity.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onContinue}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              繼續進行
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNewProject}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              新專案
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
