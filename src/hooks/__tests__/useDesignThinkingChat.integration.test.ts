import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDesignThinkingChat } from '../useDesignThinkingChat';

/**
 * 完整流程整合測試
 * 模擬使用者從同理心階段 → 定義階段 → 發想階段 → 原型階段 → 測試階段
 */
describe('完整設計思考流程測試', () => {
  beforeEach(() => {
    // 清空 localStorage
    localStorage.clear();

    // Mock fetch API
    global.fetch = vi.fn();
  });

  it('應該能夠完成完整的設計思考流程（同理 → 定義 → 發想 → 原型 → 測試）', async () => {
    // ==================== 階段 1：同理心階段 ====================
    const { result } = renderHook(() => useDesignThinkingChat('流程測試專案'));

    // 等待初始化
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    // 驗證初始狀態
    expect(result.current.projectState.currentStage).toBe('empathize');
    expect(result.current.projectState.activeCoach).toBe('orchestrator'); // 初始教練是 orchestrator
    expect(result.current.projectState.observations).toHaveLength(0);

    // 切換到同理心教練開始流程
    await act(async () => {
      result.current.switchCoach('empathy');
    });

    expect(result.current.projectState.activeCoach).toBe('empathy');

    // 模擬第一個觀察
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(
                '很好的觀察！讓我記錄這個重要的痛點：\n\n' +
                '📌 **痛點**：年輕人覺得期貨很複雜，不知道從何開始學習\n\n' +
                '```json:action\n' +
                JSON.stringify({
                  type: 'ADD_OBSERVATION',
                  data: {
                    content: '年輕人覺得期貨很複雜，不知道從何開始學習',
                    category: 'pain_point',
                  },
                }) +
                '\n```'
              ),
            })
            .mockResolvedValueOnce({ done: true }),
        }),
      },
    });

    await act(async () => {
      await result.current.sendMessage('我觀察到年輕人覺得期貨很複雜');
    });

    await waitFor(() => {
      expect(result.current.projectState.observations).toHaveLength(1);
    });

    expect(result.current.projectState.observations[0].content).toContain('期貨很複雜');
    expect(result.current.projectState.observations[0].category).toBe('pain_point');

    // 模擬第二個觀察
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(
                '很棒的行為觀察！\n\n' +
                '👁️ **行為**：他們會先在社交媒體上尋找別人的經驗分享\n\n' +
                '```json:action\n' +
                JSON.stringify({
                  type: 'ADD_OBSERVATION',
                  data: {
                    content: '他們會先在社交媒體上尋找別人的經驗分享',
                    category: 'behavior',
                  },
                }) +
                '\n```'
              ),
            })
            .mockResolvedValueOnce({ done: true }),
        }),
      },
    });

    await act(async () => {
      await result.current.sendMessage('他們會先在社交媒體上尋找別人的經驗');
    });

    await waitFor(() => {
      expect(result.current.projectState.observations).toHaveLength(2);
    });

    // 模擬第三個觀察
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(
                '重要的需求洞察！\n\n' +
                '⚡ **需求**：年輕人希望有簡單易懂的入門教學\n\n' +
                '```json:action\n' +
                JSON.stringify({
                  type: 'ADD_OBSERVATION',
                  data: {
                    content: '年輕人希望有簡單易懂的入門教學',
                    category: 'need',
                  },
                }) +
                '\n```'
              ),
            })
            .mockResolvedValueOnce({ done: true }),
        }),
      },
    });

    await act(async () => {
      await result.current.sendMessage('他們希望有簡單易懂的入門教學');
    });

    await waitFor(() => {
      expect(result.current.projectState.observations).toHaveLength(3);
    });

    // 驗證階段完成度
    expect(result.current.stageCompletion.empathize).toBe(100);
    expect(result.current.canAdvance).toBe(true);

    // ==================== 階段 2：定義階段 ====================
    await act(async () => {
      result.current.advanceToNextStage();
    });

    expect(result.current.projectState.currentStage).toBe('define');
    expect(result.current.projectState.activeCoach).toBe('define');

    // 模擬建立 POV 陳述
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(
                '很好的 POV 陳述！\n\n' +
                '🎯 **POV**：年輕投資者需要簡化的期貨學習路徑，因為傳統教材過於複雜導致他們放棄學習\n\n' +
                '```json:action\n' +
                JSON.stringify({
                  type: 'ADD_POV',
                  data: {
                    user: '年輕投資者',
                    need: '簡化的期貨學習路徑',
                    insight: '傳統教材過於複雜導致他們放棄學習',
                    statement: '年輕投資者需要簡化的期貨學習路徑，因為傳統教材過於複雜導致他們放棄學習',
                  },
                }) +
                '\n```'
              ),
            })
            .mockResolvedValueOnce({ done: true }),
        }),
      },
    });

    await act(async () => {
      await result.current.sendMessage('年輕投資者需要簡化的期貨學習路徑，因為傳統教材過於複雜');
    });

    await waitFor(() => {
      expect(result.current.projectState.povStatements).toHaveLength(1);
    });

    expect(result.current.projectState.povStatements[0].statement).toContain('簡化的期貨學習路徑');
    expect(result.current.stageCompletion.define).toBe(100);

    // ==================== 階段 3：發想階段 ====================
    await act(async () => {
      result.current.advanceToNextStage();
    });

    expect(result.current.projectState.currentStage).toBe('ideate');
    expect(result.current.projectState.activeCoach).toBe('ideate');

    // 模擬添加 15 個點子
    for (let i = 1; i <= 15; i++) {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(
                  `很棒的點子 ${i}！\n\n` +
                  `💡 **點子 ${i}**：製作短影音教學系列\n\n` +
                  '```json:action\n' +
                  JSON.stringify({
                    type: 'ADD_IDEA',
                    data: {
                      title: `點子 ${i}：製作短影音教學系列`,
                      description: `利用短影音形式教學期貨知識 (點子 ${i})`,
                    },
                  }) +
                  '\n```'
                ),
              })
              .mockResolvedValueOnce({ done: true }),
          }),
        },
      });

      await act(async () => {
        await result.current.sendMessage(`點子 ${i}：製作短影音教學系列`);
      });
    }

    await waitFor(() => {
      expect(result.current.projectState.ideas).toHaveLength(15);
    });

    expect(result.current.stageCompletion.ideate).toBe(100);

    // ==================== 階段 4：原型階段 ====================
    await act(async () => {
      result.current.advanceToNextStage();
    });

    expect(result.current.projectState.currentStage).toBe('prototype');
    expect(result.current.projectState.activeCoach).toBe('prototype');

    // 模擬建立原型
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(
                '很好的低保真原型！\n\n' +
                '📦 **原型**：手繪線框圖：首頁包含 3 個 60 秒短影音，每個影音解釋一個核心概念\n\n' +
                '```json:action\n' +
                JSON.stringify({
                  type: 'ADD_PROTOTYPE',
                  data: {
                    name: '手繪線框圖：首頁包含 3 個 60 秒短影音',
                    description: '每個影音解釋一個核心概念',
                    type: 'low_fidelity',
                    features: ['60秒短影音', '核心概念解釋', '易於理解的視覺設計'],
                  },
                }) +
                '\n```'
              ),
            })
            .mockResolvedValueOnce({ done: true }),
        }),
      },
    });

    await act(async () => {
      await result.current.sendMessage('我畫了一個線框圖，首頁有 3 個短影音');
    });

    await waitFor(() => {
      expect(result.current.projectState.prototypes).toHaveLength(1);
    });

    expect(result.current.projectState.prototypes[0].name).toContain('短影音');
    expect(result.current.stageCompletion.prototype).toBe(100);

    // ==================== 階段 5：測試階段 ====================
    await act(async () => {
      result.current.advanceToNextStage();
    });

    expect(result.current.projectState.currentStage).toBe('test');
    expect(result.current.projectState.activeCoach).toBe('test');

    // 測試階段的功能還在開發中，這裡只驗證能夠成功進入測試階段
    console.log('✅ 成功進入測試階段');

    // ==================== 驗證完整流程 ====================
    // 驗證所有階段都已標記為已完成或進行中
    const stageProgress = result.current.projectState.stageProgress;
    expect(stageProgress.find((s) => s.stage === 'empathize')?.status).toBe('completed');
    expect(stageProgress.find((s) => s.stage === 'define')?.status).toBe('completed');
    expect(stageProgress.find((s) => s.stage === 'ideate')?.status).toBe('completed');
    expect(stageProgress.find((s) => s.stage === 'prototype')?.status).toBe('completed');
    expect(stageProgress.find((s) => s.stage === 'test')?.status).toBe('in_progress');

    // 驗證專案包含所有資料
    expect(result.current.projectState.observations.length).toBeGreaterThanOrEqual(3);
    expect(result.current.projectState.povStatements.length).toBeGreaterThanOrEqual(1);
    expect(result.current.projectState.ideas.length).toBeGreaterThanOrEqual(15);
    expect(result.current.projectState.prototypes.length).toBeGreaterThanOrEqual(1);

    // 驗證專案名稱
    expect(result.current.projectState.name).toBe('流程測試專案');

    // 驗證聊天歷史（應該包含所有對話）
    const chatHistory = result.current.projectState.chatHistory;
    expect(chatHistory.length).toBeGreaterThan(0);
    expect(chatHistory.filter((m) => m.role === 'user').length).toBeGreaterThan(0);
    expect(chatHistory.filter((m) => m.role === 'assistant').length).toBeGreaterThan(0);

    console.log('✅ 完整設計思考流程測試通過！');
    console.log(`📊 總共完成 ${chatHistory.length} 次對話`);
    console.log(`📋 收集 ${result.current.projectState.observations.length} 個觀察`);
    console.log(`🎯 建立 ${result.current.projectState.povStatements.length} 個 POV`);
    console.log(`💡 產生 ${result.current.projectState.ideas.length} 個點子`);
    console.log(`📦 建立 ${result.current.projectState.prototypes.length} 個原型`);
  });

  it('應該能夠在任何階段中途停止並儲存進度', async () => {
    const { result } = renderHook(() => useDesignThinkingChat('中途儲存測試'));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    // 添加一個觀察
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(
                '📌 **痛點**：測試觀察\n\n' +
                '```json:action\n' +
                JSON.stringify({
                  type: 'ADD_OBSERVATION',
                  data: { content: '測試觀察', category: 'pain_point' },
                }) +
                '\n```'
              ),
            })
            .mockResolvedValueOnce({ done: true }),
        }),
      },
    });

    await act(async () => {
      await result.current.sendMessage('測試觀察');
    });

    await waitFor(() => {
      expect(result.current.projectState.observations).toHaveLength(1);
    });

    // 等待自動儲存
    await new Promise((resolve) => setTimeout(resolve, 600));

    // 模擬重新載入（新的 hook 實例）
    const { result: reloadedResult } = renderHook(() =>
      useDesignThinkingChat('中途儲存測試')
    );

    await waitFor(() => {
      expect(reloadedResult.current.isInitialized).toBe(true);
    });

    // 驗證資料已儲存
    expect(reloadedResult.current.projectState.observations).toHaveLength(1);
    expect(reloadedResult.current.projectState.observations[0].content).toBe('測試觀察');
  });

  it('應該能夠處理錯誤並保持專案狀態穩定', async () => {
    const { result } = renderHook(() => useDesignThinkingChat('錯誤處理測試'));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    // 模擬 API 錯誤
    (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

    await act(async () => {
      await result.current.sendMessage('這會導致錯誤');
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    // 驗證專案狀態沒有損壞
    expect(result.current.projectState.currentStage).toBe('empathize');
    expect(result.current.projectState.observations).toHaveLength(0);

    // 驗證可以從錯誤中恢復
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('恢復正常'),
            })
            .mockResolvedValueOnce({ done: true }),
        }),
      },
    });

    await act(async () => {
      await result.current.sendMessage('重試');
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
});
