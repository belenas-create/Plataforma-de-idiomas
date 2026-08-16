/* ==========================================================================
   speaking.js — Professor IA (aplicativo INDEPENDENTE do dashboard)
   --------------------------------------------------------------------------
   • Usa as APIs nativas do navegador: SpeechRecognition (mic) e
     SpeechSynthesis (voz da IA).
   • Não precisa de Firebase nem sincroniza com o Store do dashboard —
     o histórico fica só no localStorage deste app (item #42 do briefing).
   • PONTO DE INTEGRAÇÃO DE IA REAL: veja `AI_CONFIG` logo abaixo. Sem um
     endpoint configurado, o app roda em "modo simulado" (roteiros +
     regras locais) — isso é dito claramente na tela, nunca escondido.
   • NUNCA coloque uma chave secreta de API aqui. Se/quando você tiver um
     backend, ele deve receber a chave no servidor e este arquivo só chama
     a URL pública do seu endpoint.
   ========================================================================== */

(() => {
"use strict";

/* ============================================================
   PONTO DE INTEGRAÇÃO — IA real (opcional)
   Deixe endpoint === "" para usar o motor simulado local.
   Quando você tiver um backend (proxy seguro guardando a chave da IA),
   preencha a URL abaixo. O app enviará POST { messages, language, level,
   mode, scenario } e espera receber JSON { reply: "texto da IA" }.
============================================================= */
const AI_CONFIG = {
  endpoint: "" // ex: "https://meu-backend.exemplo.com/api/speaking"
};

/* ============================================================
   BANCO DE CENÁRIOS
============================================================= */
function sc(id, name, category, opener, followUps, vocab, role, counterpart){
  return { id, name, category, opener, followUps, vocab, role: role||"", counterpart: counterpart||"" };
}
const SCENARIOS = {
  english: [
    sc("small-talk","Small Talk","cotidiano","Hey! How's your day going so far?", [
      "What do you usually do to relax after work?","Have you watched or read anything good lately?","What are your plans for the weekend?"
    ], ["How's it going?","I've been pretty busy","Not much, just the usual","That sounds nice"]),
    sc("restaurant","Restaurant","cotidiano","Welcome! Table for how many today?", [
      "Can I start you off with something to drink?","Are you ready to order, or do you need a few more minutes?","Would you like to see the dessert menu?"
    ], ["Could I get the menu, please?","I'll have the...","Could we get the check?","Is service included?"]),
    sc("coffee-shop","Coffee shop","cotidiano","Hi, what can I get started for you today?", [
      "For here or to go?","Would you like room for cream?","Anything else with that?"
    ], ["I'll have a...","For here, please","Could I get that with oat milk?","Keep the change"]),
    sc("airport","Airport","cotidiano","Good morning, can I see your passport and boarding pass, please?", [
      "Do you have any bags to check?","Window or aisle seat?","Do you have any liquids in your carry-on?"
    ], ["I'm checking in for my flight","Window seat, please","This is my only bag","What's the gate number?"]),
    sc("hotel","Hotel","cotidiano","Welcome! Do you have a reservation with us?", [
      "Would you like a wake-up call?","Is there anything I can help you with during your stay?","Checkout is at 11 — would you like a late checkout?"
    ], ["I have a reservation under...","Is breakfast included?","Could I get an extra towel?","What time is checkout?"]),
    sc("shopping","Shopping","cotidiano","Hi there! Let me know if you need any help finding something.", [
      "Would you like to try that on?","Do you have a rewards card with us?","Is this a gift? Would you like it wrapped?"
    ], ["Do you have this in a different size?","Where are the fitting rooms?","I'm just browsing, thanks","Do you accept returns?"]),
    sc("travel","Travel","cotidiano","So, where are you thinking of traveling next?", [
      "Have you ever traveled alone?","What's the best trip you've ever taken?","Do you prefer planning everything or being spontaneous?"
    ], ["I'd love to visit...","We're planning a trip to...","I usually travel by...","That's on my bucket list"]),
    sc("friends","Friends","cotidiano","How did you and your best friend meet?", [
      "What do you and your friends usually do together?","Do you find it easy to make new friends as an adult?","Have you kept in touch with old friends?"
    ], ["We met at...","We've been close for...","We usually hang out at...","I really value that friendship"]),
    sc("dating","Dating","cotidiano","What's dating like these days, in your opinion?", [
      "Do you think dating apps make things easier or harder?","What's a green flag for you in a partner?","What's a good first date idea?"
    ], ["I think it's...","A red/green flag for me is...","I'd rather...","It really depends on the person"]),
    sc("weekend","Weekend","cotidiano","Any exciting plans for the weekend?", [
      "Do you prefer relaxing weekends or busy ones?","What did you do last weekend?","Do you have any weekend traditions?"
    ], ["I'm planning to...","Last weekend I...","Nothing special, just...","I'm looking forward to..."]),
    sc("movies","Movies","cotidiano","What's the last movie you watched?", [
      "Do you prefer movies or TV series?","Who's your favorite actor or director?","What genre do you usually go for?"
    ], ["I recently watched...","My favorite genre is...","I'd highly recommend...","I wasn't a big fan of..."]),
    sc("music","Music","cotidiano","What kind of music have you been listening to lately?", [
      "Have you been to any concerts recently?","Do you play any instruments?","What's a song you never get tired of?"
    ], ["I've been listening to...","My go-to genre is...","I saw ... live once","That song is on repeat for me"]),
    sc("hobbies","Hobbies","cotidiano","What do you like to do in your free time?", [
      "How did you get into that hobby?","Is there a hobby you'd like to start?","How much time do you spend on it per week?"
    ], ["I'm really into...","I got into it because...","I'd love to try...","I don't get much time for it lately"]),
    sc("daily-routine","Daily routine","cotidiano","Walk me through a typical day for you.", [
      "What time do you usually wake up?","What's the best part of your day?","Is there anything you'd like to change about your routine?"
    ], ["I usually wake up at...","My mornings are pretty...","By the end of the day I'm...","I try to..."]),

    sc("customer-service","Customer Service","trabalho","Hello, thank you for contacting our customer service. How can I help you today?", [
      "I understand — let me check the status of your shipment right now.","Could you confirm your booking or container number?","I'm really sorry for the inconvenience. Let me see what I can do."
    ], ["shipment","booking","tracking number","I'd like to follow up on..."], "Customer Service Agent","Customer"),
    sc("pricing","Pricing","trabalho","Hi, I'd like to request a quotation for a shipment. Can you help me?", [
      "It's a 40' container from Shanghai to Santos — what would the rate be?","What about the transit time and free time?","Are there any surcharges I should be aware of?"
    ], ["quotation","rate","surcharge","free time"], "Pricing Analyst","Customer"),
    sc("import","Import","trabalho","We have a shipment arriving next week — can you walk me through the import process?", [
      "What documents do we need for customs clearance?","How long does customs usually take at this port?","Who arranges the delivery to our warehouse?"
    ], ["customs clearance","import license","warehouse","delivery"], "Import Analyst","Client"),
    sc("export","Export","trabalho","We need to export a shipment to Europe — what's the process?", [
      "What Incoterm would you recommend for this shipment?","Do we need any export license for this product?","When does the vessel depart?"
    ], ["Incoterm","export license","vessel","departure"], "Export Analyst","Client"),
    sc("fcl","FCL","trabalho","We'd like to book an FCL shipment — can you help with the details?", [
      "How many containers do you need, and what size?","What's the cargo ready date?","Do you need door delivery or port-to-port?"
    ], ["FCL","container","cargo ready date","door delivery"], "Forwarder","Client"),
    sc("logistics","Logistics","trabalho","I need to plan the logistics for a large shipment — can we go over it?", [
      "What's the transit time we're working with?","Do we have enough free time at destination?","Who's handling the last-mile delivery?"
    ], ["transit time","free time","last-mile delivery","warehouse"], "Logistics Coordinator","Client"),
    sc("customer-complaint","Customer complaint","trabalho","I'm calling because our shipment is three days late and no one told us.", [
      "This is affecting our production schedule — what can you do about it?","Can you at least waive the demurrage charges?","I'd like a written explanation for our records."
    ], ["delay","demurrage","compensation","written explanation"], "Customer","Customer Service Agent"),
    sc("negotiation","Negotiation","trabalho","Your rate is higher than another forwarder's offer — can you do better?", [
      "What if we commit to a higher volume?","Can you match $50 less per container?","What extra value can you offer instead of a discount?"
    ], ["rate", "volume commitment","discount","value-added service"], "Customer","Sales"),
    sc("quotation","Quotation","trabalho","Could you send me a quotation for 5 containers, FOB Shanghai?", [
      "Can you break down the freight and local charges separately?","How long is this quotation valid for?","Does this include insurance?"
    ], ["FOB","breakdown","validity","insurance"], "Customer","Pricing Analyst"),
    sc("meeting","Meeting","trabalho","Let's start the meeting — can you give us a status update on the shipment?", [
      "What's blocking us from meeting the deadline?","What do you need from our side to move forward?","Let's set a follow-up date to check progress."
    ], ["status update","blocker","deadline","follow-up"], "Team member","Manager"),
    sc("email-followup","Email follow-up","trabalho","I'm following up on the email I sent last week about the quotation.", [
      "Have you had a chance to review the proposal?","Do you need any additional information from us?","When can we expect a decision?"
    ], ["follow up","proposal","additional information","decision"], "Customer","Sales"),
    sc("phone-call","Phone call","trabalho","Hi, this is regarding booking number BK-4521 — do you have a moment?", [
      "I need to confirm the vessel schedule for this booking.","Can we change the cargo ready date?","Could you send me written confirmation after this call?"
    ], ["booking number","vessel schedule","cargo ready date","confirmation"], "Customer","Operations"),
    sc("shipment-delay","Shipment delay","trabalho","I need to inform you that your shipment will be delayed by about 5 days.", [
      "It's due to a vessel rollover at the transshipment port.","We can offer a partial waiver on demurrage as a gesture of goodwill.","I'll send you the updated ETA as soon as it's confirmed."
    ], ["rollover","transshipment","ETA","goodwill"], "Operations","Customer"),
    sc("booking","Booking","trabalho","I'd like to make a booking for next month — what do you need from me?", [
      "What's your cargo ready date and the commodity?","Do you need a specific vessel or is any sailing fine?","I'll send the booking confirmation once it's issued."
    ], ["booking confirmation","cargo ready date","commodity","sailing"], "Customer","Booking Agent"),
    sc("rate-negotiation","Rate negotiation","trabalho","We've been a loyal customer for two years — can we revisit our rates?", [
      "Our volume has grown 30% this year — that should count for something.","What would it take to get a better rate for Q3?","Can we lock this rate in for 6 months?"
    ], ["loyal customer","volume growth","lock-in rate","Q3"], "Customer","Pricing Analyst")
  ],
  spanish: [
    sc("small-talk","Small Talk","cotidiano","¡Hola! ¿Cómo estás hoy? (Oi! Como você está hoje?)", [
      "¿Qué haces normalmente los fines de semana? (O que você costuma fazer nos fins de semana?)",
      "¿Te gusta tu trabajo? (Você gosta do seu trabalho?)",
      "¿Qué planes tienes para hoy? (Quais são seus planos para hoje?)"
    ], ["Hola, ¿cómo estás?","Muy bien, ¿y tú?","Más o menos","Nos vemos luego"]),
    sc("restaurant","Restaurant","cotidiano","¡Bienvenido! ¿Mesa para cuántas personas? (Mesa para quantas pessoas?)", [
      "¿Qué desea para tomar? (O que deseja para beber?)",
      "¿Ya sabe qué va a pedir? (Já sabe o que vai pedir?)",
      "¿Le traigo la cuenta? (Trago a conta?)"
    ], ["Quisiera...","La cuenta, por favor","Está delicioso","¿Aceptan tarjeta?"]),
    sc("travel","Travel","cotidiano","¿A dónde te gustaría viajar próximamente? (Para onde você gostaria de viajar em breve?)", [
      "¿Prefieres la playa o la montaña? (Prefere praia ou montanha?)",
      "¿Viajas solo o acompañado? (Viaja sozinho ou acompanhado?)",
      "¿Cuál fue tu último viaje? (Qual foi sua última viagem?)"
    ], ["Me gustaría visitar...","Viajo en...","¿Cuánto cuesta el boleto?","Es un lugar hermoso"])
  ]
};
const GENERIC_FOLLOWUPS = {
  english: [
    "That's interesting — can you tell me more about that?",
    "Why do you think that is?",
    "How did that make you feel?",
    "What would you do differently next time?",
    "Can you give me an example?"
  ],
  spanish: [
    "Qué interesante — ¿me puedes contar más? (Que interessante — pode me contar mais?)",
    "¿Por qué crees que es así? (Por que você acha que é assim?)",
    "¿Puedes darme un ejemplo? (Pode me dar um exemplo?)"
  ]
};

/* Pequeno dicionário de correções comuns (ilustrativo — não é NLP real) */
const CORRECTION_PATTERNS = {
  english: [
    { re: /\bi am agree\b/i, fix: "I agree", tip: "Use 'I agree', not 'I am agree' — 'agree' is already a verb." },
    { re: /\bsince (\d+) (years|months)\b/i, fix: "for $1 $2", tip: "Use 'for' with a duration, and 'since' with a starting point (e.g., 'since 2020')." },
    { re: /\bpeople is\b/i, fix: "people are", tip: "'People' is plural, so use 'are'." },
    { re: /\bi have (\d+) years\b/i, fix: "I am $1 years old", tip: "To talk about age, use 'I am ... years old', not 'I have'." },
    { re: /\bmake a party\b/i, fix: "have a party", tip: "In English we usually 'have' a party, not 'make' one." }
  ],
  spanish: [
    { re: /\btengo (\d+) años de edad\b/i, fix: "tengo $1 años", tip: "'tengo ... años' ya es suficiente, no necesitas 'de edad'." }
  ]
};

/* ============================================================
   ESTADO
============================================================= */
const state = {
  language: "english",
  level: "auto",
  mode: "fluency",
  conversationMode: "livre",
  scenario: null,
  turnIndex: 0,
  messages: [], // {role: 'teacher'|'student', text, ts, correction?}
  corrections: [],
  usedVoiceCount: 0,
  recognizing: false
};

/* ============================================================
   HELPERS DOM
============================================================= */
function $(sel){ return document.querySelector(sel); }
function el(tag, attrs={}, children=[]){
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
    if (k==="class") e.className = v;
    else if (k==="html") e.innerHTML = v;
    else if (k.startsWith("on") && typeof v==="function") e.addEventListener(k.slice(2), v);
    else e.setAttribute(k,v);
  });
  (Array.isArray(children)?children:[children]).forEach(c => { if (c!=null) e.appendChild(typeof c==="string"?document.createTextNode(c):c); });
  return e;
}
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }

