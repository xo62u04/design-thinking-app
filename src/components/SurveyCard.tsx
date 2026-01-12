'use client';

import { Survey } from '@/types/design-thinking';
import { ClipboardList, Star, MessageSquare, CheckSquare, BarChart3 } from 'lucide-react';

interface SurveyCardProps {
  survey: Survey;
}

const surveyTypeIcons = {
  text: MessageSquare,
  multiple_choice: CheckSquare,
  rating: Star,
  open_ended: BarChart3,
};

const surveyTypeNames = {
  text: '簡答題',
  multiple_choice: '多選題',
  rating: '評分題',
  open_ended: '開放題',
};

export default function SurveyCard({ survey }: SurveyCardProps) {
  const TypeIcon = surveyTypeIcons[survey.type];

  return (
    <div className="border rounded-lg p-2 sm:p-3 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2">
        <TypeIcon className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">
              {surveyTypeNames[survey.type]}
            </span>
            {survey.responses.length > 0 && (
              <span className="text-[10px] sm:text-xs text-gray-500">
                {survey.responses.length} 份回答
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-gray-800 font-medium mb-2">
            {survey.question}
          </p>

          {/* 顯示選項（如果是多選題） */}
          {survey.type === 'multiple_choice' && survey.options && (
            <div className="space-y-1 mb-2">
              {survey.options.map((option, idx) => {
                const responseCount = survey.responses.filter(
                  r => r.response === option
                ).length;
                const percentage = survey.responses.length > 0
                  ? Math.round((responseCount / survey.responses.length) * 100)
                  : 0;

                return (
                  <div key={idx} className="text-[10px] sm:text-xs">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-gray-700">{option}</span>
                      {survey.responses.length > 0 && (
                        <span className="text-gray-500">
                          {responseCount} ({percentage}%)
                        </span>
                      )}
                    </div>
                    {survey.responses.length > 0 && (
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 顯示評分統計（如果是評分題） */}
          {survey.type === 'rating' && survey.responses.length > 0 && (
            <div className="text-[10px] sm:text-xs text-gray-600 mb-2">
              <div className="flex items-center gap-2">
                <span>平均分：</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const avgRating = survey.responses.reduce(
                      (sum, r) => sum + Number(r.response), 0
                    ) / survey.responses.length;
                    return (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= avgRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    );
                  })}
                  <span className="ml-1 text-gray-700 font-medium">
                    {(survey.responses.reduce((sum, r) => sum + Number(r.response), 0) /
                      survey.responses.length).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 顯示部分回答（如果是開放題或簡答題） */}
          {(survey.type === 'text' || survey.type === 'open_ended') &&
            survey.responses.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 mb-1">部分回答：</p>
                {survey.responses.slice(0, 2).map((response) => (
                  <div
                    key={response.id}
                    className="text-[10px] sm:text-xs text-gray-600 bg-gray-50 rounded p-1.5"
                  >
                    <span className="font-medium text-gray-700">
                      {response.respondentName}:
                    </span>{' '}
                    {String(response.response)}
                  </div>
                ))}
                {survey.responses.length > 2 && (
                  <p className="text-[10px] text-gray-400 italic">
                    還有 {survey.responses.length - 2} 份回答...
                  </p>
                )}
              </div>
            )}

          {/* 創建時間和協作者資訊 */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
            <span>
              {new Date(survey.createdAt).toLocaleDateString('zh-TW', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            {survey.collaboratorNickname && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: survey.collaboratorColor }}
                  />
                  <span>{survey.collaboratorNickname}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
