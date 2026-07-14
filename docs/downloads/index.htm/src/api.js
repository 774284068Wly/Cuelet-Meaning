function endpointFor(baseUrl) {
  const base = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!base) throw new Error('未配置 Base URL');
  return /\/chat\/completions$/.test(base) ? base : `${base}/chat/completions`;
}

export function extractJSON(text) {
  if (!String(text || '').trim()) throw new Error('模型返回为空');
  let value = String(text).trim();
  const fence = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) value = fence[1].trim();
  const start = value.indexOf('{');
  if (start < 0) return JSON.parse(value);
  let depth = 0, inString = false, escaped = false, end = -1;
  for (let i = start; i < value.length; i++) {
    const char = value[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) { end = i; break; }
  }
  return JSON.parse(end >= 0 ? value.slice(start, end + 1) : value.slice(start));
}

const text = (value) => value == null ? '' : (typeof value === 'string' ? value : JSON.stringify(value));
const strings = (value, limit = 20) => Array.isArray(value) ? value.map(text).map((x) => x.trim()).filter(Boolean).slice(0, limit) : [];
const records = (value, mapper, limit = 20) => Array.isArray(value) ? value.filter((x) => x && typeof x === 'object' && !Array.isArray(x)).slice(0, limit).map(mapper) : [];

export function normalize(parsed) {
  const source = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  const aesthetic = source.aesthetic && typeof source.aesthetic === 'object' && !Array.isArray(source.aesthetic) ? source.aesthetic : {};
  return {
    summary: text(source.summary).trim(),
    literal_description: text(source.literal_description).trim(),
    core_meaning: text(source.core_meaning).trim(),
    visual_evidence: records(source.visual_evidence, (item) => ({
      dimension: text(item.dimension).trim(), observation: text(item.observation).trim(), interpretation: text(item.interpretation).trim()
    })),
    aesthetic: {
      overall: text(aesthetic.overall).trim(), style_tags: strings(aesthetic.style_tags, 3),
      color: text(aesthetic.color).trim(), composition: text(aesthetic.composition).trim(),
      lighting: text(aesthetic.lighting).trim(), texture: text(aesthetic.texture).trim()
    },
    emotion: strings(source.emotion, 6),
    symbolism: records(source.symbolism, (item) => ({
      element: text(item.element).trim(), possible_meaning: text(item.possible_meaning).trim(),
      confidence: ['high', 'medium', 'low'].includes(item.confidence) ? item.confidence : 'low'
    })),
    alternative_readings: strings(source.alternative_readings), keywords: strings(source.keywords, 12),
    uncertainty: text(source.uncertainty).trim()
  };
}

function request(endpoint, settings, dataUrl, opts) {
  const body = {
    model: settings.model,
    messages: [{ role: 'user', content: [
      { type: 'text', text: settings.meaningPromptTemplate },
      { type: 'image_url', image_url: { url: dataUrl } }
    ] }]
  };
  if (!opts.omitTemperature) body.temperature = settings.temperature;
  body[opts.maxTokensParam] = settings.maxTokens;
  if (opts.jsonMode) body.response_format = { type: 'json_object' };
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${String(settings.apiKey || '').trim()}`, 'HTTP-Referer': 'https://cuelet.local', 'X-Title': 'Cuelet Meaning' },
    body: JSON.stringify(body)
  });
}

async function errorText(response) {
  const data = await response.clone().json().catch(() => null);
  return data?.error?.message || (await response.text().catch(() => '')) || '';
}

export async function analyzeImage(dataUrl, settings) {
  if (!String(settings.apiKey || '').trim()) throw new Error('NO_API_KEY');
  if (!settings.model) throw new Error('未配置模型名称');
  const endpoint = endpointFor(settings.baseUrl);
  const opts = { jsonMode: !!settings.jsonMode, omitTemperature: !!settings.omitTemperature, maxTokensParam: settings.maxTokensParam || 'max_tokens' };
  let response = await request(endpoint, settings, dataUrl, opts);
  for (let i = 0; i < 3 && !response.ok && [400, 422].includes(response.status); i++) {
    const detail = (await response.clone().text().catch(() => '')).toLowerCase();
    let changed = false;
    if (opts.jsonMode && /response_format|json/.test(detail)) { opts.jsonMode = false; changed = true; }
    if (!opts.omitTemperature && /temperature/.test(detail)) { opts.omitTemperature = true; changed = true; }
    if (opts.maxTokensParam === 'max_tokens' && /max_completion_tokens/.test(detail)) { opts.maxTokensParam = 'max_completion_tokens'; changed = true; }
    if (!changed) break;
    response = await request(endpoint, settings, dataUrl, opts);
  }
  if (!response.ok) throw new Error(`接口错误 ${response.status}：${(await errorText(response)).slice(0, 300)}`);
  const data = await response.json();
  if (data?.error) throw new Error(`接口返回错误：${String(data.error.message || data.error).slice(0, 300)}`);
  const content = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text;
  if (content == null) throw new Error('接口未返回有效结果，请确认模型支持图片输入');
  const raw = Array.isArray(content) ? content.map((part) => typeof part === 'string' ? part : part?.text || '').join('') : String(content);
  try { return normalize(extractJSON(raw)); }
  catch { throw new Error('模型返回的 JSON 无法解析，请重新分析或调整图片含义分析指令'); }
}

export async function testConnection(settings) {
  const tiny = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFElEQVR4nGNkYGD4z0AEYBxVSF+FAP5FBQXM2H4lAAAAAElFTkSuQmCC';
  await analyzeImage(tiny, { ...settings, maxTokens: Math.min(settings.maxTokens || 3000, 800) });
  return { ok: true };
}