/* ============================================================
   INICIALIZAÇÃO
============================================================= */
document.addEventListener("DOMContentLoaded", () => {
  populateLanguageSelect();
  prefillLevelFromDashboard();
  populateVoices();
  wireSetup();
  wireChat();
  pickRandomScenario();
});

function populateLanguageSelect(){
  const sel = $("#cfg-language");
  sel.innerHTML = "";
  const langs = [{id:"english",name:"English",flag:"🇺🇸"},{id:"spanish",name:"Español",flag:"🇪🇸"}];
  // tenta ler idiomas cadastrados no dashboard (mesmo domínio) — apenas leitura, sem escrever nada de volta
  try {
    const raw = localStorage.getItem("langplatform_v1::languages");
    if (raw) {
      const stored = JSON.parse(raw);
      if (Array.isArray(stored) && stored.length) {
        sel.innerHTML = "";
        stored.forEach(l => sel.appendChild(el("option", { value:l.id }, `${l.flag} ${l.name}`)));
        state.language = stored.find(l=>l.status==="primary")?.id || stored[0].id;
        return;
      }
    }
  } catch(e){ /* modo standalone, sem problema */ }
  langs.forEach(l => sel.appendChild(el("option", { value:l.id }, `${l.flag} ${l.name}`)));
}
function prefillLevelFromDashboard(){
  try {
    const raw = localStorage.getItem("langplatform_v1::languages");
    if (!raw) return;
    const stored = JSON.parse(raw);
    const lang = stored.find(l => l.id === $("#cfg-language").value);
    if (lang) state.levelFromDashboard = lang.level;
  } catch(e){}
}

