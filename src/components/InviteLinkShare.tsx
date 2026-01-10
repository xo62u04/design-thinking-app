'use client';

import { useState } from 'react';
import { Link2, Copy, Check, Share2 } from 'lucide-react';

interface InviteLinkShareProps {
  inviteCode: string;
}

export default function InviteLinkShare({ inviteCode }: InviteLinkShareProps) {
  const [copied, setCopied] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/project/${inviteCode}`
    : `/project/${inviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Design Thinking 協作專案',
          text: '邀請你加入 Design Thinking 協作專案',
          url: inviteUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== 'AbortError') {
          setShowPopup(true);
        }
      }
    } else {
      setShowPopup(true);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        title="邀請協作者"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">邀請</span>
      </button>

      {/* Share Popup */}
      {showPopup && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPopup(false)}
          />

          {/* Popup */}
          <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-4 h-4 text-blue-600" />
              <h3 className="font-medium text-gray-800">分享邀請連結</h3>
            </div>

            <p className="text-xs text-gray-500 mb-3">
              任何人都可以透過這個連結加入專案
            </p>

            {/* Link display */}
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 truncate">
                {inviteUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-600'
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
                title={copied ? '已複製' : '複製連結'}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {copied && (
              <p className="mt-2 text-xs text-green-600 text-center">
                連結已複製到剪貼簿
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
