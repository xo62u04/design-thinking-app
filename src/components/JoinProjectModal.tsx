'use client';

import { useState } from 'react';
import { Users, ArrowRight, Loader2 } from 'lucide-react';

interface JoinProjectModalProps {
  projectName: string;
  onJoin: (nickname: string) => Promise<void>;
  error?: string | null;
}

export default function JoinProjectModal({
  projectName,
  onJoin,
  error,
}: JoinProjectModalProps) {
  const [nickname, setNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setLocalError('請輸入暱稱');
      return;
    }
    if (trimmedNickname.length > 20) {
      setLocalError('暱稱最多 20 個字');
      return;
    }

    setIsJoining(true);
    setLocalError(null);

    try {
      await onJoin(trimmedNickname);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : '加入失敗');
    } finally {
      setIsJoining(false);
    }
  };

  const displayError = error || localError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">加入協作專案</h2>
              <p className="text-sm text-white/80 truncate">{projectName}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              你的暱稱
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="輸入你的名字或暱稱"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400"
              autoFocus
              disabled={isJoining}
              maxLength={20}
            />
            <p className="mt-1 text-xs text-gray-500">
              其他協作者會看到這個名字
            </p>
          </div>

          {displayError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={isJoining || !nickname.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                加入中...
              </>
            ) : (
              <>
                加入專案
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer hint */}
        <div className="px-6 pb-4">
          <p className="text-xs text-center text-gray-400">
            加入後你可以即時看到其他人的貢獻，也能一起討論
          </p>
        </div>
      </div>
    </div>
  );
}
