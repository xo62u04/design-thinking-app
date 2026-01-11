import { describe, it, expect } from 'vitest';
import {
  COACH_PROMPTS,
  COACH_CONFIG,
  STAGE_TO_COACH,
  EMPATHY_COACH_PROMPT,
  IDEATE_COACH_PROMPT,
} from '../prompts';
import type { CoachType } from '@/types/design-thinking';

describe('教練提示詞配置', () => {
  it('所有教練都應有對應的 prompt', () => {
    const coachTypes: CoachType[] = [
      'orchestrator',
      'empathy',
      'define',
      'ideate',
      'prototype',
      'test',
    ];

    coachTypes.forEach((type) => {
      expect(COACH_PROMPTS[type]).toBeDefined();
      expect(COACH_PROMPTS[type].length).toBeGreaterThan(0);
    });
  });

  it('所有教練都應有完整的配置資訊', () => {
    const coachTypes: CoachType[] = [
      'orchestrator',
      'empathy',
      'define',
      'ideate',
      'prototype',
      'test',
    ];

    coachTypes.forEach((type) => {
      const config = COACH_CONFIG[type];

      expect(config).toBeDefined();
      expect(config.name).toBeDefined();
      expect(config.nameCn).toBeDefined();
      expect(config.description).toBeDefined();
      expect(config.icon).toBeDefined();
      expect(config.color).toBeDefined();
      expect(config.bgColor).toBeDefined();
    });
  });

  it('STAGE_TO_COACH 映射應正確', () => {
    expect(STAGE_TO_COACH.empathize).toBe('empathy');
    expect(STAGE_TO_COACH.define).toBe('define');
    expect(STAGE_TO_COACH.ideate).toBe('ideate');
    expect(STAGE_TO_COACH.prototype).toBe('prototype');
    expect(STAGE_TO_COACH.test).toBe('test');
  });
});

describe('提示詞一致性檢查', () => {
  it('所有教練提示詞都應包含 JSON action 格式說明或相關指引', () => {
    // orchestrator 可能沒有 JSON action 格式，因為它主要是檢查
    const coachTypesWithJSONAction: CoachType[] = [
      'empathy',
      'define',
      'ideate',
      'prototype',
    ];

    coachTypesWithJSONAction.forEach((type) => {
      const prompt = COACH_PROMPTS[type];

      // 至少應該提到如何記錄或輸出
      expect(
        prompt.includes('json:action') ||
        prompt.includes('JSON') ||
        prompt.includes('對話內容')
      ).toBe(true);
    });
  });

  it('同理心教練應強調不要在 3 個觀察後停止記錄', () => {
    expect(EMPATHY_COACH_PROMPT).toContain('即使已經達到 3 個觀察');
    expect(EMPATHY_COACH_PROMPT).toContain('仍然要繼續記錄');
  });

  it('同理心教練應禁止只輸出對話內容或只輸出 JSON', () => {
    const prompt = EMPATHY_COACH_PROMPT;

    expect(
      prompt.includes('只輸出') ||
      prompt.includes('缺一不可') ||
      prompt.includes('同時完成兩件事')
    ).toBe(true);
  });

  it('發想教練應提到極端限制來刺激創意', () => {
    expect(IDEATE_COACH_PROMPT).toContain('極端限制');
    expect(
      IDEATE_COACH_PROMPT.includes('1 元') || IDEATE_COACH_PROMPT.includes('1 分鐘')
    ).toBe(true);
  });

  it('所有教練都應使用繁體中文', () => {
    Object.entries(COACH_PROMPTS).forEach(([type, prompt]) => {
      // 檢查是否包含常見的簡體字
      const hasSimplifiedChinese = /[观点这样将时间问题须]/.test(prompt);

      expect(hasSimplifiedChinese).toBe(false);
    });
  });

  it('所有教練配置都應使用繁體中文', () => {
    Object.entries(COACH_CONFIG).forEach(([type, config]) => {
      // 檢查名稱和描述
      const hasSimplifiedChinese =
        /[观点这样将时间问题须]/.test(config.nameCn) ||
        /[观点这样将时间问题须]/.test(config.description);

      expect(hasSimplifiedChinese).toBe(false);
    });
  });
});

describe('提示詞長度檢查', () => {
  it('提示詞應有足夠的長度以提供清晰指引', () => {
    Object.entries(COACH_PROMPTS).forEach(([type, prompt]) => {
      // 至少應該有 50 個字元
      expect(prompt.length).toBeGreaterThan(50);
    });
  });

  it('提示詞不應過長以避免 token 浪費', () => {
    Object.entries(COACH_PROMPTS).forEach(([type, prompt]) => {
      // 不應超過 2000 個字元
      expect(prompt.length).toBeLessThan(2000);
    });
  });
});

describe('提示詞關鍵字檢查', () => {
  it('同理心教練應提到 5 Whys 技巧', () => {
    expect(EMPATHY_COACH_PROMPT).toContain('5 Whys');
  });

  it('定義教練應提到 POV 公式', () => {
    const prompt = COACH_PROMPTS.define;
    expect(prompt).toContain('POV');
  });

  it('發想教練應提到 HMW 問題', () => {
    expect(IDEATE_COACH_PROMPT).toContain('HMW');
  });

  it('原型教練應強調快速和低保真', () => {
    const prompt = COACH_PROMPTS.prototype;
    expect(
      prompt.includes('快速') ||
      prompt.includes('10 分鐘') ||
      prompt.includes('手繪') ||
      prompt.includes('草圖')
    ).toBe(true);
  });

  it('測試教練應強調觀察而非解釋', () => {
    const prompt = COACH_PROMPTS.test;
    expect(
      prompt.includes('觀察') &&
      (prompt.includes('嚴禁解釋') || prompt.includes('不解釋'))
    ).toBe(true);
  });
});
