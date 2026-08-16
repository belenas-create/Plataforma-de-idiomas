/* ==========================================================================
   app.js — Lógica da plataforma (SPA)
   Fala apenas com `Store` (nunca com localStorage diretamente), então quando
   o backend virar Firestore, nada aqui precisa mudar.
   ========================================================================== */

(() => {
"use strict";

/* ============================================================
   ESTADO GLOBAL DE UI (não persistido)
============================================================= */
const ui = {
  currentView: "today",
  todayPicker: { time: null, energy: null, language: null, skill: "mix" },
  weekOffset: 0,
  currentLanguageDetail: null,
  currentLanguageSkillTab: "listening",
  timer: { minutes: 0, remaining: 0, interval: null, running: false, session: null }
};

/* ============================================================
   BOOTSTRAP
============================================================= */
document.addEventListener("DOMContentLoaded", () => {
  Store.init();
  applyTheme();
  renderLocalBanner();
  wireGlobalEvents();
  wireNav();
  wireToday();
  wireWeek();
  wireLanguages();
  wireCatalog();
  wireCourses();
  wireMethods();
  wireVocabulary();
  wireSettings();
  wireModals();
  wireSearch();

  if (!Store.getSettings().onboardingComplete) {
    runOnboarding();
  } else {
    fullRender();
  }
});

function fullRender(){
  renderHeader();
  renderToday();
  renderWeek();
  renderLanguages();
  renderCatalog();
  renderCourses();
  renderMethods();
  renderVocabulary();
  renderProgress();
  renderSettings();
}

/* ============================================================
   UTIL
============================================================= */
function $(sel, ctx=document){ return ctx.querySelector(sel); }
function $$(sel, ctx=document){ return Array.from(ctx.querySelectorAll(sel)); }
function el(tag, attrs={}, children=[]){
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c === null || c === undefined) return;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return e;
}
function toast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.hidden = true, 2600);
}
function menuLabel(m){
  return { snack:"🍿 Snack", entrada:"🍽️ Entrada", "prato-principal":"🍛 Prato Principal",
    sobremesa:"🍰 Sobremesa", "menu-principal":"🍷 Menu Principal" }[m] || m;
}
function skillLabel(s){
  return { listening:"🎧 Listening", speaking:"🗣️ Speaking", writing:"✍️ Writing",
    vocabulary:"🧠 Vocabulary", grammar:"📚 Grammar", mix:"🔀 Mix" }[s] || s;
}
function fmtMin(min){
  if (min < 60) return `${min}min`;
  const h = Math.floor(min/60), m = min%60;
  return m ? `${h}h${String(m).padStart(2,"0")}` : `${h}h`;
}
function isoWeekDates(weekId){
  // weekId ex: "2026-W33" -> retorna array de 7 datas (segunda a domingo)
  const [yearStr, wStr] = weekId.split("-W");
  const year = parseInt(yearStr,10), week = parseInt(wStr,10);
  const jan4 = new Date(Date.UTC(year,0,4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week-1)*7);
  return Array.from({length:7}, (_,i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate()+i);
    return d;
  });
}
function weekIdOffset(offset){
  const d = new Date();
  d.setDate(d.getDate() + offset*7);
  return Store.currentWeekId(d);
}
const DAY_KEYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const DAY_LABELS = { monday:"Segunda", tuesday:"Terça", wednesday:"Quarta", thursday:"Quinta", friday:"Sexta", saturday:"Sábado", sunday:"Domingo" };