/* ============================================================
   CONFIGURAÇÃO (topo)
============================================================= */
function wireSetup(){
  $("#cfg-language").addEventListener("change", (e) => { state.language = e.target.value; prefillLevelFromDashboard(); pickRandomScenario(); });
  $("#cfg-level").addEventListener("change", (e) => state.level = e.target.value);
  $("#cfg-mode").addEventListener("change", (e) => state.mode = e.target.value);
  $("#cfg-conversation-mode").addEventListener("change", (e) => { state.conversationMode = e.target.value; applyConversationModePreset(); });
  $("#btn-new-scenario").addEventListener("click", pickRandomScenario);
  $("#btn-challenge").addEventListener("click", () => { state.mode = "challenge"; $("#cfg-mode").value = "challenge"; pickChallengeScenario(); });
  $("#btn-start-conversation").addEventListener("click", startConversation);
}
function applyConversationModePreset(){
  if (state.conversationMode === "survival-spanish") { state.language = "spanish"; $("#cfg-language").value = "spanish"; state.level = "A0"; $("#cfg-level").value = "A0"; }
  if (state.conversationMode === "business") pickRandomScenario("trabalho");
  if (state.conversationMode === "small-talk") setScenarioById("small-talk");
}
function scenarioPool(category){
  const list = SCENARIOS[state.language] || SCENARIOS.english;
  return category ? list.filter(s => s.category === category) : list;
}
function pickRandomScenario(forceCategory){
  const pool = scenarioPool(forceCategory);
  state.scenario = pool[Math.floor(Math.random()*pool.length)] || scenarioPool()[0];
  state.turnIndex = 0;
  $("#scenario-label").textContent = `Cenário: ${state.scenario.name}`;
}
function pickChallengeScenario(){
  const pool = scenarioPool("trabalho").length ? scenarioPool("trabalho") : scenarioPool();
  state.scenario = pool[Math.floor(Math.random()*pool.length)];
  state.turnIndex = 0;
  $("#scenario-label").textContent = `🔥 Challenge: ${state.scenario.name}`;
}
function setScenarioById(id){
  const found = scenarioPool().find(s => s.id === id);
  if (found) { state.scenario = found; state.turnIndex = 0; $("#scenario-label").textContent = `Cenário: ${found.name}`; }
}

