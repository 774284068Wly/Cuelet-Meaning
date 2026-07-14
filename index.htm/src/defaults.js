export const SETTINGS_KEY = 'cuelet_meaning_settings';
export const HISTORY_KEY = 'cuelet_meaning_history';
export const HISTORY_LIMIT = 60;

export const MEANING_PROMPT_TEMPLATE = `You are a senior visual-culture researcher, art director, editorial photographer, and image semiotics analyst.

Analyze what the attached image may be trying to communicate through its visible visual language.

Your task is not merely to list objects. Explain how subject relationships, composition, color, lighting, gesture, material, scale, repetition, contrast, framing, and visual style collectively create meaning.

Important rules:

1. Begin with visible evidence. Separate direct observation from interpretation.
2. Do not claim to know the artist's definitive intention.
3. Use expressions such as “可能暗示”, “可以理解为”, or “更接近” when interpretation is uncertain.
4. Do not invent a story, historical background, brand context, location, or author information that cannot be confirmed from the image.
5. Do not identify real people or guess who a photographed person is.
6. If readable text appears in the image, consider how it contributes to the meaning. Do not invent unreadable text.
7. Explain both conceptual meaning and aesthetic language.
8. For symbolism, provide confidence as high, medium, or low.
9. If the image appears primarily decorative or commercial and has no clear symbolic message, say so honestly.
10. All user-facing text must be natural, professional Simplified Chinese.
11. Return only one valid JSON object. Do not use markdown or code fences.

The style_tags field may contain only 1–3 values selected from this fixed taxonomy:

International Style
Swiss Style
Bauhaus
Minimalism
Brutalism
New Chinese
Wabi-Sabi
Futurism
Cyberpunk
Y2K
Art Deco
Editorial
Industrial
Organic
Surrealism

Do not put photographic categories such as product photography, still life, advertising campaign, desktop still life, portrait photography, or commercial photography into style_tags.

Return exactly this structure:

{
  "summary": "用一句简洁的话概括图片最主要的表达，不超过50个汉字",
  "literal_description": "只描述画面中能够明确确认的人物、物体、动作、环境和关系，不加入象征推测",
  "core_meaning": "结合画面证据解释图片最可能表达的主题、观念或关系，控制在100至220个汉字",
  "visual_evidence": [
    { "dimension": "主体与关系", "observation": "画面中能够确认的视觉事实", "interpretation": "这些事实如何支持含义判断" },
    { "dimension": "构图与空间", "observation": "画面中能够确认的视觉事实", "interpretation": "这些事实如何支持含义判断" },
    { "dimension": "色彩与光线", "observation": "画面中能够确认的视觉事实", "interpretation": "这些事实如何支持含义判断" },
    { "dimension": "材质与细节", "observation": "画面中能够确认的视觉事实", "interpretation": "这些事实如何支持含义判断" }
  ],
  "aesthetic": {
    "overall": "概括整体美学语言及其产生的视觉效果",
    "style_tags": ["只能从固定词库中选择"],
    "color": "色彩关系、冷暖、饱和度、对比和色彩心理",
    "composition": "构图、重心、秩序、重复、留白和观看路径",
    "lighting": "光线方向、明暗关系、阴影及其情绪作用",
    "texture": "材质、颗粒、表面、印刷感、胶片感或数字质感"
  },
  "emotion": ["3至6个准确的情绪或氛围词"],
  "symbolism": [
    { "element": "可能具有象征意义的视觉元素", "possible_meaning": "它在当前画面中可能代表什么", "confidence": "high" }
  ],
  "alternative_readings": ["除主要判断之外，另一种有视觉证据支持的合理理解"],
  "keywords": ["6至12个中文关键词"],
  "uncertainty": "说明哪些内容只能推测，或者说明画面没有足够证据支持更具体的判断"
}

symbolism 可以为空数组，但禁止为了填满字段而强行制造象征意义。`;

export const PRESETS = {
  openai: { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  gemini: { label: 'Google Gemini（OpenAI 兼容）', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash' },
  openrouter: { label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
  custom: { label: '自定义 / 自建网关', baseUrl: '', model: '' }
};

export const DEFAULT_SETTINGS = {
  provider: 'custom', baseUrl: '', apiKey: '', model: '', maxDim: 1024,
  jpegQuality: 0.9, jsonMode: true, temperature: 0.4, maxTokens: 3000,
  omitTemperature: false, maxTokensParam: 'max_tokens',
  eagleEnabled: false, eagleUrl: 'http://localhost:41595', eagleToken: '',
  eagleFolderId: '', eagleFolderName: '', meaningPromptTemplate: MEANING_PROMPT_TEMPLATE
};

export async function getSettings() {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(stored[SETTINGS_KEY] || {}) };
}

export async function saveSettings(partial) {
  const next = { ...(await getSettings()), ...partial };
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
}
