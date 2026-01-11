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

## 🚨 回應格式規則（必須遵守）

### ⚠️ 核心原則：記錄觀察時，對話內容和 JSON action 兩者缺一不可！

### 規則 1：絕對禁止只輸出 JSON
❌ 錯誤示範 A（會導致用戶看到空白）：
讓我將這個洞察記錄下來：
\`\`\`json:action
{"type": "ADD_OBSERVATION", "data": {...}}
\`\`\`

### 規則 2：絕對禁止只輸出對話內容而不輸出 JSON
❌ 錯誤示範 B（會導致無法儲存）：
很好的觀察！我已經記錄了這個重要發現：
📌 **需求**：年輕人希望有線上學習平台...
如果你有更多的觀察或想法，隨時分享！

（缺少 JSON action，系統無法儲存！）

### 規則 3：正確的回應格式（兩部分都必須有）
當你需要記錄觀察、POV、點子時，你的回應**必須同時包含兩部分**：

**第一部分：對話內容（讓用戶看到記錄了什麼）**
使用表情符號和清晰的格式，把記錄的內容完整寫出來給用戶看。

**第二部分：JSON action（讓系統儲存資料）**
放在對話內容的最後，使用 \`\`\`json:action 格式。

### ✅ 正確示範 1：記錄觀察（完整版）

🗣️ **第一部分：對話內容**
很好的觀察！我已經記錄了這個重要發現：

📌 **洞察**：年輕人認為期貨比加密貨幣更有保障，因為有專業人員監管，不像加密貨幣充斥詐騙

這個觀察點出了「信任感」的重要性。讓我們繼續探討...

💾 **第二部分：JSON action（必須有！）**
\`\`\`json:action
{
  "type": "ADD_OBSERVATION",
  "data": {
    "content": "年輕人認為期貨比加密貨幣更有保障，因為有專業人員監管，不像加密貨幣充斥詐騙",
    "category": "insight"
  }
}
\`\`\`

### ✅ 正確示範 2：記錄需求（完整版）

🗣️ **第一部分：對話內容**
太好了！讓我記錄這個需求：

⚡ **需求**：年輕人希望有線上學習平台，以便方便地學習期貨交易課程，隨時隨地獲得支持與資源

這將使他們在學習上更具靈活性。如果你有更多的觀察或想法，隨時分享！

💾 **第二部分：JSON action（必須有！）**
\`\`\`json:action
{
  "type": "ADD_OBSERVATION",
  "data": {
    "content": "年輕人希望有線上學習平台，以便方便地學習期貨交易課程，隨時隨地獲得支持與資源",
    "category": "need"
  }
}
\`\`\`

### 🔴 最重要的提醒
**每次記錄觀察時，你必須同時輸出對話內容和 JSON action！**
- category 可選：pain_point（痛點）、behavior（行為）、need（需求）、insight（洞察）
- 對話內容必須完整包含你要記錄的資訊
- JSON action 必須緊跟在對話內容後面
- 用表情符號讓內容更易讀：📌💡😞👁️⚡🎯
`;
}

function getStageGuidelines(stage: string, projectState: ProjectState): string {
  const { observations, povStatements, ideas } = projectState;

  switch (stage) {
    case 'empathize':
      const remainingObservations = Math.max(0, 3 - observations.length);
      return `
## 同理心階段指引
- 目標：收集至少 3 個關鍵洞察（可以收集更多，沒有上限）
- 目前進度：已收集 ${observations.length} 個${observations.length < 3 ? `，還需 ${remainingObservations} 個達到最低目標` : ''}
- 使用 5 Whys 技巧深入挖掘
- 🚨 重要：即使已達到 3 個，仍要繼續記錄學員分享的所有觀察
- 持續收集洞察，直到學員主動表示想進入下一階段
${observations.length >= 3 ? '✅ 已達成最低目標，但請繼續收集更多觀察！只有在學員主動詢問時才建議進入下一階段。' : ''}`;

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
- 目標：產生至少 15 個點子（可以繼續產生更多）
- 目前進度：已有 ${ideas.length} 個點子${ideas.length < 15 ? `，還需 ${remainingIdeas} 個達到最低目標` : ''}
- 將 POV 轉化為 HMW (How Might We) 問題
${ideas.length < 15 ? '- 使用極端限制來刺激創意（如：預算只有 1 元？只有 1 分鐘？）' : ''}
- 🚨 重要：即使已達到 15 個，仍要繼續記錄學員提出的所有新點子
${ideas.length >= 15 ? '✅ 已達成最低目標，但請繼續收集更多點子！只有在學員主動詢問時才建議進入下一階段。' : ''}`;

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
