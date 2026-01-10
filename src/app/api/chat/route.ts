import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, LanguageModel } from 'ai';
import { COACH_PROMPTS } from '@/constants/prompts';
import { CoachType, ProjectState } from '@/types/design-thinking';

export const maxDuration = 30;

// 取得模型配置
function getModel(): LanguageModel {
  const provider = process.env.AI_PROVIDER || 'openai';
  const modelName = process.env.AI_MODEL;

  if (provider === 'anthropic') {
    return anthropic(modelName || 'claude-sonnet-4-20250514');
  }

  // 預設使用 OpenAI
  return openai(modelName || 'gpt-4o');
}

export async function POST(req: Request) {
  const { messages, projectState }: {
    messages: { role: 'user' | 'assistant'; content: string }[];
    projectState: ProjectState;
  } = await req.json();

  // 根據當前活躍教練取得對應的 System Prompt
  const activeCoach = projectState.activeCoach as CoachType;
  const basePrompt = COACH_PROMPTS[activeCoach];

  // 建構完整的 System Prompt，包含專案狀態上下文
  const systemPrompt = buildSystemPrompt(basePrompt, projectState);

  const result = streamText({
    model: getModel(),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}

function buildSystemPrompt(basePrompt: string, projectState: ProjectState): string {
  const { currentStage, observations, povStatements, ideas, prototypes } = projectState;

  // 根據不同階段，提供不同的上下文資訊
  let contextInfo = `
## 當前專案狀態
- 專案名稱：${projectState.name}
- 當前階段：${currentStage}
`;

  // 同理心階段：顯示已收集的觀察
  if (observations.length > 0) {
    contextInfo += `
## 已收集的使用者觀察 (${observations.length} 筆)
${observations.map((obs, i) => `${i + 1}. [${obs.category}] ${obs.content}`).join('\n')}
`;
  }

  // 定義階段：顯示 POV 陳述
  if (povStatements.length > 0) {
    contextInfo += `
## 已定義的 POV 陳述 (${povStatements.length} 筆)
${povStatements.map((pov, i) => `${i + 1}. ${pov.statement}`).join('\n')}
`;
  }

  // 發想階段：顯示點子清單
  if (ideas.length > 0) {
    contextInfo += `
## 已產生的點子 (${ideas.length} 個)
${ideas.map((idea, i) => `${i + 1}. ${idea.title}: ${idea.description}`).join('\n')}
`;
  }

  // 原型/測試階段：顯示原型資訊
  if (prototypes.length > 0) {
    contextInfo += `
## 已建立的原型 (${prototypes.length} 個)
${prototypes.map((proto, i) => `${i + 1}. ${proto.name}: ${proto.description}`).join('\n')}
`;
  }

  // 階段特定指引
  const stageGuidelines = getStageGuidelines(currentStage, projectState);

  return `${basePrompt}

${contextInfo}

${stageGuidelines}

## 回應格式指引
當學員提供了可以被記錄的內容時，請在回應最後使用 JSON 格式標記需要儲存的資料：
\`\`\`json:action
{
  "type": "ADD_OBSERVATION" | "ADD_POV" | "ADD_IDEA" | "ADD_PROTOTYPE" | "NEXT_STAGE",
  "data": { ... }
}
\`\`\`

例如，當學員分享了一個使用者痛點：
\`\`\`json:action
{
  "type": "ADD_OBSERVATION",
  "data": {
    "content": "使用者在結帳時常常找不到優惠券入口",
    "category": "pain_point"
  }
}
\`\`\`

當學員完成 POV 陳述：
\`\`\`json:action
{
  "type": "ADD_POV",
  "data": {
    "user": "忙碌的上班族",
    "need": "快速找到優惠",
    "insight": "他們認為省時比省錢更重要",
    "statement": "忙碌的上班族需要快速找到優惠，因為他們認為省時比省錢更重要"
  }
}
\`\`\`
`;
}

function getStageGuidelines(stage: string, projectState: ProjectState): string {
  const { observations, povStatements, ideas } = projectState;

  switch (stage) {
    case 'empathize':
      const remainingObservations = Math.max(0, 3 - observations.length);
      return `
## 同理心階段指引
- 目標：收集至少 3 個關鍵洞察
- 目前進度：已收集 ${observations.length} 個，還需 ${remainingObservations} 個
- 使用 5 Whys 技巧深入挖掘
- 當收集到 3 個以上洞察時，可以建議進入下一階段
${observations.length >= 3 ? '✅ 已達成最低目標，可以考慮進入定義階段' : ''}`;

    case 'define':
      return `
## 定義階段指引
- 目標：建立清晰的 POV 陳述
- POV 公式：[使用者] 需要 [需求]，因為 [驚人洞察]
- 確保 POV 來自同理心階段的發現
- 目前已有 ${povStatements.length} 個 POV 陳述
${povStatements.length >= 1 ? '✅ 已建立 POV，可以考慮進入發想階段' : ''}`;

    case 'ideate':
      const remainingIdeas = Math.max(0, 15 - ideas.length);
      return `
## 發想階段指引
- 目標：產生至少 15 個點子
- 目前進度：已有 ${ideas.length} 個點子，還需 ${remainingIdeas} 個
- 將 POV 轉化為 HMW (How Might We) 問題
${ideas.length < 15 ? '- 使用極端限制來刺激創意（如：預算只有 1 元？只有 1 分鐘？）' : ''}
${ideas.length >= 15 ? '✅ 已達成點子目標，可以考慮進入原型階段' : ''}`;

    case 'prototype':
      return `
## 原型階段指引
- 目標：快速建立可測試的原型
- 阻止完美主義！10 分鐘內完成草圖
- 聚焦於核心假設的驗證
- 鼓勵使用手繪、紙原型、或簡單工具`;

    case 'test':
      return `
## 測試階段指引
- 目標：收集真實用戶回饋
- 嚴禁解釋產品，只能觀察和記錄
- 特別注意沈默和挫折的時刻
- 根據回饋決定是否需要迭代`;

    default:
      return '';
  }
}