/* ============================================================
   VOZ — SpeechSynthesis
============================================================= */
let voices = [];
function populateVoices(){
  const load = () => {
    voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    const sel = $("#voice-select");
    sel.innerHTML = "";
    voices.forEach((v,i) => sel.appendChild(el("option", { value:i }, `${v.name} (${v.lang})`)));
  };
  if (window.speechSynthesis) {
    load();
    window.speechSynthesis.onvoiceschanged = load;
  } else {
    $("#voice-select").appendChild(el("option", {}, "Síntese de voz não suportada neste navegador"));
  }
}
function speak(text){
  if (!window.speechSynthesis) { toastLike("Este navegador não suporta síntese de voz."); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(stripParenthetical(text));
  const idx = $("#voice-select").value;
  if (voices[idx]) utter.voice = voices[idx];
  utter.lang = state.language === "spanish" ? "es-ES" : "en-US";
  utter.rate = parseFloat($("#voice-rate").value) || 1;
  window.speechSynthesis.speak(utter);
}
function stripParenthetical(text){ return text.replace(/\([^)]*\)/g, "").trim(); }

/* ============================================================
   MICROFONE — SpeechRecognition
============================================================= */
let recognition = null;
function getRecognition(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  if (recognition) return recognition;
  recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    state.usedVoiceCount++;
    handleStudentMessage(text);
  };
  recognition.onerror = () => { setMicState(false); toastLike("Não consegui te ouvir — tente novamente ou digite."); };
  recognition.onend = () => setMicState(false);
  return recognition;
}
function setMicState(recording){
  state.recognizing = recording;
  $("#btn-mic").classList.toggle("recording", recording);
  $("#btn-mic").textContent = recording ? "⏺️ Ouvindo..." : "🎙️ Falar";
}
function toggleMic(){
  const rec = getRecognition();
  if (!rec) { toastLike("Seu navegador não suporta reconhecimento de voz — use o campo de texto abaixo."); return; }
  if (state.recognizing) { rec.stop(); setMicState(false); return; }
  rec.lang = state.language === "spanish" ? "es-ES" : "en-US";
  try { rec.start(); setMicState(true); } catch(e){ /* já iniciado */ }
}

