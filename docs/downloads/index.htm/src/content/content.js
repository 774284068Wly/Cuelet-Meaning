(function () {
  const BUILD = 'cuelet-meaning-1.0.0';
  if (window.__cueletMeaningBuild === BUILD) return;
  window.__cueletMeaningBuild = BUILD;

  const TABS = [['meaning', '含义'], ['aesthetic', '美学'], ['evidence', '依据'], ['json', 'JSON']];
  const uid = () => crypto.randomUUID?.() || `r${Date.now()}${Math.random()}`;
  const STYLE = `
    :host { all: initial; } *,*::before,*::after { box-sizing:border-box; }
    .wrap { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; }
    .card { --glass:rgba(249,250,252,.78);--ink:#1a1a22;--muted:#6f6f7c;--line:rgba(20,20,40,.1);--chip:rgba(120,120,140,.13);position:fixed;right:22px;bottom:22px;width:420px;max-width:calc(100vw - 32px);max-height:82vh;display:flex;flex-direction:column;color:var(--ink);background:var(--glass);backdrop-filter:blur(26px) saturate(160%);border:1px solid rgba(255,255,255,.65);border-radius:22px;box-shadow:0 30px 70px -24px rgba(20,20,40,.45),0 6px 18px rgba(0,0,0,.08);z-index:2147483647;overflow:hidden;animation:enter .22s ease-out; }
    @keyframes enter { from{opacity:0;transform:translateY(12px) scale(.98)} }
    .head { display:flex;align-items:center;gap:11px;padding:15px 16px 10px;cursor:grab;user-select:none; }
    .thumb { width:44px;height:44px;border-radius:9px;object-fit:cover;background:var(--chip);box-shadow:0 0 0 1px var(--line); }
    .headtext { min-width:0;flex:1; }.title { font-size:14px;font-weight:760; }.summary { margin-top:3px;font-size:12px;line-height:1.35;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .close { all:unset;width:30px;height:30px;display:grid;place-items:center;border-radius:8px;background:var(--chip);cursor:pointer;font-size:14px; }
    .stage { padding:10px 20px 22px; }.h1 { font-size:25px;font-weight:760;margin:2px 0 17px; }.track { height:9px;background:var(--chip);border-radius:99px;overflow:hidden; }.fill { height:100%;width:8%;background:var(--ink);border-radius:99px;transition:width .3s; }.hint { margin-top:12px;font-size:12.5px;color:var(--muted); }.error { font-size:13.5px;line-height:1.6;white-space:pre-wrap; }
    .tabs { display:flex;gap:4px;margin:0 16px;padding:4px;background:var(--chip);border-radius:11px; }.tab { all:unset;flex:1;text-align:center;padding:7px 0;border-radius:8px;color:var(--muted);font-size:12px;font-weight:700;cursor:pointer; }.tab.active { background:#fff;color:var(--ink);box-shadow:0 2px 8px rgba(0,0,0,.1); }
    .body { padding:13px 18px 5px;overflow:auto;min-height:120px; }.section { margin:0 0 15px; }.section h3 { margin:0 0 5px;font-size:12px;color:var(--muted);font-weight:730; }.section p { margin:0;font-size:13.5px;line-height:1.62;white-space:pre-wrap;word-break:break-word; }.lead p { font-size:16px;font-weight:720;line-height:1.5; }
    .chips { display:flex;flex-wrap:wrap;gap:6px; }.chip { font-size:11.5px;padding:4px 8px;background:var(--chip);border-radius:999px; }.symbol,.evidence { padding:11px;background:rgba(255,255,255,.48);border:1px solid var(--line);border-radius:8px;margin-bottom:8px; }.symbol strong,.evidence strong { display:block;font-size:12.5px;margin-bottom:5px; }.label { font-size:10.5px;font-weight:750;color:var(--muted);margin:8px 0 2px;text-transform:uppercase; }.evidence p { font-size:12.5px;line-height:1.55; }
    pre { margin:0;padding:12px;border:1px solid var(--line);border-radius:8px;background:rgba(255,255,255,.46);font:11.5px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;word-break:break-word; }
    .foot { display:flex;gap:7px;padding:12px 15px 15px;flex-wrap:wrap; }.btn { all:unset;cursor:pointer;font-size:12px;font-weight:700;padding:8px 12px;border-radius:999px;background:var(--chip); }.btn.primary { background:var(--ink);color:#fff; }.grow { flex:1; }
    .toast { position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:rgba(20,20,28,.88);color:#fff;padding:9px 16px;border-radius:999px;font-size:12px;z-index:2147483647; }
    .pick-ring { position:fixed;border:2px solid #fff;border-radius:8px;box-shadow:0 0 0 100vmax rgba(15,15,22,.5),0 0 0 5px rgba(0,0,0,.28);pointer-events:none;z-index:2147483646;display:none; }
    .pick-hint { position:fixed;left:50%;top:20px;transform:translateX(-50%);background:rgba(20,20,28,.88);color:#fff;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:650;pointer-events:none;z-index:2147483647; }
    @media(prefers-color-scheme:dark){.card{--glass:rgba(26,26,32,.76);--ink:#f1f1f4;--muted:#a2a2ad;--line:rgba(255,255,255,.09);--chip:rgba(255,255,255,.1)}.tab.active,.symbol,.evidence,pre{background:rgba(255,255,255,.12)}.btn.primary{color:#17171d;background:#fff}}
  `;

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'style') node.style.cssText = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else if (value != null) node.setAttribute(key, value);
    });
    children.flat().filter((child) => child != null).forEach((child) => node.append(child.nodeType ? child : document.createTextNode(child)));
    return node;
  }
  let sheet;
  function makeHost() {
    const host = el('div'); host.style.cssText = 'all:initial;position:static';
    const shadow = host.attachShadow({ mode: 'open' });
    sheet ||= new CSSStyleSheet(); if (!sheet.cssRules.length) sheet.replaceSync(STYLE);
    shadow.adoptedStyleSheets = [sheet]; const wrap = el('div', { class: 'wrap' }); shadow.append(wrap);
    document.documentElement.append(host); return { host, wrap };
  }
  function toast(message) { const { host, wrap } = makeHost(); wrap.append(el('div', { class: 'toast', text: message })); setTimeout(() => host.remove(), 1600); }
  async function copy(value) {
    try { await navigator.clipboard.writeText(value); toast('已复制'); }
    catch { toast('复制失败，请手动选择复制'); }
  }
  const fullText = (result) => [
    `一句话结论：\n${result.summary}`, `画面内容：\n${result.literal_description}`, `核心表达：\n${result.core_meaning}`,
    `整体美学：\n${result.aesthetic?.overall || ''}`, `色彩：\n${result.aesthetic?.color || ''}`, `构图：\n${result.aesthetic?.composition || ''}`,
    `光线：\n${result.aesthetic?.lighting || ''}`, `质感：\n${result.aesthetic?.texture || ''}`,
    `情绪氛围：\n${(result.emotion || []).join('、')}`, `不确定性：\n${result.uncertainty}`
  ].join('\n\n');
  function eagleItem(result, srcUrl) {
    const tags = [...(result.keywords || []), ...(result.aesthetic?.style_tags || []), 'Cuelet', '图像含义'];
    return { url: srcUrl, name: result.summary || '图像含义解读', website: location.href, tags: [...new Set(tags.filter(Boolean))].slice(0, 20), annotation: fullText(result) };
  }

  const state = { host:null,wrap:null,reqId:null,srcUrl:'',thumb:'',result:null,mode:'loading',tab:'meaning',error:'',eagle:false,progress:8,timer:null };
  async function loadPrefs() { const stored = await chrome.storage.local.get('cuelet_meaning_settings'); state.eagle = !!stored.cuelet_meaning_settings?.eagleEnabled; }
  function closeCard() { clearInterval(state.timer); state.host?.remove(); state.host = null; }
  function ensureCard() { if (state.host?.isConnected) return; const made = makeHost(); state.host = made.host; state.wrap = made.wrap; }
  function section(title, content, lead = false) { return el('section', { class: `section${lead ? ' lead' : ''}` }, el('h3', { text: title }), el('p', { text: content || '暂无内容' })); }
  function chips(values) { return el('div', { class: 'chips' }, ...(values?.length ? values.map((value) => el('span', { class: 'chip', text: value })) : [el('span', { class: 'chip', text: '暂无' })])); }
  function meaningView(r) {
    const box = el('div'); box.append(section('一句话结论', r.summary, true), section('画面内容', r.literal_description), section('核心表达', r.core_meaning));
    const emotions = el('section', { class: 'section' }, el('h3', { text: '情绪氛围' }), chips(r.emotion)); box.append(emotions);
    const symbolism = el('section', { class: 'section' }, el('h3', { text: '象征元素' }));
    if (!r.symbolism?.length) symbolism.append(el('p', { text: '未发现有足够证据支持的象征元素。' }));
    else r.symbolism.forEach((item) => symbolism.append(el('div', { class: 'symbol' }, el('strong', { text: `${item.element} · ${item.confidence}` }), el('p', { text: item.possible_meaning }))));
    box.append(symbolism, section('其他可能理解', (r.alternative_readings || []).join('\n')), section('不确定性说明', r.uncertainty)); return box;
  }
  function aestheticView(r) {
    const box = el('div'); box.append(section('整体美学', r.aesthetic?.overall));
    box.append(el('section', { class: 'section' }, el('h3', { text: '风格标签' }), chips(r.aesthetic?.style_tags)));
    box.append(section('色彩', r.aesthetic?.color), section('构图', r.aesthetic?.composition), section('光线', r.aesthetic?.lighting), section('质感', r.aesthetic?.texture)); return box;
  }
  function evidenceView(r) {
    const box = el('div');
    if (!r.visual_evidence?.length) return el('p', { text: '暂无视觉依据。' });
    r.visual_evidence.forEach((item) => box.append(el('article', { class: 'evidence' }, el('strong', { text: item.dimension || '视觉维度' }), el('div', { class: 'label', text: '看到什么' }), el('p', { text: item.observation }), el('div', { class: 'label', text: '如何理解' }), el('p', { text: item.interpretation })))); return box;
  }
  function currentText() { if (!state.result) return ''; if (state.tab === 'json') return JSON.stringify(state.result, null, 2); if (state.tab === 'aesthetic') return [state.result.aesthetic?.overall, ...(state.result.aesthetic?.style_tags || []), state.result.aesthetic?.color, state.result.aesthetic?.composition, state.result.aesthetic?.lighting, state.result.aesthetic?.texture].filter(Boolean).join('\n\n'); if (state.tab === 'evidence') return (state.result.visual_evidence || []).map((x) => `${x.dimension}\n看到什么：${x.observation}\n如何理解：${x.interpretation}`).join('\n\n'); return fullText(state.result); }
  function render() {
    ensureCard(); state.wrap.textContent = '';
    const card = el('div', { class: 'card' });
    const head = el('div', { class: 'head' }, state.thumb ? el('img', { class: 'thumb', src: state.thumb, alt: '' }) : null, el('div', { class: 'headtext' }, el('div', { class: 'title', text: '图像含义解读' }), state.result?.summary ? el('div', { class: 'summary', text: state.result.summary }) : null), el('button', { class: 'close', text: '×', title: '关闭', onclick: closeCard })); card.append(head);
    if (state.mode === 'loading') {
      const fill = el('div', { class: 'fill', style: `width:${state.progress}%` });
      const hints = ['正在读取画面主体', '正在分析构图与色彩', '正在寻找视觉关系', '正在整理含义与美学'];
      card.append(el('div', { class: 'stage' }, el('div', { class: 'h1', text: '正在解读图片' }), el('div', { class: 'track' }, fill), el('div', { class: 'hint', text: hints[Math.min(3, Math.floor((state.progress - 8) / 22))] })));
      state.timer = setInterval(() => { state.progress += (93 - state.progress) * .05; fill.style.width = `${state.progress}%`; }, 120);
    } else if (state.mode === 'error') {
      const key = state.error === 'NO_API_KEY'; card.append(el('div', { class: 'stage' }, el('div', { class: 'h1', text: key ? '需要配置' : '分析失败' }), el('div', { class: 'error', text: key ? '请先在设置中填写 OpenAI 兼容接口的 Base URL、API Key 和视觉模型。' : state.error })));
      card.append(el('div', { class: 'foot' }, el('button', { class: 'btn', text: '重新分析', onclick: regenerate }), el('div', { class: 'grow' }), el('button', { class: 'btn primary', text: '去设置', onclick: () => chrome.runtime.sendMessage({ type: 'PC_OPEN_OPTIONS' }) })));
    } else {
      card.append(el('div', { class: 'tabs' }, ...TABS.map(([key, label]) => el('button', { class: `tab${state.tab === key ? ' active' : ''}`, text: label, onclick: () => { state.tab = key; render(); } }))));
      const body = el('div', { class: 'body' });
      body.append(state.tab === 'meaning' ? meaningView(state.result) : state.tab === 'aesthetic' ? aestheticView(state.result) : state.tab === 'evidence' ? evidenceView(state.result) : el('pre', { text: JSON.stringify(state.result, null, 2) })); card.append(body);
      const foot = el('div', { class: 'foot' }, el('button', { class: 'btn', text: '复制当前', onclick: () => copy(currentText()) }), el('button', { class: 'btn', text: '复制完整分析', onclick: () => copy(fullText(state.result)) }), el('button', { class: 'btn', text: '重新分析', onclick: regenerate }));
      if (state.eagle) foot.append(el('button', { class: 'btn', text: '存入 Eagle', onclick: async () => { const response = await chrome.runtime.sendMessage({ type: 'PC_EAGLE_SAVE', item: eagleItem(state.result, state.srcUrl) }); toast(response?.ok ? '已存入 Eagle' : `存入失败：${response?.error || '未知错误'}`); } }));
      foot.append(el('div', { class: 'grow' }), el('button', { class: 'btn primary', text: '关闭', onclick: closeCard })); card.append(foot);
    }
    state.wrap.append(card);
  }
  async function run(srcUrl) {
    if (!srcUrl) return; clearInterval(state.timer); state.srcUrl = srcUrl; state.result = null; state.thumb = ''; state.error = ''; state.mode = 'loading'; state.progress = 8; state.reqId = uid(); const reqId = state.reqId; render();
    let response; try { response = await chrome.runtime.sendMessage({ type: 'PC_PROCESS', analysisType: 'meaning', srcUrl, pageUrl: location.href }); } catch { response = { ok:false,error:'后台无响应，请重试' }; }
    if (state.reqId !== reqId || !state.host?.isConnected) return; clearInterval(state.timer);
    if (response?.ok) { state.result = response.result; state.thumb = response.thumb; state.mode = 'result'; await loadPrefs(); } else { state.error = response?.error || '未知错误'; state.mode = 'error'; } render();
  }
  function regenerate() { if (state.srcUrl) run(state.srcUrl); }
  async function scanImage(srcUrl) { await run(srcUrl); }

  let picker = null;
  function startPicker() {
    if (picker) return; const { host, wrap } = makeHost(); const ring = el('div', { class: 'pick-ring' }); const hint = el('div', { class: 'pick-hint', text: '移动到图片上单击解读 · 按 Esc 取消' }); wrap.append(ring, hint);
    function resolveAt(x, y) {
      const stack = document.elementsFromPoint(x, y) || [];
      for (const node of stack) if (node.tagName === 'IMG') { const src = node.currentSrc || node.src; if (src) return { src, rect: node.getBoundingClientRect() }; }
      for (const node of stack) {
        if (!node || node === document.documentElement || node === document.body) continue;
        const match = (getComputedStyle(node).backgroundImage || '').match(/url\((?:"|')?(.*?)(?:"|')?\)/);
        if (match?.[1] && !/^data:image\/svg/.test(match[1])) { const rect = node.getBoundingClientRect(); if (rect.width >= 24 && rect.height >= 24) return { src: match[1], rect }; }
      }
      for (let i = 0; i < Math.min(stack.length, 4); i++) { const image = stack[i].querySelector?.('img'); if (image) { const src = image.currentSrc || image.src; const rect = image.getBoundingClientRect(); if (src && rect.width >= 24 && rect.height >= 24) return { src, rect }; } }
      return null;
    }
    function place(hit) { if (!hit || hit.rect.width < 16 || hit.rect.height < 16) { ring.style.display = 'none'; return; } Object.assign(ring.style, { display:'block',left:`${hit.rect.left}px`,top:`${hit.rect.top}px`,width:`${hit.rect.width}px`,height:`${hit.rect.height}px` }); }
    const move = (event) => { picker.current = resolveAt(event.clientX, event.clientY); place(picker.current); };
    const click = (event) => { const hit = resolveAt(event.clientX, event.clientY); if (!hit) return; event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); stopPicker(); scanImage(hit.src); };
    const key = (event) => { if (event.key === 'Escape') { event.preventDefault(); stopPicker(); } };
    picker = { host, move, click, key, current:null }; document.addEventListener('mousemove', move, true); document.addEventListener('click', click, true); document.addEventListener('keydown', key, true);
  }
  function stopPicker() { if (!picker) return; document.removeEventListener('mousemove', picker.move, true); document.removeEventListener('click', picker.click, true); document.removeEventListener('keydown', picker.key, true); picker.host.remove(); picker = null; }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'PC_PICK_START') startPicker();
    else if (message?.type === 'PC_LOADING') { state.reqId = message.reqId; state.srcUrl = message.srcUrl; state.mode = 'loading'; state.progress = 8; state.result = null; state.thumb = ''; render(); }
    else if (message?.type === 'PC_RESULT' && (!state.reqId || state.reqId === message.reqId)) { clearInterval(state.timer); state.result = message.result; state.thumb = message.thumb; state.srcUrl = message.srcUrl; state.mode = 'result'; loadPrefs().then(render); }
    else if (message?.type === 'PC_ERROR' && (!state.reqId || state.reqId === message.reqId)) { clearInterval(state.timer); state.error = message.error; state.mode = 'error'; render(); }
  });
})();
