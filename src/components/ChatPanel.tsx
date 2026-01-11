'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, CoachType } from '@/types/design-thinking';
import { COACH_CONFIG } from '@/constants/prompts';
import MessageItem from './MessageItem';
import {
  Send,
  Brain,
  Heart,
  Target,
  Lightbulb,
  Box,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

const iconMap = {
  Brain,
  Heart,
  Target,
  Lightbulb,
  Box,
  FlaskConical,
};

interface ChatPanelProps {
  messages: ChatMessage[];
  activeCoach: CoachType;
  onSendMessage: (content: string) => void;
  onCoachChange: (coach: CoachType) => void;
  onRetryRecording?: (messageContent: string) => void;
  isLoading?: boolean;
  showCollaborators?: boolean;
}

export default function ChatPanel({
  messages,
  activeCoach,
  onSendMessage,
  onCoachChange,
  onRetryRecording,
  isLoading = false,
  showCollaborators = false,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const coachScrollRef = useRef<HTMLDivElement>(null);
  const currentCoach = COACH_CONFIG[activeCoach];
  const IconComponent = iconMap[currentCoach.icon as keyof typeof iconMap];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleAskForHint = () => {
    if (!isLoading) {
      onSendMessage('請給我一些提示，我不太確定接下來該怎麼做。');
    }
  };

  const scrollCoaches = (direction: 'left' | 'right') => {
    if (coachScrollRef.current) {
      const scrollAmount = 150;
      coachScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const coachTypes: CoachType[] = [
    'orchestrator',
    'empathy',
    'define',
    'ideate',
    'prototype',
    'test',
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border-b bg-gray-50">
        {/* Current Coach Info */}
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg ${currentCoach.bgColor}`}>
            {IconComponent && (
              <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${currentCoach.color}`} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
              {currentCoach.nameCn}
            </h2>
            <p className="text-xs text-gray-500 truncate">{currentCoach.description}</p>
          </div>
        </div>

        {/* Coach Selector with scroll buttons */}
        <div className="relative flex items-center">
          {/* Left scroll button - only show on larger screens */}
          <button
            onClick={() => scrollCoaches('left')}
            className="hidden sm:flex flex-shrink-0 w-6 h-6 items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full mr-1"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable coach buttons */}
          <div
            ref={coachScrollRef}
            className="flex-1 flex gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {coachTypes.map((type) => {
              const config = COACH_CONFIG[type];
              const Icon = iconMap[config.icon as keyof typeof iconMap];
              return (
                <button
                  key={type}
                  onClick={() => onCoachChange(type)}
                  className={`flex-shrink-0 flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                    activeCoach === type
                      ? `${config.bgColor} ${config.color} font-medium ring-2 ring-offset-1 ${config.color.replace('text', 'ring')}`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  <span className="hidden xs:inline sm:inline">{config.nameCn}</span>
                </button>
              );
            })}
          </div>

          {/* Right scroll button - only show on larger screens */}
          <button
            onClick={() => scrollCoaches('right')}
            className="hidden sm:flex flex-shrink-0 w-6 h-6 items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full ml-1"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Brain className="w-10 h-10 sm:w-12 sm:h-12 mb-2" />
            <p className="text-sm text-center">開始與教練對話吧！</p>
            <p className="text-xs text-gray-300 mt-1">選擇一位教練，描述你的專案</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                showCollaborator={showCollaborators}
                onRetryRecording={onRetryRecording}
                isRetrying={isLoading}
              />
            ))}
            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-2 sm:gap-3">
                <div
                  className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${currentCoach.bgColor}`}
                >
                  {IconComponent && (
                    <IconComponent
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${currentCoach.color}`}
                    />
                  )}
                </div>
                <div className="bg-gray-100 rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 p-2 sm:p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? '教練思考中...' : '輸入訊息...'}
            disabled={isLoading}
            className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {/* Ask for hint button */}
          <button
            type="button"
            onClick={handleAskForHint}
            disabled={isLoading}
            className="flex-shrink-0 w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
            title="向教練請求提示"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">提問</span>
          </button>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