/* ============================================================
   CHAT
============================================================= */
function wireChat(){
  $("#btn-mic").addEventListener("click", toggleMic);
  $("#btn-listen").addEventListener("click", () => {
    const last = [...state.messages].reverse().find(m => m.role === "teacher");
    if (last) speak(last.text);
  });
  $("#btn-stop-audio").addEventListener("click", () => window.speechSynthesis && window.speechSynthesis.cancel());
  $("#text-fallback-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#text-fallback-input");
    if (!input.value.trim()) return;
    handleStudentMessage(input.value.trim());
    input.value = "";
  });
  $("#btn-help").addEventListener("click", showHelp);
  $("#btn-close-help").addEventListener("click", () => $("#help-panel").hidden = true);
  $("#btn-end-conversation").addEventListener("click", endConversation);
  $("#btn-new-conversation").addEventListener("click", () => window.location.reload());
}

function startConversation(){
  state.messages = []; state.corrections = []; state.turnIndex = 0; state.usedVoiceCount = 0;
  $("#setup-screen").hidden = true;
  $("#chat-screen").hidden = false;
  $("#feedback-screen").hidden = true;
  const opener = state.conversationMode === "entrevista"
    ? `Let's do a mock interview about ${state.scenario.name}. Tell me a bit about yourself to start.`
    : state.conversationMode === "debate"
      ? `Let's debate! Topic: ${state.scenario.name}. I'll share a viewpoint, and I want to hear yours.`
      : state.scenario.opener;
  addMessage("teacher", (state.scenario.role ? `[Roleplay — I'm the ${state.scenario.counterpart||"other person"}, you're the ${state.scenario.role}] ` : "") + opener);
  speak(opener);
}

