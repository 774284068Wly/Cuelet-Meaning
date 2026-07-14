import { getSettings, SETTINGS_KEY, HISTORY_KEY, HISTORY_LIMIT, DEFAULT_SETTINGS } from './src/defaults.js';
import { prepareImage } from './src/image.js';
import { analyzeImage } from './src/api.js';

const MENU_MEANING = 'cuelet-meaning-image';
const warn = (error) => console.warn('[Cuelet Meaning]', error?.message || error);

function eagleBase(settings) { return String(settings.eagleUrl || 'http://localhost:41595').trim().replace(/\/+$/, ''); }
function eagleUrl(base, path, token) {
  const url = `${String(base || 'http://localhost:41595').trim().replace(/\/+$/, '')}${path}`;
  return token ? `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(String(token).trim())}` : url;
}
async function eagleFetch(url, init) {
  try { return await fetch(url, init); } catch { throw new Error('未检测到 Eagle，请先打开 Eagle 应用'); }
}
async function eagleAdd(item, settings) {
  const body = { ...item };
  if (settings.eagleFolderId) body.folderId = settings.eagleFolderId;
  const response = await eagleFetch(eagleUrl(eagleBase(settings), '/api/item/addFromURL', settings.eagleToken), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.status !== 'success') throw new Error(`Eagle 返回异常：${data.message || data.status || response.status}`);
}

function createMenus() {
  chrome.contextMenus.removeAll(() => chrome.contextMenus.create({ id: MENU_MEANING, title: 'Cuelet：解读图片含义', contexts: ['image'] }));
}
chrome.runtime.onInstalled.addListener(async (details) => {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  if (!stored[SETTINGS_KEY]) await chrome.storage.local.set({ [SETTINGS_KEY]: DEFAULT_SETTINGS });
  createMenus();
  if (details.reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
});
chrome.runtime.onStartup.addListener(createMenus);

async function ensureContent(tabId) {
  try { await chrome.scripting.executeScript({ target: { tabId }, files: ['src/content/content.js'] }); }
  catch { throw new Error('当前页面不支持注入（如 chrome:// 或应用商店页）'); }
}

async function processImage(srcUrl, settings) {
  const { dataUrl, thumb } = await prepareImage(srcUrl, settings);
  return { result: await analyzeImage(dataUrl, settings), thumb };
}

async function saveHistory(entry) {
  const stored = await chrome.storage.local.get(HISTORY_KEY);
  let list = Array.isArray(stored[HISTORY_KEY]) ? stored[HISTORY_KEY] : [];
  list = list.filter((item) => item.srcUrl !== entry.srcUrl);
  list.unshift({ id: crypto.randomUUID(), ts: Date.now(), analysisType: 'meaning', ...entry });
  await chrome.storage.local.set({ [HISTORY_KEY]: list.slice(0, HISTORY_LIMIT) });
}

async function directAnalyze(tab, srcUrl) {
  await ensureContent(tab.id);
  const reqId = crypto.randomUUID();
  await chrome.tabs.sendMessage(tab.id, { type: 'PC_LOADING', reqId, srcUrl });
  const settings = await getSettings();
  if (!settings.apiKey) {
    chrome.tabs.sendMessage(tab.id, { type: 'PC_ERROR', reqId, error: 'NO_API_KEY' }).catch(warn);
    return;
  }
  try {
    const { result, thumb } = await processImage(srcUrl, settings);
    await saveHistory({ srcUrl, pageUrl: tab.url || '', title: tab.title || '', result, thumb });
    chrome.tabs.sendMessage(tab.id, { type: 'PC_RESULT', reqId, srcUrl, result, thumb }).catch(warn);
  } catch (error) {
    chrome.tabs.sendMessage(tab.id, { type: 'PC_ERROR', reqId, error: error.message || String(error) }).catch(warn);
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_MEANING && tab?.id && info.srcUrl) directAnalyze(tab, info.srcUrl).catch(warn);
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'pick-image-meaning') return;
  let target = tab;
  if (!target?.id) [target] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!target?.id) return;
  try { await ensureContent(target.id); await chrome.tabs.sendMessage(target.id, { type: 'PC_PICK_START' }); } catch (error) { warn(error); }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message?.type) return;
  if (message.type === 'PC_PROCESS') {
    (async () => {
      try {
        const settings = await getSettings();
        if (!settings.apiKey) return sendResponse({ ok: false, error: 'NO_API_KEY' });
        const { result, thumb } = await processImage(message.srcUrl, settings);
        await saveHistory({ srcUrl: message.srcUrl, pageUrl: message.pageUrl || sender.tab?.url || '', title: sender.tab?.title || '', result, thumb });
        sendResponse({ ok: true, result, thumb, analysisType: 'meaning' });
      } catch (error) { sendResponse({ ok: false, error: error.message || String(error) }); }
    })();
    return true;
  }
  if (message.type === 'PC_PICK_PAGE') {
    (async () => {
      try { await ensureContent(message.tabId); await chrome.tabs.sendMessage(message.tabId, { type: 'PC_PICK_START' }); sendResponse({ ok: true }); }
      catch (error) { sendResponse({ ok: false, error: error.message || String(error) }); }
    })();
    return true;
  }
  if (message.type === 'PC_OPEN_OPTIONS') { chrome.runtime.openOptionsPage(); sendResponse({ ok: true }); return; }
  if (message.type === 'PC_EAGLE_SAVE') {
    (async () => { try { await eagleAdd(message.item, await getSettings()); sendResponse({ ok: true }); } catch (error) { sendResponse({ ok: false, error: error.message || String(error) }); } })();
    return true;
  }
  if (message.type === 'PC_EAGLE_TEST' || message.type === 'PC_EAGLE_FOLDERS') {
    (async () => {
      try {
        const path = message.type === 'PC_EAGLE_TEST' ? '/api/application/info' : '/api/folder/list';
        const response = await eagleFetch(eagleUrl(message.eagleUrl, path, message.token), { method: 'GET' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.status !== 'success') throw new Error(`返回异常 ${response.status}`);
        if (message.type === 'PC_EAGLE_TEST') return sendResponse({ ok: true, version: data?.data?.version || '' });
        const folders = [];
        const walk = (items, prefix = '') => (items || []).forEach((folder) => {
          const name = prefix ? `${prefix} / ${folder.name}` : folder.name;
          folders.push({ id: folder.id, name }); walk(folder.children, name);
        });
        walk(data.data); sendResponse({ ok: true, folders });
      } catch (error) { sendResponse({ ok: false, error: error.message || String(error) }); }
    })();
    return true;
  }
});
