'use client';

import { useState } from 'react';
import { Collaborator } from '@/types/design-thinking';
import { Users } from 'lucide-react';

interface CollaboratorAvatarsProps {
  collaborators: Collaborator[];
  currentUserId?: string;
  maxVisible?: number;
  size?: 'sm' | 'md';
}

export default function CollaboratorAvatars({
  collaborators,
  currentUserId,
  maxVisible = 4,
  size = 'md',
}: CollaboratorAvatarsProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // 排序：在線優先，自己優先
  const sortedCollaborators = [...collaborators].sort((a, b) => {
    // 自己永遠在最前面
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    // 在線的排前面
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return 0;
  });

  const visibleCollaborators = sortedCollaborators.slice(0, maxVisible);
  const hiddenCount = sortedCollaborators.length - maxVisible;
  const onlineCount = collaborators.filter((c) => c.isOnline).length;

  const sizeClasses = size === 'sm'
    ? 'w-6 h-6 text-[10px]'
    : 'w-7 h-7 sm:w-8 sm:h-8 text-xs';

  const ringSize = size === 'sm' ? 'ring-1' : 'ring-2';

  if (collaborators.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Avatar Stack */}
      <div className="flex -space-x-2 relative">
        {visibleCollaborators.map((collaborator) => (
          <div
            key={collaborator.id}
            className="relative"
            onMouseEnter={() => setShowTooltip(collaborator.id)}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <div
              className={`${sizeClasses} rounded-full ${ringSize} ring-white flex items-center justify-center text-white font-medium cursor-default transition-transform hover:scale-110 hover:z-10`}
              style={{ backgroundColor: collaborator.color }}
            >
              {collaborator.nickname.charAt(0).toUpperCase()}
            </div>

            {/* Online indicator */}
            {collaborator.isOnline && (
              <span className={`absolute -bottom-0.5 -right-0.5 block ${size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'} bg-green-500 rounded-full ring-2 ring-white`} />
            )}

            {/* Tooltip */}
            {showTooltip === collaborator.id && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 animate-in fade-in duration-150">
                {collaborator.nickname}
                {collaborator.id === currentUserId && ' (你)'}
                {!collaborator.isOnline && ' (離線)'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        ))}

        {/* Hidden count */}
        {hiddenCount > 0 && (
          <div
            className={`${sizeClasses} rounded-full ${ringSize} ring-white bg-gray-500 flex items-center justify-center text-white font-medium`}
          >
            +{hiddenCount}
          </div>
        )}
      </div>

      {/* Online count badge */}
      <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
        <span className="w-2 h-2 bg-green-500 rounded-full" />
        <span>{onlineCount} 在線</span>
      </div>
    </div>
  );
}