function addMessage(role, text, correction){
  const msg = { role, text, ts: Date.now(), correction };
  state.messages.push(msg);
  renderMessages();
}
function renderMessages(){
  const win = $("#chat-window");
  win.innerHTML = "";
  state.messages.forEach(m => {
    const bubble = el("div", { class:`msg ${m.role}` }, m.text);
    if (m.correction) bubble.appendChild(el("span", { class:"correction" }, `💡 ${m.correction}`));
    win.appendChild(bubble);
  });
  win.scrollTop = win.scrollHeight;
}

async function handleStudentMessage(text){
  let correction = null;
  if (state.mode === "correction" || state.mode === "teacher") {
    correction = checkCorrections(text);
    if (correction) state.corrections.push(correction);
  }
  addMessage("student", text, correction ? (state.mode === "teacher" ? correction.tip : `Better: "${correction.fix}"`) : null);

  const reply = await getAIResponse();
  addMessage("teacher", reply);
  speak(reply);
}

function checkCorrections(text){
  const patterns = CORRECTION_PATTERNS[state.language] || [];
  for (const p of patterns) {
    if (p.re.test(text)) return { fix: text.replace(p.re, p.fix), tip: p.tip };
  }
  return null;
}

/* ---------- Motor de resposta: IA real (se configurada) ou simulada ---------- */
async function getAIResponse(){
  if (AI_CONFIG.endpoint) {
    try {
      const res = await fetch(AI_CONFIG.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: state.messages.map(m => ({ role: m.role, text: m.text })),
          language: state.language, level: state.level, mode: state.mode,
          conversationMode: state.conversationMode, scenario: state.scenario?.id
        })
      });
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      if (data && data.reply) return data.reply;
      throw new Error("resposta sem 'reply'");
    } catch (err) {
      console.warn("Falha ao chamar endpoint de IA configurado, caindo para modo simulado:", err);
      return simulateReply();
    }
  }
  return simulateReply();
}
function simulateReply(){
  state.turnIndex++;
  const scenario = state.scenario;
  const followUps = scenario.followUps || [];
  if (state.turnIndex-1 < followUps.length) return followUps[state.turnIndex-1];
  const generic = GENERIC_FOLLOWUPS[state.language] || GENERIC_FOLLOWUPS.english;
  return generic[Math.floor(Math.random()*generic.length)];
}

