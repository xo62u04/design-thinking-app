'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface CreateSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSurvey: (surveyData: {
    question: string;
    type: 'text' | 'multiple_choice' | 'rating' | 'open_ended';
    options?: string[];
  }) => void;
}

const surveyTypeOptions = [
  { value: 'text', label: '簡答題', description: '簡短文字回答' },
  { value: 'multiple_choice', label: '多選題', description: '單選選項' },
  { value: 'rating', label: '評分題', description: '1-5 星評分' },
  { value: 'open_ended', label: '開放題', description: '詳細文字回答' },
] as const;

export default function CreateSurveyModal({
  isOpen,
  onClose,
  onCreateSurvey,
}: CreateSurveyModalProps) {
  const [question, setQuestion] = useState('');
  const [type, setType] = useState<'text' | 'multiple_choice' | 'rating' | 'open_ended'>('text');
  const [options, setOptions] = useState<string[]>(['', '']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      alert('請輸入問題');
      return;
    }

    if (type === 'multiple_choice') {
      const validOptions = options.filter((opt) => opt.trim());
      if (validOptions.length < 2) {
        alert('多選題至少需要 2 個選項');
        return;
      }
      onCreateSurvey({
        question: question.trim(),
        type,
        options: validOptions,
      });
    } else {
      onCreateSurvey({
        question: question.trim(),
        type,
      });
    }

    // 重置表單
    setQuestion('');
    setType('text');
    setOptions(['', '']);
    onClose();
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-800">建立新問卷</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 問題 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              問題 *
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="輸入您的問題..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* 問卷類型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              問卷類型 *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {surveyTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                    type === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 hover:border-indigo-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={option.value}
                    checked={type === option.value}
                    onChange={(e) =>
                      setType(
                        e.target.value as 'text' | 'multiple_choice' | 'rating' | 'open_ended'
                      )
                    }
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-800">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 多選題選項 */}
          {type === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選項 *（至少 2 個）
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`選項 ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加選項
                </button>
              </div>
            </div>
          )}

          {/* 提示訊息 */}
          {type === 'rating' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                評分題將顯示 1-5 顆星供用戶選擇，並自動計算平均分。
              </p>
            </div>
          )}

          {/* 按鈕 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md font-medium transition-colors"
            >
              建立問卷
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