/* ============================================================
   TEMA
============================================================= */
function applyTheme(){
  const theme = Store.getSettings().theme || "light";
  document.documentElement.setAttribute("data-theme", theme);
  const btn = $("#theme-toggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}
function toggleTheme(){
  const cur = Store.getSettings().theme || "light";
  const next = cur === "dark" ? "light" : "dark";
  Store.updateSettings({ theme: next });
  applyTheme();
  const sel = $("#set-theme"); if (sel) sel.value = next;
}

function renderLocalBanner(){
  const banner = $("#local-mode-banner");
  if (!Store.isFirebaseConnected()) banner.hidden = false;
}

/* ============================================================
   EVENTOS GLOBAIS
============================================================= */
function wireGlobalEvents(){
  $("#theme-toggle").addEventListener("click", toggleTheme);
  $("#dismiss-banner").addEventListener("click", () => $("#local-mode-banner").hidden = true);
  $("#global-search-btn").addEventListener("click", () => openModal("search-modal"));
  $$("[data-close]").forEach(btn => btn.addEventListener("click", () => closeModal(btn.dataset.close)));
  $$(".overlay").forEach(ov => ov.addEventListener("click", (e) => { if (e.target === ov) ov.hidden = true; }));
}
function openModal(id){ $("#"+id).hidden = false; }
function closeModal(id){ $("#"+id).hidden = true; }

/* ============================================================
   NAVEGAÇÃO
============================================================= */
function wireNav(){
  $$(".nav-item[data-view]").forEach(btn => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });
}
function switchView(view){
  ui.currentView = view;
  $$(".nav-item[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  $$(".view").forEach(v => v.classList.remove("active"));
  $("#view-"+view).classList.add("active");
  window.scrollTo({top:0, behavior:"instant"});
  // re-render sob demanda
  const renderers = { today: renderToday, week: renderWeek, languages: renderLanguages,
    catalog: renderCatalog, courses: renderCourses, methods: renderMethods,
    vocabulary: renderVocabulary, progress: renderProgress, settings: renderSettings };
  if (renderers[view]) renderers[view]();
}

function renderHeader(){
  const langs = Store.getAll("languages");
  const sel = $("#language-picker");
  sel.innerHTML = "";
  langs.forEach(l => {
    const chip = el("button", { class:"chip", "data-lang": l.id, onclick: () => selectPicker("language", l.id) }, `${l.flag} ${l.name}`);
    sel.appendChild(chip);
  });
  updateStreakUI();
}

/* ============================================================
   GAMIFICAÇÃO — streak / badges
============================================================= */
function computeStreak(){
  const sessions = Store.getAll("studySessions").filter(s => s.status === "concluído" || s.status === "iniciado");
  if (!sessions.length) return 0;
  const daysWithStudy = new Set(sessions.map(s => new Date(s.date).toDateString()));
  let streak = 0;
  let cursor = new Date();
  // se não estudou hoje ainda, começamos a contar a partir de ontem (não penaliza o dia atual)
  if (!daysWithStudy.has(cursor.toDateString())) cursor.setDate(cursor.getDate()-1);
  while (daysWithStudy.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate()-1);
  }
  return streak;
}
function updateStreakUI(){
  const streak = computeStreak();
  $("#streak-count").textContent = streak;
  $("#dash-streak") && ($("#dash-streak").textContent = `${streak} dia${streak===1?"":"s"}`);
}
function checkBadges(){
  const sessions = Store.getAll("studySessions");
  const completed = sessions.filter(s => s.status === "concluído");
  const counts = {
    streak: computeStreak(),
    listeningSessions: completed.filter(s => s.skill === "listening").length,
    speakingSessions: completed.filter(s => s.skill === "speaking").length,
    writingSessions: completed.filter(s => s.skill === "writing").length,
    professionalSessions: completed.filter(s => (s.tags||[]).includes("professional")).length,
    spanishSessions: completed.filter(s => s.language === "spanish").length
  };
  SEED_DATA.badges.forEach(b => {
    // eslint-disable-next-line no-new-func
    const fn = new Function(...Object.keys(counts), `return (${b.condition});`);
    if (fn(...Object.values(counts))) {
      if (Store.unlockBadge(b.id)) toast(`🏅 Badge desbloqueada: ${b.name}`);
    }
  });
}
const PROFESSIONAL_KEYWORDS = ["fcl","impo","customer service","pricing","logistics","freight","shipment","booking","quotation","customs","container","demurrage","incoterm","forwarder","cotação","embarque"];
function inferTags(text, language, skill){
  const tags = [language, skill];
  const lower = (text||"").toLowerCase();
  if (PROFESSIONAL_KEYWORDS.some(k => lower.includes(k))) tags.push("professional");
  return tags;
}

/* ============================================================
   TELA "HOJE"
============================================================= */
function greetingText(){
  const h = new Date().getHours();
  const name = Store.getSettings().name;
  const base = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return `${base}${name ? ", "+name : ""}! ${h<12?"☀️":h<18?"🌤️":"🌙"}`;
}
function consistencyMessage(){
  const streak = computeStreak();
  const messages = streak === 0
    ? ["Vamos recomeçar.", "5 minutos já contam.", "Hoje podemos fazer um snack."]
    : ["Consistência > perfeição.", `Você está há ${streak} dia${streak===1?"":"s"} voltando — isso é o que importa.`, "Escolha o que cabe no seu dia."];
  return messages[Math.floor(Math.random()*messages.length)];
}

function wireToday(){
  $$("#time-picker .chip").forEach(c => c.addEventListener("click", () => selectPicker("time", c.dataset.time, c)));
  $$("#energy-picker .chip").forEach(c => c.addEventListener("click", () => selectPicker("energy", c.dataset.energy, c)));
  $$("#skill-picker .chip").forEach(c => c.addEventListener("click", () => selectPicker("skill", c.dataset.skill, c)));
  $("#btn-quick-log").addEventListener("click", openQuickLog);
  $("#btn-open-timer").addEventListener("click", () => { resetTimerModal(); openModal("timer-modal"); });
  $("#btn-recommend").addEventListener("click", openRecommendation);
}

function selectPicker(kind, value, btnEl){
  ui.todayPicker[kind] = ui.todayPicker[kind] === value && kind !== "skill" ? null : value;
  const containerId = { time:"#time-picker", energy:"#energy-picker", language:"#language-picker", skill:"#skill-picker" }[kind];
  $$(containerId + " .chip").forEach(c => c.classList.remove("selected"));
  if (ui.todayPicker[kind] !== null) {
    const sel = btnEl || $$(containerId+" .chip").find(c => c.dataset[kind] === value);
    if (sel) sel.classList.add("selected");
  }
  renderTodaySuggestions();
}

function renderToday(){
  $("#greeting-text").textContent = greetingText();
  $("#consistency-message").textContent = consistencyMessage();
  renderHeader();

  // pré-seleciona idioma principal se nada escolhido
  if (!ui.todayPicker.language) {
    const primary = Store.getAll("languages").find(l => l.status === "primary");
    if (primary) ui.todayPicker.language = primary.id;
  }
  $$("#language-picker .chip").forEach(c => c.classList.toggle("selected", c.dataset.lang === ui.todayPicker.language));

  renderTodaySuggestions();
  renderDashboard();
}

/* ---------- Motor de sugestões (regra de ouro da plataforma) ---------- */
function pickResource(language, skill, menu){
  const resources = Store.getAll("resources").filter(r =>
    (r.language === language || r.language === "general") &&
    (skill === "mix" || r.skill === skill || r.skill === "mix") &&
    r.status !== "concluído"
  );
  if (!resources.length) return null;
  const menuMatch = resources.filter(r => r.menu === menu);
  const pool = menuMatch.length ? menuMatch : resources;
  return pool[Math.floor(Math.random()*pool.length)];
}
function methodFor(id){ return Store.getAll("methods").find(m => m.id === id); }

function menuForMinutes(min){
  if (min <= 5) return "snack";
  if (min <= 15) return "entrada";
  if (min <= 45) return "prato-principal";
  return "menu-principal";
}

function buildBlocks(minutes, skill, language, energy){
  const res = (s) => { const r = pickResource(language, s, menuForMinutes(minutes)); return r ? r.name : null; };
  const blocks = [];
  const effSkill = skill === "mix"
    ? (energy === "low" ? "listening" : energy === "excited" ? "speaking" : ["listening","speaking","vocabulary"][Math.floor(Math.random()*3)])
    : skill;

  if (minutes <= 5) {
    // SNACK — uma coisa só, leve
    const options = {
      listening: [`5 min de listening curto${res('listening')?` (${res('listening')})`:''}`],
      speaking: [`5 min de shadowing curto`],
      writing: [`5 min: escrever 3 frases sobre seu dia`],
      vocabulary: [`5 min de Anki / revisão de chunks`],
      grammar: [`5 min: revisar 1 estrutura gramatical recente`]
    };
    blocks.push({ min: 5, label: options[effSkill] ? options[effSkill][0] : "5 min de revisão rápida" });
    return { skill: effSkill, blocks, method: "anki-srs" };
  }

  // divide em input / processing(prática) / output, proporcional
  const inputMin = Math.max(5, Math.round(minutes*0.35/5)*5);
  const outputMin = Math.max(5, Math.round(minutes*0.35/5)*5);
  const processMin = Math.max(5, minutes - inputMin - outputMin);

  const templates = {
    listening: [
      { min: inputMin, label: `Ouvir conteúdo compreensível${res('listening')?` — ${res('listening')}`:''}` },
      { min: processMin, label: "Reouvir e anotar 3 chunks novos" },
      { min: outputMin, label: "Resumo oral do que você entendeu" }
    ],
    speaking: [
      { min: inputMin, label: `Ouvir um diálogo curto${res('listening')?` — ${res('listening')}`:''}` },
      { min: processMin, label: "Shadowing (repetir em voz alta)" },
      { min: outputMin, label: "Falar: responder 3 perguntas em voz alta" }
    ],
    writing: [
      { min: inputMin, label: "Ler 1 exemplo de texto/e-mail no seu nível" },
      { min: processMin, label: "Rascunho: escrever seu próprio texto" },
      { min: outputMin, label: "Revisar e reescrever 3 frases" }
    ],
    vocabulary: [
      { min: inputMin, label: `Revisão no Anki / WordBox${res('vocabulary')?` — ${res('vocabulary')}`:''}` },
      { min: processMin, label: "Aprender 3-5 chunks novos (não palavras soltas)" },
      { min: outputMin, label: "Criar e falar 3 frases usando os chunks" }
    ],
    grammar: [
      { min: inputMin, label: "Explicação curta de 1 estrutura gramatical" },
      { min: processMin, label: "Identificar a estrutura em um listening/reading" },
      { min: outputMin, label: "Criar 3 frases próprias usando a estrutura" }
    ]
  };
  return { skill: effSkill, blocks: templates[effSkill] || templates.listening, method: effSkill === "speaking" ? "shadowing" : "comprehensible-input-output" };
}

function generateSuggestions(){
  const { time, energy, language, skill } = ui.todayPicker;
  if (!time || !language) return [];
  const minutes = parseInt(time,10);
  const menu = menuForMinutes(minutes);
  const suggestions = [];

  // sugestão principal
  const main = buildBlocks(minutes, skill || "mix", language, energy || "normal");
  suggestions.push({ menu, minutes, skill: main.skill, blocks: main.blocks, method: main.method, title: `${menuLabel(menu)} — ${minutes} min` });

  // sugestões alternativas (menu principal / mais de 30 min permite montar combinação)
  if (minutes >= 30) {
    const alt = buildBlocks(minutes, "vocabulary", language, energy || "normal");
    suggestions.push({ menu, minutes, skill: alt.skill, blocks: alt.blocks, method: alt.method, title: `Alternativa: foco em Vocabulary` });
  }
  if (minutes >= 15 && (skill === "mix" || !skill)) {
    const alt2 = buildBlocks(minutes, "speaking", language, energy || "normal");
    suggestions.push({ menu, minutes, skill: alt2.skill, blocks: alt2.blocks, method: alt2.method, title: `Alternativa: foco em Speaking` });
  }
  return suggestions.slice(0,3);
}

function renderTodaySuggestions(){
  const area = $("#today-suggestions");
  const suggestions = generateSuggestions();
  area.innerHTML = "";
  if (!ui.todayPicker.time || !ui.todayPicker.language) {
    area.appendChild(el("p", { class:"muted" }, "Escolha tempo, idioma e energia acima para ver sugestões. 🍽️"));
    return;
  }
  suggestions.forEach(s => area.appendChild(renderSuggestionCard(s)));
}

function renderSuggestionCard(s){
  const method = methodFor(s.method);
  const card = el("div", { class:"suggestion-card" }, [
    el("span", { class:`menu-badge ${s.menu}` }, s.title),
    el("h4", {}, `${skillLabel(s.skill)} · ${s.minutes} min`),
    el("ol", { class:"suggestion-steps" }, s.blocks.map(b => el("li", {}, `${b.min} min — ${b.label}`))),
    method ? el("p", { class:"muted" }, `Método: ${method.name}`) : null,
    el("div", { class:"suggestion-actions" }, [
      el("button", { class:"btn btn-primary", onclick: () => startSuggestionTimer(s) }, "▶️ Iniciar"),
      el("button", { class:"btn btn-secondary", onclick: () => quickLogFromSuggestion(s) }, "✓ Já fiz")
    ])
  ]);
  return card;
}
function startSuggestionTimer(s){
  ui.timer.pendingLog = { language: ui.todayPicker.language, skill: s.skill, menu: s.menu, method: s.method };
  resetTimerModal();
  openModal("timer-modal");
  startTimer(s.minutes);
}
function quickLogFromSuggestion(s){
  Store.logSession({
    language: ui.todayPicker.language, skill: s.skill, menu: s.menu, method: s.method,
    duration: s.minutes, status: "concluído", notes: s.title,
    tags: inferTags(s.blocks.map(b=>b.label).join(" "), ui.todayPicker.language, s.skill)
  });
  toast("✓ Sessão registrada! Mandou bem.");
  checkBadges(); updateStreakUI(); renderDashboard();
}

/* ---------- Dashboard (Hoje) ---------- */
function weekStats(weekId){
  const sessions = Store.getAll("studySessions").filter(s => Store.currentWeekId(new Date(s.date)) === weekId);
  const completed = sessions.filter(s => s.status === "concluído");
  const totalMinutes = completed.reduce((sum,s) => sum + (parseInt(s.duration,10)||0), 0);
  const bySkill = {};
  completed.forEach(s => bySkill[s.skill] = (bySkill[s.skill]||0) + (parseInt(s.duration,10)||0));
  const activeDays = new Set(completed.map(s => new Date(s.date).toDateString())).size;
  return { sessions, completed, totalMinutes, bySkill, activeDays };
}

function skillProgressPercents(){
  const completed = Store.getAll("studySessions").filter(s => s.status === "concluído");
  const skills = ["listening","speaking","writing","vocabulary","grammar"];
  const out = {};
  skills.forEach(sk => {
    const totalMin = completed.filter(s => s.skill === sk).reduce((a,s) => a + (parseInt(s.duration,10)||0), 0);
    out[sk] = Math.max(0, Math.min(100, Math.round((totalMin/600)*100))); // 600min (~10h) = 100% dentro da plataforma
  });
  return out;
}

function renderDashboard(){
  const g = Store.getAll("goals") || SEED_DATA.goals;
  const stats = weekStats(weekIdOffset(0));
  $("#dash-week-sessions").textContent = `${stats.completed.length}/${g.weeklySessions || SEED_DATA.goals.weeklySessions}`;
  $("#dash-week-time").textContent = fmtMin(stats.totalMinutes);
  updateStreakUI();

  const pcts = skillProgressPercents();
  const bars = $("#dash-skills-bars");
  bars.innerHTML = "";
  Object.entries(pcts).forEach(([sk,pct]) => {
    bars.appendChild(el("div", { class:"skill-bar-row" }, [
      el("span", { class:"skill-bar-label" }, skillLabel(sk).replace(/^[^\s]+\s/,"")),
      el("div", { class:"skill-bar-track" }, el("div", { class:"skill-bar-fill", style:`width:${pct}%` })),
      el("span", { class:"skill-bar-pct" }, `${pct}%`)
    ]));
  });

  // resumo por idioma
  const langSummary = $("#languages-summary");
  langSummary.innerHTML = "";
  Store.getAll("languages").forEach(l => {
    langSummary.appendChild(el("div", { class:`lang-summary-card ${l.color||''}` }, [
      el("h4", {}, `${l.flag} ${l.name}`),
      el("p", { class:"muted" }, `Nível: ${l.level} · ${l.status === "primary" ? "idioma principal" : l.status === "secondary" ? "idioma secundário" : "futuro"}`),
      el("p", { class:"muted" }, `Meta atual: ${l.goal || "—"}`),
      el("div", { class:"badge-row" }, [
        el("span", { class:"mini-badge" }, l.priority === "alta" ? "🔥 Alta prioridade" : l.priority === "media" ? "Prioridade média" : "🌱 Baixa prioridade")
      ])
    ]));
  });

  renderBalanceTip(stats);
}

function renderBalanceTip(stats){
  const tip = $("#balance-tip");
  const bySkill = stats.bySkill;
  const skills = ["listening","speaking","writing","vocabulary","grammar"];
  const withData = skills.filter(s => bySkill[s] !== undefined);
  if (withData.length < 2) { tip.hidden = true; return; }
  const max = withData.reduce((a,b) => bySkill[a] > bySkill[b] ? a : b);
  const min = skills.reduce((a,b) => (bySkill[a]||0) < (bySkill[b]||0) ? a : b);
  if (max === min || (bySkill[max]||0) < 20) { tip.hidden = true; return; }
  tip.hidden = false;
  tip.textContent = `💡 Você praticou bastante ${skillLabel(max).replace(/^\S+\s/,"")} esta semana. Que tal um pouco de ${skillLabel(min).replace(/^\S+\s/,"")} também?`;
}

/* ============================================================
   ONBOARDING
============================================================= */
const onboardingState = { primaryLevel:"B1", secondaryLevel:"A0", weeklyDays:"4", objective:"trabalho", skills:[] };
function runOnboarding(){
  $("#onboarding-overlay").hidden = false;
  renderOnboardingStep(0);
}
const ONBOARDING_STEPS = [
  { title: "Qual seu idioma principal?", key: "primary", type: "text-fixed", value: "🇺🇸 English" },
  { title: "Qual seu nível em English?", key: "primaryLevel", type: "options", options: ["A0","A1","A2","B1","B2","C1","C2"] },
  { title: "Qual seu segundo idioma?", key: "secondary", type: "text-fixed", value: "🇪🇸 Español" },
  { title: "Qual seu nível em Español?", key: "secondaryLevel", type: "options", options: ["A0","A1","A2","B1","B2","C1","C2"] },
  { title: "Quantos dias por semana você gostaria de estudar?", key: "weeklyDays", type: "options", options: ["3","4","5","6","7"] },
  { title: "Qual seu objetivo principal?", key: "objective", type: "options", options: [["trabalho","Trabalho"],["conversacao","Conversação"],["viagem","Viagem"],["estudos","Estudos"],["geral","Geral"]] },
  { title: "Quais habilidades deseja priorizar?", key: "skills", type: "multi", options: [["speaking","Speaking"],["listening","Listening"],["writing","Writing"],["vocabulary","Vocabulary"],["grammar","Grammar"]] }
];
let onboardingIdx = 0;
function renderOnboardingStep(idx){
  onboardingIdx = idx;
  $("#onboarding-progress-bar").style.width = `${Math.round(((idx+1)/ONBOARDING_STEPS.length)*100)}%`;
  const step = ONBOARDING_STEPS[idx];
  const container = $("#onboarding-steps");
  container.innerHTML = "";
  const wrap = el("div", { class:"onboarding-step" });
  wrap.appendChild(el("h2", {}, step.title));

  if (step.type === "text-fixed") {
    wrap.appendChild(el("p", { class:"muted" }, `${step.value} — já sabemos pelo seu contexto (você pode alterar depois em Configurações).`));
  } else if (step.type === "options") {
    const opts = el("div", { class:"onboarding-options" + (step.key==="objective"?" grid2":"") });
    step.options.forEach(opt => {
      const [val,label] = Array.isArray(opt) ? opt : [opt,opt];
      const cur = onboardingState[step.key];
      const btn = el("button", { class:"onboarding-option" + (cur===val?" selected":""), type:"button", onclick: () => {
        onboardingState[step.key] = val;
        renderOnboardingStep(idx);
      }}, label);
      opts.appendChild(btn);
    });
    wrap.appendChild(opts);
  } else if (step.type === "multi") {
    const opts = el("div", { class:"onboarding-options" });
    step.options.forEach(([val,label]) => {
      const selected = onboardingState.skills.includes(val);
      const btn = el("button", { class:"onboarding-option"+(selected?" selected":""), type:"button", onclick: () => {
        const i = onboardingState.skills.indexOf(val);
        if (i === -1) onboardingState.skills.push(val); else onboardingState.skills.splice(i,1);
        renderOnboardingStep(idx);
      }}, label);
      opts.appendChild(btn);
    });
    wrap.appendChild(opts);
  }

  const nav = el("div", { class:"onboarding-nav" });
  if (idx > 0) nav.appendChild(el("button", { class:"btn btn-secondary", onclick: () => renderOnboardingStep(idx-1) }, "← Voltar"));
  else nav.appendChild(el("span", {}));
  const isLast = idx === ONBOARDING_STEPS.length - 1;
  nav.appendChild(el("button", { class:"btn btn-primary", onclick: () => isLast ? finishOnboarding() : renderOnboardingStep(idx+1) }, isLast ? "Concluir" : "Avançar →"));
  wrap.appendChild(nav);
  container.appendChild(wrap);
}
function finishOnboarding(){
  Store.updateSettings({
    onboardingComplete: true,
    primaryLanguage: "english",
    secondaryLanguage: "spanish",
    weeklyDaysGoal: parseInt(onboardingState.weeklyDays,10),
    mainObjective: onboardingState.objective,
    prioritySkills: onboardingState.skills.length ? onboardingState.skills : ["speaking","listening"]
  });
  Store.update("languages","english",{ level: onboardingState.primaryLevel });
  Store.update("languages","spanish",{ level: onboardingState.secondaryLevel });
  persistGoals({ ...Store.getAll("goals"), weeklySessions: 3, dailyMinutes: 15 });

  $("#onboarding-overlay").hidden = true;
  toast("Vamos começar pequeno: 3 sessões de 15 min esta semana, foco em Listening + Speaking. 🌱");
  fullRender();
}
// `goals` é um objeto único (não uma coleção com ids), então persiste direto
// no mesmo formato de chave usado por store.js (`NAMESPACE::collection`).
function persistGoals(goals){
  Object.assign(Store.getAll("goals"), goals);
  localStorage.setItem("langplatform_v1::goals", JSON.stringify(Store.getAll("goals")));
}

/* ============================================================
   SEMANA (PLANNER)
============================================================= */
function wireWeek(){
  $("#week-prev").addEventListener("click", () => { ui.weekOffset--; renderWeek(); });
  $("#week-next").addEventListener("click", () => { ui.weekOffset++; renderWeek(); });
  $("#add-activity-form").addEventListener("submit", onSaveActivity);
  $("#aa-delete").addEventListener("click", onDeleteActivity);
}
function renderWeek(){
  const weekId = weekIdOffset(ui.weekOffset);
  const dates = isoWeekDates(weekId);
  $("#week-label").textContent = `${weekId} (${dates[0].toLocaleDateString('pt-BR')} – ${dates[6].toLocaleDateString('pt-BR')})`;
  const plan = Store.getWeekPlan(weekId);
  const grid = $("#week-grid");
  grid.innerHTML = "";
  DAY_KEYS.forEach((day,i) => {
    const col = el("div", { class:"day-column", ondragover:(e)=>{e.preventDefault(); col.classList.add("drag-over");}, ondragleave:()=>col.classList.remove("drag-over"),
      ondrop:(e)=>{ e.preventDefault(); col.classList.remove("drag-over"); const actId = e.dataTransfer.getData("text/plain"); const fromDay = e.dataTransfer.getData("fromDay");
        if (fromDay && fromDay !== day) { Store.moveActivity(weekId, fromDay, day, actId); renderWeek(); } } });
    col.appendChild(el("h4", {}, [
      `${DAY_LABELS[day]} · ${dates[i].getDate()}/${dates[i].getMonth()+1}`,
      el("button", { class:"day-add-btn", "aria-label":"Adicionar atividade", onclick:() => openActivityModal(day, weekId) }, "+")
    ]));
    const list = el("div", { class:"day-activities" });
    (plan[day]||[]).forEach(act => {
      const lang = Store.getById("languages", act.language);
      const card = el("div", { class:`activity-card status-${act.status}`, draggable:"true",
        ondragstart:(e)=>{ e.dataTransfer.setData("text/plain", act.id); e.dataTransfer.setData("fromDay", day); },
        onclick: () => openActivityModal(day, weekId, act) }, [
        el("div", { class:"activity-top" }, [ el("span",{}, `${lang?lang.flag:""} ${menuLabel(act.menu)}`), el("span",{}, `${act.duration}min`) ]),
        el("div", {}, `${skillLabel(act.skill)}${act.note ? " — "+act.note : ""}`)
      ]);
      list.appendChild(card);
    });
    col.appendChild(list);
    grid.appendChild(col);
  });
}
function fillSelectWithLanguages(selectEl, includeEmpty){
  selectEl.innerHTML = includeEmpty ? '<option value="">—</option>' : "";
  Store.getAll("languages").forEach(l => selectEl.appendChild(el("option", { value:l.id }, `${l.flag} ${l.name}`)));
}
function fillSelectWithResources(selectEl, language){
  selectEl.innerHTML = '<option value="">—</option>';
  Store.getAll("resources").filter(r => !language || r.language === language || r.language === "general").forEach(r =>
    selectEl.appendChild(el("option", { value:r.id }, r.name)));
}
function fillSelectWithMethods(selectEl){
  selectEl.innerHTML = '<option value="">—</option>';
  Store.getAll("methods").forEach(m => selectEl.appendChild(el("option", { value:m.id }, m.name)));
}
function openActivityModal(day, weekId, activity){
  fillSelectWithLanguages($("#aa-language"));
  fillSelectWithResources($("#aa-content"));
  fillSelectWithMethods($("#aa-method"));
  $("#aa-day").value = day;
  $("#aa-id").value = activity ? activity.id : "";
  $("#add-activity-title").textContent = activity ? "Editar atividade" : `Nova atividade — ${DAY_LABELS[day]}`;
  $("#aa-delete").hidden = !activity;
  if (activity) {
    $("#aa-language").value = activity.language;
    $("#aa-menu").value = activity.menu;
    $("#aa-skill").value = activity.skill;
    $("#aa-content").value = activity.content || "";
    $("#aa-method").value = activity.method || "";
    $("#aa-duration").value = activity.duration;
    $("#aa-note").value = activity.note || "";
    $("#aa-status").value = activity.status;
  } else {
    $("#add-activity-form").reset();
    $("#aa-language").value = ui.todayPicker.language || Store.getAll("languages")[0].id;
  }
  ui.activityWeekId = weekId;
  openModal("add-activity-modal");
}
function onSaveActivity(ev){
  ev.preventDefault();
  const day = $("#aa-day").value;
  const id = $("#aa-id").value;
  const data = {
    language: $("#aa-language").value, menu: $("#aa-menu").value, skill: $("#aa-skill").value,
    content: $("#aa-content").value, method: $("#aa-method").value,
    duration: parseInt($("#aa-duration").value,10) || 15, note: $("#aa-note").value, status: $("#aa-status").value
  };
  if (id) {
    Store.updateActivity(ui.activityWeekId, day, id, data);
    if (data.status === "concluído") logFromPlannerActivity(data);
  } else {
    Store.addActivityToDay(ui.activityWeekId, day, data);
  }
  closeModal("add-activity-modal");
  renderWeek();
  toast("Planner atualizado.");
}
function onDeleteActivity(){
  const day = $("#aa-day").value, id = $("#aa-id").value;
  if (id) Store.removeActivity(ui.activityWeekId, day, id);
  closeModal("add-activity-modal");
  renderWeek();
}
function logFromPlannerActivity(act){
  Store.logSession({ language:act.language, skill:act.skill, menu:act.menu, method:act.method, duration:act.duration, status:"concluído", notes:act.note, tags: inferTags(act.note, act.language, act.skill) });
  checkBadges(); updateStreakUI();
}

/* ============================================================
   IDIOMAS
============================================================= */
function wireLanguages(){
  $("#btn-add-language").addEventListener("click", () => openModal("add-language-modal"));
  $("#add-language-form").addEventListener("submit", (e) => {
    e.preventDefault();
    Store.add("languages", {
      id: $("#al-name").value.toLowerCase().replace(/\s+/g,"-"),
      name: $("#al-name").value, flag: $("#al-flag").value, level: $("#al-level").value,
      status: $("#al-status").value, priority: $("#al-priority").value, goal: $("#al-goal").value,
      weeklyGoalSessions: parseInt($("#al-weekly").value,10)||0, prioritySkills: [], color: ""
    });
    e.target.reset();
    closeModal("add-language-modal");
    toast("Idioma adicionado!");
    renderLanguages(); renderHeader();
  });
  $("#language-detail-back").addEventListener("click", () => {
    $("#language-detail").hidden = true;
    $("#languages-grid").hidden = false;
  });
  $$("#language-skill-tabs .tab-btn").forEach(btn => btn.addEventListener("click", () => {
    ui.currentLanguageSkillTab = btn.dataset.skill;
    $$("#language-skill-tabs .tab-btn").forEach(b => b.classList.toggle("active", b===btn));
    renderLanguageSkillContent();
  }));
}
function renderLanguages(){
  const grid = $("#languages-grid");
  grid.innerHTML = "";
  Store.getAll("languages").forEach(l => {
    grid.appendChild(el("div", { class:`language-card ${l.color||''}`, onclick: () => openLanguageDetail(l.id) }, [
      el("span", { class:"flag" }, l.flag),
      el("h3", {}, l.name),
      el("p", { class:"muted" }, `Nível ${l.level} · ${l.priority==="alta"?"🔥 alta prioridade":l.priority==="baixa"?"🌱 baixa prioridade":"prioridade média"}`),
      el("p", { class:"muted" }, l.goal || "")
    ]));
  });
}
function openLanguageDetail(langId){
  ui.currentLanguageDetail = langId;
  const l = Store.getById("languages", langId);
  $("#languages-grid").hidden = true;
  $("#language-detail").hidden = false;
  $("#language-detail-header").innerHTML = "";
  $("#language-detail-header").appendChild(el("div", {}, [
    el("h2", {}, `${l.flag} ${l.name}`),
    el("p", { class:"muted" }, `Nível: ${l.level} · ${l.status==="primary"?"idioma principal":l.status==="secondary"?"idioma secundário":"futuro"} · Meta: ${l.goal||"—"}`)
  ]));
  ui.currentLanguageSkillTab = "listening";
  $$("#language-skill-tabs .tab-btn").forEach(b => b.classList.toggle("active", b.dataset.skill==="listening"));
  renderLanguageSkillContent();
}
function renderLanguageSkillContent(){
  const langId = ui.currentLanguageDetail;
  const skill = ui.currentLanguageSkillTab;
  const container = $("#language-skill-content");
  container.innerHTML = "";

  const resources = Store.getAll("resources").filter(r => r.language === langId && (r.skill === skill || r.skill === "mix"));
  const methods = Store.getAll("methods").filter(m => (m.mainSkill === skill || m.mainSkill === "mix") && m.languages.includes(langId));
  const sessions = Store.getAll("studySessions").filter(s => s.language === langId && s.skill === skill && s.status === "concluído");
  const totalMin = sessions.reduce((a,s)=>a+(parseInt(s.duration,10)||0),0);
  const pct = skillProgressPercents()[skill] || 0;

  container.appendChild(el("div", { class:"dash-card", style:"margin-bottom:14px;" }, [
    el("h4", {}, "Progresso"),
    el("div", { class:"skill-bar-row" }, [
      el("div", { class:"skill-bar-track", style:"flex:1" }, el("div", { class:"skill-bar-fill", style:`width:${pct}%` })),
      el("span", { class:"skill-bar-pct" }, `${pct}%`)
    ]),
    el("p", { class:"muted" }, `${sessions.length} sessões concluídas · ${fmtMin(totalMin)} estudados`)
  ]));

  container.appendChild(el("h4", {}, "Métodos recomendados"));
  const methodsWrap = el("div", { class:"methods-grid" });
  methods.forEach(m => methodsWrap.appendChild(renderMethodCard(m, true)));
  if (!methods.length) methodsWrap.appendChild(el("p", { class:"muted" }, "Nenhum método específico cadastrado ainda para essa habilidade."));
  container.appendChild(methodsWrap);

  container.appendChild(el("h4", { style:"margin-top:16px;" }, "Conteúdos e recursos"));
  const resWrap = el("div", { class:"catalog-grid" });
  resources.forEach(r => resWrap.appendChild(renderResourceCard(r)));
  if (!resources.length) resWrap.appendChild(el("p", { class:"muted" }, "Nenhum recurso cadastrado ainda — adicione em Catálogo."));
  container.appendChild(resWrap);
}

/* ============================================================
   CATÁLOGO
============================================================= */
function wireCatalog(){
  ["filter-language","filter-skill","filter-type","filter-menu","filter-status"].forEach(id =>
    $("#"+id).addEventListener("change", renderCatalog));
  $("#filter-search").addEventListener("input", renderCatalog);
  $("#btn-add-content").addEventListener("click", () => { fillSelectWithLanguages($("#ac-language")); openModal("add-content-modal"); });
  $("#add-content-form").addEventListener("submit", (e) => {
    e.preventDefault();
    Store.add("resources", {
      name: $("#ac-name").value, url: $("#ac-url").value, category: "custom",
      language: $("#ac-language").value, skill: $("#ac-skill").value, type: $("#ac-type").value,
      duration: parseInt($("#ac-duration").value,10)||15, level: $("#ac-level").value, menu: $("#ac-menu").value,
      activePassive: $("#ac-active").value, tags: $("#ac-tags").value.split(",").map(t=>t.trim()).filter(Boolean),
      notes: $("#ac-notes").value, status: $("#ac-status").value, progress: 0
    });
    e.target.reset();
    closeModal("add-content-modal");
    toast("Conteúdo adicionado ao catálogo!");
    renderCatalog();
  });
}
function populateLanguageFilterOptions(){
  const sel = $("#filter-language");
  const existing = new Set($$("#filter-language option").map(o=>o.value));
  Store.getAll("languages").forEach(l => { if (!existing.has(l.id)) sel.appendChild(el("option",{value:l.id}, `${l.flag} ${l.name}`)); });
  const vsel = $("#vocab-filter-language");
  const existingV = new Set($$("#vocab-filter-language option").map(o=>o.value));
  Store.getAll("languages").forEach(l => { if (!existingV.has(l.id)) vsel.appendChild(el("option",{value:l.id}, `${l.flag} ${l.name}`)); });
}
function renderCatalog(){
  populateLanguageFilterOptions();
  const lang = $("#filter-language").value, skill = $("#filter-skill").value, type = $("#filter-type").value,
    menu = $("#filter-menu").value, status = $("#filter-status").value, q = $("#filter-search").value.toLowerCase();
  const grid = $("#catalog-grid");
  grid.innerHTML = "";
  const items = Store.getAll("resources").filter(r =>
    (lang==="all"||r.language===lang) && (skill==="all"||r.skill===skill) && (type==="all"||r.type===type) &&
    (menu==="all"||r.menu===menu) && (status==="all"||r.status===status) &&
    (!q || r.name.toLowerCase().includes(q) || (r.tags||[]).join(" ").toLowerCase().includes(q))
  );
  if (!items.length) grid.appendChild(el("p", { class:"muted" }, "Nenhum recurso encontrado com esses filtros."));
  items.forEach(r => grid.appendChild(renderResourceCard(r)));
}
function renderResourceCard(r){
  const statusSel = el("select", { class:"status-select", onchange:(e)=>{ Store.update("resources", r.id, { status: e.target.value }); toast("Status atualizado."); } },
    ["não iniciado","em andamento","concluído"].map(s => el("option", { value:s, selected: s===r.status ? "selected" : null }, s)));
  return el("div", { class:"resource-card" }, [
    el("h4", {}, r.name),
    el("div", { class:"resource-meta" }, [
      el("span", {}, skillLabel(r.skill)), el("span", {}, menuLabel(r.menu)), el("span", {}, `${r.duration}min`), el("span", {}, r.level||"")
    ]),
    el("div", { class:"tag-row" }, (r.tags||[]).map(t => el("span", { class:"tag-chip" }, "#"+t))),
    r.notes ? el("p", { class:"muted" }, r.notes) : null,
    r.url ? el("a", { href:r.url, target:"_blank", rel:"noopener", class:"btn btn-secondary" }, "Abrir ↗") : el("p", { class:"muted" }, "Sem link cadastrado ainda."),
    statusSel
  ]);
}

/* ============================================================
   CURSOS
============================================================= */
function wireCourses(){}
function renderCourses(){
  const grid = $("#courses-grid");
  grid.innerHTML = "";
  Store.getAll("courses").forEach(c => {
    const lessonsTotal = (c.modules||[]).reduce((a,m)=>a+m.lessons.length,0);
    const lessonsDone = (c.modules||[]).reduce((a,m)=>a+m.lessons.filter(l=>l.status==="concluído").length,0);
    grid.appendChild(el("div", { class:"course-card" }, [
      el("h4", {}, c.name),
      el("div", { class:"tag-row" }, (c.tags||[]).map(t => el("span", { class:"tag-chip" }, "#"+t))),
      el("div", { class:"progress-track" }, el("div", { class:"progress-fill", style:`width:${c.progress||0}%` })),
      el("p", { class:"muted" }, `${c.progress||0}% concluído · ${lessonsDone}/${lessonsTotal||"?"} aulas · ${fmtMin(c.timeStudiedMin||0)} estudados`),
      el("p", {}, `Última aula: ${c.lastLesson||"—"}`),
      el("p", {}, `Próxima aula: ${c.nextLesson||"—"}`),
      c.notes ? el("p", { class:"muted" }, c.notes) : null,
      el("div", { class:"modal-actions" }, [
        el("button", { class:"btn btn-secondary", onclick: () => markCourseProgress(c.id) }, "+ Marcar aula concluída"),
        c.url ? el("a", { href:c.url, target:"_blank", rel:"noopener", class:"btn btn-secondary" }, "Abrir ↗") : null
      ])
    ]));
  });
}
function markCourseProgress(courseId){
  const c = Store.getById("courses", courseId);
  const newProgress = Math.min(100, (c.progress||0) + 10);
  Store.update("courses", courseId, { progress: newProgress, timeStudiedMin: (c.timeStudiedMin||0) + 20 });
  Store.logSession({ language: c.language==="general"?(Store.getSettings().primaryLanguage||"english"):c.language, skill:"mix", menu:"prato-principal", method:"", duration:20, status:"concluído", notes:`Aula de ${c.name}`, tags: inferTags(c.name, c.language, "mix") });
  toast("Progresso do curso atualizado!");
  renderCourses(); checkBadges(); updateStreakUI();
}

/* ============================================================
   MÉTODOS
============================================================= */
function wireMethods(){
  $("#btn-add-method").addEventListener("click", () => openModal("add-method-modal"));
  $("#add-method-form").addEventListener("submit", (e) => {
    e.preventDefault();
    Store.add("methods", {
      name: $("#am-name").value, concept: $("#am-concept").value, whenToUse: $("#am-when").value,
      duration: $("#am-duration").value, mainSkill: $("#am-skill").value,
      steps: $("#am-steps").value.split("\n").map(s=>s.trim()).filter(Boolean),
      example: $("#am-example").value, languages: Store.getAll("languages").map(l=>l.id),
      compatibleContent: [], tags: $("#am-tags").value.split(",").map(t=>t.trim()).filter(Boolean)
    });
    e.target.reset();
    closeModal("add-method-modal");
    toast("Método adicionado!");
    renderMethods();
  });
}
function renderMethods(){
  const grid = $("#methods-grid");
  grid.innerHTML = "";
  Store.getAll("methods").forEach(m => grid.appendChild(renderMethodCard(m)));
}
function renderMethodCard(m, compact){
  const card = el("div", { class:"method-card" }, [
    el("h4", {}, m.name),
    el("p", { class:"muted" }, m.concept),
    el("div", { class:"resource-meta" }, [ el("span",{}, skillLabel(m.mainSkill)), el("span",{}, m.duration||"") ])
  ]);
  if (!compact) {
    if (m.whenToUse) card.appendChild(el("p", {}, el("strong",{},"Quando usar: "), document.createTextNode(m.whenToUse)));
    if (m.steps && m.steps.length) card.appendChild(el("ol", { class:"suggestion-steps" }, m.steps.map(s => el("li",{},s))));
    if (m.example) card.appendChild(el("p", { class:"muted" }, `Exemplo: ${m.example}`));
    card.appendChild(el("div", { class:"tag-row" }, (m.tags||[]).map(t => el("span", { class:"tag-chip" }, "#"+t))));
  }
  return card;
}

/* ============================================================
   VOCABULÁRIO
============================================================= */
function wireVocabulary(){
  ["vocab-filter-language","vocab-filter-category","vocab-filter-status"].forEach(id => $("#"+id).addEventListener("change", renderVocabulary));
  $("#vocab-filter-search").addEventListener("input", renderVocabulary);
  $("#btn-add-vocab").addEventListener("click", () => {
    fillSelectWithLanguages($("#av-language"));
    const catSel = $("#av-category"); catSel.innerHTML = "";
    Store.getAll("vocabularyCategories").forEach(c => catSel.appendChild(el("option", { value:c.id }, c.name)));
    openModal("add-vocab-modal");
  });
  $("#add-vocab-form").addEventListener("submit", (e) => {
    e.preventDefault();
    Store.add("vocabulary", {
      term: $("#av-term").value, translation: $("#av-translation").value, definition: $("#av-definition").value,
      example: $("#av-example").value, professionalPhrase: $("#av-professional").value, dailyPhrase: $("#av-daily").value,
      language: $("#av-language").value, category: $("#av-category").value, level: $("#av-level").value,
      activePassive: $("#av-active").value, tags: $("#av-tags").value.split(",").map(t=>t.trim()).filter(Boolean)
    });
    e.target.reset();
    closeModal("add-vocab-modal");
    toast("Vocabulário adicionado!");
    renderVocabulary();
  });
}
function renderVocabulary(){
  populateLanguageFilterOptions();
  const catSel = $("#vocab-filter-category");
  if (!catSel.dataset.filled) {
    catSel.appendChild(el("option", { value:"all" }, "Categoria: Todas"));
    Store.getAll("vocabularyCategories").forEach(c => catSel.appendChild(el("option", { value:c.id }, c.name)));
    catSel.dataset.filled = "1";
  }
  const lang = $("#vocab-filter-language").value, cat = $("#vocab-filter-category").value,
    status = $("#vocab-filter-status").value, q = $("#vocab-filter-search").value.toLowerCase();
  const list = $("#vocabulary-list");
  list.innerHTML = "";
  const items = Store.getAll("vocabulary").filter(v =>
    (lang==="all"||v.language===lang) && (cat==="all"||v.category===cat) && (status==="all"||v.activePassive===status) &&
    (!q || v.term.toLowerCase().includes(q) || (v.translation||"").toLowerCase().includes(q) || (v.tags||[]).join(" ").toLowerCase().includes(q))
  );
  if (!items.length) list.appendChild(el("p", { class:"muted" }, "Nenhum item encontrado."));
  items.forEach(v => list.appendChild(el("div", { class:"vocab-card" }, [
    el("div", { class:"vocab-term" }, v.term),
    el("div", { class:"vocab-translation" }, v.translation),
    v.example ? el("div", { class:"vocab-example" }, `"${v.example}"`) : null,
    v.professionalPhrase ? el("div", {}, [el("div",{class:"vocab-phrase-label"},"Profissional"), el("div",{}, v.professionalPhrase)]) : null,
    v.dailyPhrase ? el("div", {}, [el("div",{class:"vocab-phrase-label"},"Cotidiano"), el("div",{}, v.dailyPhrase)]) : null,
    el("div", { class:"tag-row" }, [
      el("span", { class:"tag-chip" }, v.activePassive === "ativo" ? "#ativo" : "#passivo"),
      ...(v.tags||[]).map(t => el("span", { class:"tag-chip" }, "#"+t))
    ])
  ])));
}

/* ============================================================
   PROGRESSO
============================================================= */
function renderProgress(){
  const thisWeek = weekStats(weekIdOffset(0));
  const lastWeek = weekStats(weekIdOffset(-1));
  const compare = $("#progress-compare");
  compare.innerHTML = "";
  ["listening","speaking","writing","vocabulary","grammar"].forEach(sk => {
    const cur = thisWeek.bySkill[sk]||0, prev = lastWeek.bySkill[sk]||0;
    const delta = prev === 0 ? (cur>0?100:0) : Math.round(((cur-prev)/prev)*100);
    compare.appendChild(el("div", { class:"compare-card" }, [
      el("div", {}, skillLabel(sk)),
      el("div", { class:`delta ${delta>0?'positive':delta<0?'negative':''}` }, `${delta>0?'+':''}${delta}%`)
    ]));
  });

  drawBarChart("chart-minutes", last8Weeks().map(w => ({ label:w.label, value:w.totalMinutes })));
  const skillTotals = ["listening","speaking","writing","vocabulary","grammar"].map(sk => ({
    label: sk.slice(0,4), value: Store.getAll("studySessions").filter(s=>s.status==="concluído"&&s.skill===sk).length
  }));
  drawBarChart("chart-skills", skillTotals);
  drawBarChart("chart-active-days", last8Weeks().map(w => ({ label:w.label, value:w.activeDays })));

  const completed = Store.getAll("studySessions").filter(s=>s.status==="concluído");
  const totals = $("#progress-totals");
  totals.innerHTML = "";
  const totalsData = {
    "Sessões concluídas": completed.length,
    "Minutos totais": completed.reduce((a,s)=>a+(parseInt(s.duration,10)||0),0),
    "Palavras/chunks salvos": Store.getAll("vocabulary").length,
    "Aulas de curso concluídas": Store.getAll("courses").reduce((a,c)=>a+(c.modules||[]).reduce((b,m)=>b+m.lessons.filter(l=>l.status==="concluído").length,0),0),
    "Sessões de roleplay": completed.filter(s=>s.method==="roleplay").length,
    "Sessões de shadowing": completed.filter(s=>s.method==="shadowing").length
  };
  Object.entries(totalsData).forEach(([k,v]) => totals.appendChild(el("div", {}, `${k}: ${v}`)));

  const badgesGrid = $("#badges-grid");
  badgesGrid.innerHTML = "";
  const unlocked = Store.getAll("badgesUnlocked");
  SEED_DATA.badges.forEach(b => badgesGrid.appendChild(el("div", { class:"badge-item"+(unlocked.includes(b.id)?" unlocked":"") }, [
    el("span", { class:"badge-icon" }, b.icon), el("span", {}, b.name)
  ])));
}
function last8Weeks(){
  const weeks = [];
  for (let i=7; i>=0; i--) {
    const id = weekIdOffset(-i);
    const stats = weekStats(id);
    weeks.push({ label: id.split("-W")[1], totalMinutes: stats.totalMinutes, activeDays: stats.activeDays });
  }
  return weeks;
}
function drawBarChart(canvasId, data){
  const canvas = $("#"+canvasId);
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.parentElement.clientWidth - 28;
  const cssHeight = 180;
  canvas.width = cssWidth*dpr; canvas.height = cssHeight*dpr;
  canvas.style.width = cssWidth+"px"; canvas.style.height = cssHeight+"px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,cssWidth,cssHeight);
  const max = Math.max(1, ...data.map(d=>d.value));
  const barW = cssWidth/(data.length*1.6);
  const gap = barW*0.6;
  const isDark = document.documentElement.getAttribute("data-theme")==="dark";
  ctx.fillStyle = isDark ? "#a78bfa" : "#5b5bf0";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  data.forEach((d,i) => {
    const x = gap/2 + i*(barW+gap);
    const h = (d.value/max) * (cssHeight-30);
    ctx.fillStyle = isDark ? "#8b7ff5" : "#5b5bf0";
    ctx.fillRect(x, cssHeight-24-h, barW, h);
    ctx.fillStyle = isDark ? "#f1eefb" : "#211f2c";
    ctx.fillText(String(d.value), x+barW/2, cssHeight-24-h-4);
    ctx.fillStyle = isDark ? "#a8a3bd" : "#6c6880";
    ctx.fillText(String(d.label), x+barW/2, cssHeight-8);
  });
}

/* ============================================================
   CONFIGURAÇÕES
============================================================= */
function wireSettings(){
  $("#set-name").addEventListener("change", (e) => Store.updateSettings({ name: e.target.value }));
  $("#set-objective").addEventListener("change", (e) => Store.updateSettings({ mainObjective: e.target.value }));
  $("#set-week-days").addEventListener("change", (e) => Store.updateSettings({ weeklyDaysGoal: parseInt(e.target.value,10) }));
  $("#set-theme").addEventListener("change", (e) => { Store.updateSettings({ theme: e.target.value }); applyTheme(); });
  $("#btn-save-goals").addEventListener("click", () => {
    persistGoals({
      dailyMinutes: parseInt($("#goal-daily").value,10)||15,
      weeklySessions: parseInt($("#goal-weekly").value,10)||4,
      speakingSessionsPerWeek: parseInt($("#goal-speaking").value,10)||0,
      listeningMinutesPerWeek: parseInt($("#goal-listening").value,10)||0,
      vocabularyItemsPerWeek: parseInt($("#goal-vocab").value,10)||0,
      writingSessionsPerWeek: Store.getAll("goals").writingSessionsPerWeek || 1
    });
    toast("Metas salvas!");
    renderDashboard();
  });
  $("#btn-add-notebook").addEventListener("click", () => openModal("add-notebook-modal"));
  $("#add-notebook-form").addEventListener("submit", (e) => {
    e.preventDefault();
    Store.add("notebooks", { name: $("#nb-name").value, url: $("#nb-url").value });
    e.target.reset();
    closeModal("add-notebook-modal");
    renderSettings();
  });
  $("#btn-export-data").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(Store.exportAll(), null, 2)], { type:"application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `meu-painel-idiomas-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  });
  $("#btn-import-data").addEventListener("change", (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { Store.importAll(JSON.parse(reader.result)); toast("Dados importados!"); fullRender(); }
      catch (err) { toast("Arquivo inválido."); }
    };
    reader.readAsText(file);
  });
}
function renderSettings(){
  const s = Store.getSettings();
  $("#set-name").value = s.name || "";
  $("#set-objective").value = s.mainObjective || "trabalho";
  $("#set-week-days").value = s.weeklyDaysGoal || 4;
  $("#set-theme").value = s.theme || "light";
  const g = Store.getAll("goals");
  $("#goal-daily").value = g.dailyMinutes || 15;
  $("#goal-weekly").value = g.weeklySessions || 4;
  $("#goal-speaking").value = g.speakingSessionsPerWeek || 0;
  $("#goal-listening").value = g.listeningMinutesPerWeek || 0;
  $("#goal-vocab").value = g.vocabularyItemsPerWeek || 0;

  const nbList = $("#notebooks-list");
  nbList.innerHTML = "";
  Store.getAll("notebooks").forEach(nb => nbList.appendChild(el("div", { class:"notebook-item" }, [
    el("span", {}, nb.name),
    nb.url ? el("a", { href:nb.url, target:"_blank", rel:"noopener", class:"btn btn-secondary" }, "Abrir ↗") : el("span", { class:"muted" }, "sem link")
  ])));

  $("#firebase-status").textContent = Store.isFirebaseConnected() ? "✅ Firebase conectado — dados sincronizados." : "💾 Modo local ativo. Nenhuma conta conectada.";
}