/* ---------- Ajuda (Help) ---------- */
function showHelp(){
  const content = $("#help-content");
  content.innerHTML = "";
  const vocab = state.scenario.vocab || [];
  content.appendChild(el("h4",{}, "Vocabulário útil para este cenário"));
  content.appendChild(el("ul",{}, vocab.map(v => el("li",{},v))));
  content.appendChild(el("h4",{}, "Sugestão de resposta (tente adaptar, não só copiar!)"));
  content.appendChild(el("p",{}, vocab[0] ? `Try starting with: "${vocab[0]}..."` : "Try answering with a full sentence, not just yes/no."));
  $("#help-panel").hidden = false;
}
function toastLike(msg){
  const content = $("#help-content");
  $("#help-panel").hidden = false;
  content.innerHTML = "";
  content.appendChild(el("p",{},msg));
}

/* ============================================================
   FEEDBACK FINAL
============================================================= */
function endConversation(){
  if (!state.messages.length) { window.location.reload(); return; }
  const feedback = computeFeedback();
  renderFeedback(feedback);
  saveHistory(feedback);
  $("#chat-screen").hidden = true;
  $("#feedback-screen").hidden = false;
}

function computeFeedback(){
  const studentMsgs = state.messages.filter(m => m.role === "student");
  const words = studentMsgs.flatMap(m => m.text.trim().split(/\s+/)).filter(Boolean);
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^\wà-úñ]/gi,""))).size;
  const avgLen = studentMsgs.length ? words.length/studentMsgs.length : 0;

  const responseTimes = [];
  for (let i=1;i<state.messages.length;i++){
    if (state.messages[i].role==="student" && state.messages[i-1].role==="teacher") {
      responseTimes.push((state.messages[i].ts - state.messages[i-1].ts)/1000);
    }
  }
  const avgResponseTime = responseTimes.length ? responseTimes.reduce((a,b)=>a+b,0)/responseTimes.length : 15;

  const fluency = clamp(Math.round(58 + avgLen*3 - Math.min(avgResponseTime,30)*0.7), 20, 98);
  const vocabulary = clamp(Math.round(48 + uniqueWords*2.2), 20, 98);
  const grammar = clamp(Math.round(90 - state.corrections.length*7), 30, 98);
  const pronunciation = clamp(Math.round(50 + (state.usedVoiceCount/Math.max(1,studentMsgs.length))*40), 20, 95);
  const comprehension = clamp(Math.round(58 + avgLen*2.2), 20, 97);
  const confidence = clamp(Math.round(68 - Math.min(avgResponseTime,25)*1.1 + avgLen), 20, 98);

  const goodPoints = [];
  if (studentMsgs.length >= 4) goodPoints.push("Você manteve a conversa fluindo por vários turnos — isso é ótimo para consistência.");
  if (state.usedVoiceCount > 0) goodPoints.push("Você usou o microfone — praticar em voz alta é o que mais desenvolve speaking real.");
  if (avgLen > 6) goodPoints.push("Suas respostas tiveram um bom tamanho, não só sim/não.");
  if (!goodPoints.length) goodPoints.push("Você começou a conversa — o primeiro passo é o mais importante.");

  const improvePoints = [];
  if (avgLen < 5) improvePoints.push("Tente dar respostas um pouco mais longas, com uma frase completa.");
  if (state.usedVoiceCount === 0) improvePoints.push("Na próxima, tente usar o microfone em vez de digitar — isso treina pronúncia de verdade.");
  if (state.corrections.length > 2) improvePoints.push("Revise os padrões de erro apontados abaixo — eles se repetem.");
  if (!improvePoints.length) improvePoints.push("Continue assim e tente cenários um pouco mais desafiadores da próxima vez.");

  const phrases = studentMsgs.slice(-5).map(m => m.text);
  const vocabNew = (state.scenario.vocab || []).slice(0,5);
  const errors = state.corrections.slice(0,5).map(c => `${c.tip}`);
  const challenge = state.mode === "challenge"
    ? "Repita este mesmo cenário no modo Correction para revisar os erros com mais atenção."
    : `Na próxima conversa, tente o cenário "${(scenarioPool().find(s=>s.id!==state.scenario.id)||{name:"outro tema"}).name}" no modo Challenge.`;

  return { fluency, vocabulary, grammar, pronunciation, comprehension, confidence, goodPoints, improvePoints, phrases, vocabNew, errors, challenge };
}

