'use client';

import { useState, useRef, useEffect } from 'react';
import { ProjectSummary, getTimeAgo } from '@/lib/storage';
import {
  ChevronDown,
  FolderOpen,
  Clock,
  MessageSquare,
  Trash2,
  Check,
} from 'lucide-react';

interface ProjectSelectorProps {
  currentProjectId: string;
  projects: ProjectSummary[];
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

const stageLabels: Record<string, string> = {
  empathize: '同理心',
  define: '定義',
  ideate: '發想',
  prototype: '原型',
  test: '測試',
};

export default function ProjectSelector({
  currentProjectId,
  projects,
  onSelectProject,
  onDeleteProject,
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setDeleteConfirm(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (deleteConfirm === projectId) {
      onDeleteProject(projectId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(projectId);
    }
  };

  if (projects.length <= 1) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        title="切換專案"
      >
        <FolderOpen className="w-4 h-4" />
        <span className="hidden sm:inline">專案</span>
        <span className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
          {projects.length}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-72 sm:w-80 bg-white rounded-xl shadow-lg border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 bg-gray-50 border-b">
            <p className="text-xs font-medium text-gray-500">切換專案</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => {
                  if (project.id !== currentProjectId) {
                    onSelectProject(project.id);
                    setIsOpen(false);
                  }
                }}
                className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                  project.id === currentProjectId
                    ? 'bg-blue-50 border-l-2 border-blue-500'
                    : 'hover:bg-gray-50 border-l-2 border-transparent'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium truncate text-sm ${
                      project.id === currentProjectId ? 'text-blue-700' : 'text-gray-800'
                    }`}>
                      {project.name}
                    </p>
                    {project.id === currentProjectId && (
                      <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                      {stageLabels[project.currentStage] || project.currentStage}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {getTimeAgo(project.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-0.5">
                      <MessageSquare className="w-3 h-3" />
                      {project.messagesCount} 則對話
                    </span>
                    {project.observationsCount > 0 && (
                      <span>{project.observationsCount} 觀察</span>
                    )}
                    {project.ideasCount > 0 && (
                      <span>{project.ideasCount} 點子</span>
                    )}
                  </div>
                </div>
                {project.id !== currentProjectId && (
                  <button
                    onClick={(e) => handleDelete(e, project.id)}
                    className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                      deleteConfirm === project.id
                        ? 'bg-red-100 text-red-600'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                    title={deleteConfirm === project.id ? '再按一次確認刪除' : '刪除專案'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