/* ============================================================
   MODAIS GERAIS (registro rápido, timer, recomendação)
============================================================= */
function wireModals(){
  fillSelectWithLanguages($("#ql-language"));
  fillSelectWithMethods($("#ql-method"));
  $("#quicklog-form").addEventListener("submit", (e) => {
    e.preventDefault();
    Store.logSession({
      language: $("#ql-language").value, menu: $("#ql-menu").value, skill: $("#ql-skill").value,
      method: $("#ql-method").value, duration: parseInt($("#ql-duration").value,10)||15,
      status: $("#ql-status").value, notes: $("#ql-notes").value,
      tags: inferTags($("#ql-notes").value, $("#ql-language").value, $("#ql-skill").value)
    });
    e.target.reset();
    closeModal("quicklog-modal");
    toast("✓ Sessão registrada!");
    checkBadges(); updateStreakUI(); renderDashboard();
    if (ui.currentView === "progress") renderProgress();
  });

  $$("#timer-setup .chip").forEach(c => c.addEventListener("click", () => startTimer(parseInt(c.dataset.timer,10))));
  $("#timer-pause").addEventListener("click", pauseTimer);
  $("#timer-stop").addEventListener("click", stopTimer);
  $$("#timer-rating .chip").forEach(c => c.addEventListener("click", () => selectChipGroup("#timer-rating", c)));
  $$("#timer-feeling .chip").forEach(c => c.addEventListener("click", () => selectChipGroup("#timer-feeling", c)));
  $("#timer-save").addEventListener("click", saveTimerSession);
}
function openQuickLog(){
  fillSelectWithLanguages($("#ql-language"));
  fillSelectWithMethods($("#ql-method"));
  if (ui.todayPicker.language) $("#ql-language").value = ui.todayPicker.language;
  openModal("quicklog-modal");
}
function selectChipGroup(containerSel, chip){
  $$(containerSel+" .chip").forEach(c=>c.classList.remove("selected"));
  chip.classList.add("selected");
}