function renderFeedback(f){
  const metrics = $("#feedback-metrics");
  metrics.innerHTML = "";
  [["Fluency",f.fluency],["Vocabulary",f.vocabulary],["Grammar",f.grammar],["Pronunciation",f.pronunciation],["Comprehension",f.comprehension],["Confidence",f.confidence]]
    .forEach(([label,val]) => metrics.appendChild(el("div",{class:"metric-card"},[ el("div",{class:"metric-value"}, `${val}%`), el("div",{}, label) ])));
  $("#feedback-good").innerHTML = ""; f.goodPoints.forEach(p => $("#feedback-good").appendChild(el("li",{},p)));
  $("#feedback-improve").innerHTML = ""; f.improvePoints.forEach(p => $("#feedback-improve").appendChild(el("li",{},p)));
  $("#feedback-phrases").innerHTML = ""; (f.phrases.length?f.phrases:["Nenhuma frase registrada."]).forEach(p => $("#feedback-phrases").appendChild(el("li",{},p)));
  $("#feedback-vocab").innerHTML = ""; (f.vocabNew.length?f.vocabNew:["—"]).forEach(v => $("#feedback-vocab").appendChild(el("li",{},v)));
  $("#feedback-errors").innerHTML = ""; (f.errors.length?f.errors:["Nenhum erro relevante identificado neste modo/conversa."]).forEach(e => $("#feedback-errors").appendChild(el("li",{},e)));
  $("#feedback-challenge").textContent = f.challenge;
}

/* ---------- Histórico local (independente do dashboard) ---------- */
function saveHistory(feedback){
  try {
    const key = "speaking_history_v1";
    const history = JSON.parse(localStorage.getItem(key) || "[]");
    history.push({
      date: new Date().toISOString(), language: state.language, scenario: state.scenario.name,
      mode: state.mode, conversationMode: state.conversationMode, messageCount: state.messages.length, feedback
    });
    localStorage.setItem(key, JSON.stringify(history.slice(-100)));
  } catch(e){ console.warn("Não foi possível salvar histórico local do Professor IA", e); }
}

})();
