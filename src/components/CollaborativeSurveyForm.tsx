'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getSurvey,
  getSurveyResponses,
  addSurveyResponse,
  updateSurvey,
} from '@/lib/supabase/queries';
import { getSupabase } from '@/lib/supabase/client';
import {
  Loader2,
  Users,
  Send,
  Star,
  MessageSquare,
  CheckSquare,
  BarChart3,
  Edit2,
  Save,
  X,
} from 'lucide-react';

interface CollaborativeSurveyFormProps {
  surveyId: string;
  collaboratorId: string;
  nickname: string;
  color: string;
}

interface SurveyData {
  id: string;
  project_id: string;
  question: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'open_ended';
  options: string[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface SurveyResponseData {
  id: string;
  survey_id: string;
  respondent_name: string;
  response: string;
  created_at: string;
  created_by: string | null;
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

export default function CollaborativeSurveyForm({
  surveyId,
  collaboratorId,
  nickname,
  color,
}: CollaborativeSurveyFormProps) {
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [responses, setResponses] = useState<SurveyResponseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number>(1);
  const [myResponse, setMyResponse] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState('');
  const [editOptions, setEditOptions] = useState<string[]>([]);

  // 載入問卷資料
  useEffect(() => {
    loadSurvey();
    loadResponses();
  }, [surveyId]);

  async function loadSurvey() {
    try {
      const data = await getSurvey(surveyId);
      setSurvey(data);
      setEditQuestion(data.question);
      setEditOptions(data.options || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load survey:', error);
      setIsLoading(false);
    }
  }

  async function loadResponses() {
    try {
      const data = await getSurveyResponses(surveyId);
      setResponses(data);
    } catch (error) {
      console.error('Failed to load responses:', error);
    }
  }

  // Realtime 訂閱
  useEffect(() => {
    if (!surveyId) return;

    const supabase = getSupabase();

    // 訂閱問卷回答更新
    const responseChannel = supabase
      .channel(`survey_responses:${surveyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'survey_responses',
          filter: `survey_id=eq.${surveyId}`,
        },
        (payload) => {
          const newResponse = payload.new as SurveyResponseData;
          setResponses((prev) => [...prev, newResponse]);
        }
      )
      .subscribe();

    // 訂閱問卷更新（編輯問題）
    const surveyChannel = supabase
      .channel(`survey:${surveyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'surveys',
          filter: `id=eq.${surveyId}`,
        },
        (payload) => {
          const updatedSurvey = payload.new as SurveyData;
          setSurvey(updatedSurvey);
          setEditQuestion(updatedSurvey.question);
          setEditOptions(updatedSurvey.options || []);
        }
      )
      .subscribe();

    // Presence tracking（線上用戶數）
    const presenceChannel = supabase.channel(`survey:${surveyId}:presence`, {
      config: {
        presence: {
          key: collaboratorId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setOnlineUsers(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: collaboratorId,
            nickname,
            color,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      responseChannel.unsubscribe();
      surveyChannel.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, [surveyId, collaboratorId, nickname, color]);

  // 提交回答
  const handleSubmit = async () => {
    if (!survey) return;

    let responseValue = '';
    if (survey.type === 'rating') {
      if (rating === 0) {
        alert('請選擇評分');
        return;
      }
      responseValue = rating.toString();
    } else {
      if (!myResponse.trim()) {
        alert('請輸入回答');
        return;
      }
      responseValue = myResponse.trim();
    }

    setIsSubmitting(true);
    try {
      await addSurveyResponse(surveyId, collaboratorId, {
        respondentName: nickname,
        response: responseValue,
      });
      setMyResponse('');
      setRating(0);
      alert('回答已提交！');
    } catch (error) {
      console.error('Failed to submit response:', error);
      alert('提交失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 保存問卷編輯
  const handleSaveEdit = async () => {
    if (!editQuestion.trim()) {
      alert('問題不能為空');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSurvey(surveyId, {
        question: editQuestion,
        options: survey?.type === 'multiple_choice' ? editOptions : undefined,
      });
      setIsEditing(false);
      alert('問卷已更新！');
    } catch (error) {
      console.error('Failed to update survey:', error);
      alert('更新失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !survey) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const TypeIcon = surveyTypeIcons[survey.type];
  const isCreator = survey.created_by === collaboratorId;

  // 計算統計數據
  const responseCounts: Record<string, number> = {};
  if (survey.type === 'multiple_choice') {
    survey.options.forEach((opt) => {
      responseCounts[opt] = responses.filter((r) => r.response === opt).length;
    });
  }

  const avgRating =
    survey.type === 'rating' && responses.length > 0
      ? responses.reduce((sum, r) => sum + Number(r.response), 0) / responses.length
      : 0;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <TypeIcon className="w-5 h-5 text-indigo-600" />
            <span className="text-sm px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
              {surveyTypeNames[survey.type]}
            </span>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
              className="w-full text-lg font-semibold text-gray-800 border-b-2 border-indigo-500 focus:outline-none"
            />
          ) : (
            <h1 className="text-lg font-semibold text-gray-800">{survey.question}</h1>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* 編輯按鈕 */}
          {isCreator && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              編輯
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                儲存
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditQuestion(survey.question);
                  setEditOptions(survey.options || []);
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
                取消
              </button>
            </>
          )}

          {/* 線上用戶數 */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm">
            <Users className="w-4 h-4" />
            {onlineUsers} 人在線
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* 回答表單 */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-800 mb-4">填寫回答</h2>

            {/* 簡答題 */}
            {survey.type === 'text' && (
              <input
                type="text"
                value={myResponse}
                onChange={(e) => setMyResponse(e.target.value)}
                placeholder="輸入您的回答..."
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}

            {/* 多選題 */}
            {survey.type === 'multiple_choice' && (
              <div className="space-y-2">
                {isEditing ? (
                  <div className="space-y-2">
                    {editOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...editOptions];
                            newOptions[idx] = e.target.value;
                            setEditOptions(newOptions);
                          }}
                          className="flex-1 px-3 py-2 border rounded-md"
                        />
                        <button
                          onClick={() => {
                            setEditOptions(editOptions.filter((_, i) => i !== idx));
                          }}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setEditOptions([...editOptions, ''])}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      + 添加選項
                    </button>
                  </div>
                ) : (
                  survey.options.map((option, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="survey-option"
                        value={option}
                        checked={myResponse === option}
                        onChange={(e) => setMyResponse(e.target.value)}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))
                )}
              </div>
            )}

            {/* 評分題 */}
            {survey.type === 'rating' && (
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-gray-600">
                    {rating} / 5
                  </span>
                )}
              </div>
            )}

            {/* 開放題 */}
            {survey.type === 'open_ended' && (
              <textarea
                value={myResponse}
                onChange={(e) => setMyResponse(e.target.value)}
                placeholder="輸入您的詳細回答..."
                rows={4}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}

            {!isEditing && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    提交回答
                  </>
                )}
              </button>
            )}
          </div>

          {/* 回答統計 */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              回答統計 ({responses.length} 份)
            </h2>

            {/* 多選題統計 */}
            {survey.type === 'multiple_choice' && (
              <div className="space-y-3">
                {survey.options.map((option, idx) => {
                  const count = responseCounts[option] || 0;
                  const percentage =
                    responses.length > 0 ? Math.round((count / responses.length) * 100) : 0;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-700">{option}</span>
                        <span className="text-sm text-gray-500">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 評分題統計 */}
            {survey.type === 'rating' && responses.length > 0 && (
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">
                  {avgRating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= avgRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-500">平均評分</p>
              </div>
            )}

            {/* 文字/開放題回答列表 */}
            {(survey.type === 'text' || survey.type === 'open_ended') && (
              <div className="space-y-3">
                {responses.map((response) => (
                  <div
                    key={response.id}
                    className="p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {response.respondent_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(response.created_at).toLocaleString('zh-TW')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{response.response}</p>
                  </div>
                ))}
                {responses.length === 0 && (
                  <p className="text-center text-gray-400 py-4">尚無回答</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