/* ---------- Timer ---------- */
function resetTimerModal(){
  $("#timer-setup").hidden = false; $("#timer-running").hidden = true; $("#timer-complete").hidden = true;
}
function startTimer(minutes){
  ui.timer.minutes = minutes; ui.timer.remaining = minutes*60; ui.timer.running = true;
  $("#timer-setup").hidden = true; $("#timer-running").hidden = false; $("#timer-complete").hidden = true;
  updateTimerDisplay();
  clearInterval(ui.timer.interval);
  ui.timer.interval = setInterval(() => {
    if (!ui.timer.running) return;
    ui.timer.remaining--;
    updateTimerDisplay();
    if (ui.timer.remaining <= 0) { clearInterval(ui.timer.interval); onTimerComplete(); }
  }, 1000);
}
function updateTimerDisplay(){
  const m = Math.floor(ui.timer.remaining/60), s = ui.timer.remaining%60;
  $("#timer-display").textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function pauseTimer(){
  ui.timer.running = !ui.timer.running;
  $("#timer-pause").textContent = ui.timer.running ? "Pausar" : "Retomar";
}
function stopTimer(){
  clearInterval(ui.timer.interval);
  resetTimerModal();
}
function onTimerComplete(){
  $("#timer-running").hidden = true; $("#timer-complete").hidden = false;
  $$("#timer-rating .chip, #timer-feeling .chip").forEach(c=>c.classList.remove("selected"));
  if (typeof Audio !== "undefined") { try { /* som opcional futuramente */ } catch(e){} }
}
function saveTimerSession(){
  const rating = $("#timer-rating .selected")?.dataset.rating || null;
  const feeling = $("#timer-feeling .selected")?.dataset.feeling || null;
  const pending = ui.timer.pendingLog || { language: ui.todayPicker.language || Store.getAll("languages")[0].id, skill: ui.todayPicker.skill||"mix", menu: menuForMinutes(ui.timer.minutes), method:"" };
  Store.logSession({
    language: pending.language, skill: pending.skill, menu: pending.menu, method: pending.method,
    duration: ui.timer.minutes, status: "concluído", rating: rating?parseInt(rating,10):null, feeling,
    tags: inferTags("", pending.language, pending.skill)
  });
  ui.timer.pendingLog = null;
  closeModal("timer-modal");
  toast("🎉 Sessão salva! Continue assim.");
  checkBadges(); updateStreakUI(); renderDashboard();
  if (ui.currentView === "week") renderWeek();
  if (ui.currentView === "progress") renderProgress();
}

/* ---------- Recomendação ("O que eu deveria estudar agora?") ---------- */
function openRecommendation(){
  const content = $("#recommend-content");
  content.innerHTML = "";
  const time = ui.todayPicker.time || 15;
  const energy = ui.todayPicker.energy || "normal";
  const language = ui.todayPicker.language || Store.getAll("languages").find(l=>l.status==="primary").id;

  // detecta habilidade menos praticada esta semana
  const stats = weekStats(weekIdOffset(0));
  const skills = ["listening","speaking","writing","vocabulary","grammar"];
  const weakest = skills.reduce((a,b) => (stats.bySkill[a]||0) <= (stats.bySkill[b]||0) ? a : b);

  content.appendChild(el("p", { class:"muted" }, `Você tem ${time} minutos, energia ${energy==="low"?"baixa":energy==="focused"?"focada":energy==="excited"?"animada":"normal"}. Seu ${skillLabel(weakest)} está com menos prática esta semana.`));
  const suggestions = [
    buildBlocks(parseInt(time,10), weakest, language, energy),
    buildBlocks(parseInt(time,10), "mix", language, energy)
  ];
  suggestions.forEach((s,i) => {
    content.appendChild(renderSuggestionCard({ menu: menuForMinutes(parseInt(time,10)), minutes: parseInt(time,10), skill: s.skill, blocks: s.blocks, method: s.method, title: `Sugestão ${i+1}` }));
  });
  openModal("recommend-modal");
}

/* ============================================================
   BUSCA GLOBAL
============================================================= */
function wireSearch(){
  $("#search-input").addEventListener("input", (e) => renderSearchResults(e.target.value));
}
function renderSearchResults(query){
  const results = $("#search-results");
  results.innerHTML = "";
  const q = query.trim().toLowerCase();
  if (!q) return;
  const matches = [];
  Store.getAll("vocabulary").forEach(v => { if ((v.term+" "+v.translation+" "+(v.tags||[]).join(" ")).toLowerCase().includes(q)) matches.push({ type:"Vocabulário", label:v.term }); });
  Store.getAll("resources").forEach(r => { if ((r.name+" "+(r.tags||[]).join(" ")).toLowerCase().includes(q)) matches.push({ type:"Catálogo", label:r.name }); });
  Store.getAll("courses").forEach(c => { if (c.name.toLowerCase().includes(q)) matches.push({ type:"Curso", label:c.name }); });
  Store.getAll("methods").forEach(m => { if ((m.name+" "+m.concept).toLowerCase().includes(q)) matches.push({ type:"Método", label:m.name }); });
  if (!matches.length) { results.appendChild(el("p", { class:"muted" }, "Nada encontrado.")); return; }
  matches.slice(0,30).forEach(m => results.appendChild(el("div", { class:"search-result-item" }, [
    el("div", { class:"result-type" }, m.type), el("div", {}, m.label)
  ])));
}

})();
