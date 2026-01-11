'use client';

import { ChatMessage } from '@/types/design-thinking';
import { COACH_CONFIG } from '@/constants/prompts';
import {
  Brain,
  Heart,
  Target,
  Lightbulb,
  Box,
  FlaskConical,
  User,
  Save,
} from 'lucide-react';

const iconMap = {
  Brain,
  Heart,
  Target,
  Lightbulb,
  Box,
  FlaskConical,
};

interface MessageItemProps {
  message: ChatMessage;
  showCollaborator?: boolean;
  onRetryRecording?: (messageContent: string) => void;
  isRetrying?: boolean;
}

export default function MessageItem({
  message,
  showCollaborator = false,
  onRetryRecording,
  isRetrying = false,
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const coachConfig = message.coachType
    ? COACH_CONFIG[message.coachType]
    : null;

  const IconComponent = coachConfig
    ? iconMap[coachConfig.icon as keyof typeof iconMap]
    : null;

  // 協作者資訊
  const hasCollaborator = showCollaborator && message.collaboratorNickname;
  const collaboratorColor = message.collaboratorColor || '#6B7280';

  // 判斷是否應該顯示「記錄」按鈕
  const shouldShowRetryButton =
    !isUser &&
    onRetryRecording &&
    message.coachType &&
    ['empathy', 'define', 'ideate', 'prototype'].includes(message.coachType);

  const handleRetryRecording = () => {
    if (onRetryRecording && !isRetrying) {
      onRetryRecording(message.content);
    }
  };

  // Debug: 在開發環境中顯示按鈕狀態
  if (process.env.NODE_ENV === 'development' && !isUser) {
    console.log('MessageItem Debug:', {
      coachType: message.coachType,
      hasCallback: !!onRetryRecording,
      shouldShow: shouldShowRetryButton,
      isRetrying,
    });
  }

  return (
    <div
      className={`flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-medium text-xs ${
          isUser && hasCollaborator
            ? 'text-white'
            : isUser
            ? 'bg-gray-200'
            : coachConfig?.bgColor || 'bg-purple-100'
        }`}
        style={
          isUser && hasCollaborator
            ? { backgroundColor: collaboratorColor }
            : undefined
        }
        title={hasCollaborator ? message.collaboratorNickname : undefined}
      >
        {isUser && hasCollaborator ? (
          message.collaboratorNickname!.charAt(0).toUpperCase()
        ) : isUser ? (
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
        ) : IconComponent ? (
          <IconComponent
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${coachConfig?.color || 'text-purple-600'}`}
          />
        ) : (
          <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {/* Collaborator name for user messages */}
        {isUser && hasCollaborator && (
          <div className="text-xs font-medium mb-1 text-blue-200">
            {message.collaboratorNickname}
          </div>
        )}
        {/* Coach name for assistant messages */}
        {!isUser && coachConfig && (
          <div
            className={`text-xs font-medium mb-1 ${coachConfig.color}`}
          >
            {coachConfig.nameCn}
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div className="flex items-center justify-between mt-1 gap-2">
          <div
            className={`text-xs ${
              isUser ? 'text-blue-200' : 'text-gray-400'
            }`}
          >
            {new Date(message.timestamp).toLocaleTimeString('zh-TW', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          {shouldShowRetryButton && (
            <button
              onClick={handleRetryRecording}
              disabled={isRetrying}
              className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${
                isRetrying
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 active:bg-blue-200'
              }`}
              title="將此訊息的內容記錄到專案中"
            >
              <Save className="w-3 h-3" />
              <span>{isRetrying ? '記錄中...' : '記錄'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
