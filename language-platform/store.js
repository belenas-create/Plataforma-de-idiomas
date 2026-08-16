/* ==========================================================================
   store.js — Camada de dados (Storage Abstraction Layer)
   --------------------------------------------------------------------------
   Hoje: tudo é lido/gravado em localStorage.
   Amanhã: quando o Firebase estiver configurado (ver firebase/config.example.js),
   basta implementar os mesmos métodos usando Firestore e trocar
   `Store.backend = "firestore"` — NENHUM outro arquivo precisa mudar,
   porque app.js só fala com `Store`, nunca com localStorage diretamente.

   Coleções (modelo de dados lógico — item #45 do briefing):
     languages, study_sessions, weekly_plans, resources, courses,
     methods, vocabulary, goals, tags, notebooks, settings, badges_unlocked
   ========================================================================== */

const Store = (() => {
  const NAMESPACE = "langplatform_v1";
  const COLLECTIONS = [
    "languages", "studySessions", "weeklyPlans", "resources", "courses",
    "methods", "vocabulary", "vocabularyCategories", "tags", "notebooks",
    "goals", "badgesUnlocked", "settings"
  ];

  let backend = "local"; // "local" | "firestore" (futuro)
  let db = null;         // guarda a instância do localStorage-cache em memória

  function key(collectionName) {
    return `${NAMESPACE}::${collectionName}`;
  }

  function loadCollection(name) {
    try {
      const raw = localStorage.getItem(key(name));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("Store: falha ao ler", name, e);
      return null;
    }
  }

  function persistCollection(name, data) {
    try {
      localStorage.setItem(key(name), JSON.stringify(data));
    } catch (e) {
      console.warn("Store: falha ao salvar", name, e);
    }
  }

  function uid(prefix = "id") {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /* -------------------- inicialização / seed -------------------- */
  function init() {
    db = {};
    const isFirstRun = localStorage.getItem(key("settings")) === null;

    // idiomas
    db.languages = loadCollection("languages") || SEED_DATA.languages;
    // recursos / catálogo
    db.resources = loadCollection("resources") || SEED_DATA.resources;
    // cursos
    db.courses = loadCollection("courses") || SEED_DATA.courses;
    // métodos
    db.methods = loadCollection("methods") || SEED_DATA.methods;
    // vocabulário
    db.vocabulary = loadCollection("vocabulary") || SEED_DATA.vocabulary;
    db.vocabularyCategories = loadCollection("vocabularyCategories") || SEED_DATA.vocabularyCategories;
    // tags
    db.tags = loadCollection("tags") || SEED_DATA.tags;
    // notebooks
    db.notebooks = loadCollection("notebooks") || SEED_DATA.notebooks;
    // metas
    db.goals = loadCollection("goals") || SEED_DATA.goals;
    // sessões de estudo (vazio no início — dados reais do usuário)
    db.studySessions = loadCollection("studySessions") || [];
    // plano semanal — chave por weekId (ex: "2026-W33")
    db.weeklyPlans = loadCollection("weeklyPlans") || {};
    // badges já desbloqueadas
    db.badgesUnlocked = loadCollection("badgesUnlocked") || [];
    // configurações do usuário / onboarding
    db.settings = loadCollection("settings") || {
      name: "",
      theme: "light",
      onboardingComplete: false,
      primaryLanguage: "english",
      secondaryLanguage: "spanish",
      weeklyDaysGoal: 4,
      mainObjective: "trabalho",
      prioritySkills: ["speaking", "listening"],
      firebaseConnected: false
    };

    if (isFirstRun) {
      persistAll();
      // semeia a semana atual com o template sugerido (só como exemplo editável)
      const wk = currentWeekId();
      db.weeklyPlans[wk] = JSON.parse(JSON.stringify(SEED_DATA.weeklyPlanTemplate));
      persistCollection("weeklyPlans", db.weeklyPlans);
    }

    return db;
  }

  function persistAll() {
    COLLECTIONS.forEach(name => {
      if (db[name] !== undefined) persistCollection(name, db[name]);
    });
  }

  /* -------------------- helpers de semana -------------------- */
  function currentWeekId(date = new Date()) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }

  /* -------------------- CRUD genérico -------------------- */
  function getAll(collection) {
    return db[collection] || [];
  }

  function getById(collection, id) {
    return (db[collection] || []).find(item => item.id === id) || null;
  }

  function add(collection, item, prefix) {
    if (!item.id) item.id = uid(prefix || collection.slice(0, 3));
    db[collection] = db[collection] || [];
    db[collection].push(item);
    persistCollection(collection, db[collection]);
    return item;
  }

  function update(collection, id, patch) {
    const list = db[collection] || [];
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    persistCollection(collection, list);
    return list[idx];
  }

  function remove(collection, id) {
    db[collection] = (db[collection] || []).filter(i => i.id !== id);
    persistCollection(collection, db[collection]);
  }

  /* -------------------- settings -------------------- */
  function getSettings() {
    return db.settings;
  }
  function updateSettings(patch) {
    db.settings = { ...db.settings, ...patch };
    persistCollection("settings", db.settings);
    return db.settings;
  }

  /* -------------------- planner semanal -------------------- */
  function getWeekPlan(weekId) {
    return db.weeklyPlans[weekId] || {
      monday: [], tuesday: [], wednesday: [], thursday: [],
      friday: [], saturday: [], sunday: []
    };
  }
  function setWeekPlan(weekId, plan) {
    db.weeklyPlans[weekId] = plan;
    persistCollection("weeklyPlans", db.weeklyPlans);
  }
  function addActivityToDay(weekId, day, activity) {
    const plan = getWeekPlan(weekId);
    activity.id = activity.id || uid("act");
    activity.status = activity.status || "planejado";
    plan[day] = plan[day] || [];
    plan[day].push(activity);
    setWeekPlan(weekId, plan);
    return activity;
  }
  function updateActivity(weekId, day, activityId, patch) {
    const plan = getWeekPlan(weekId);
    const list = plan[day] || [];
    const idx = list.findIndex(a => a.id === activityId);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    setWeekPlan(weekId, plan);
    return list[idx];
  }
  function removeActivity(weekId, day, activityId) {
    const plan = getWeekPlan(weekId);
    plan[day] = (plan[day] || []).filter(a => a.id !== activityId);
    setWeekPlan(weekId, plan);
  }
  function moveActivity(weekId, fromDay, toDay, activityId) {
    const plan = getWeekPlan(weekId);
    const idx = (plan[fromDay] || []).findIndex(a => a.id === activityId);
    if (idx === -1) return null;
    const [activity] = plan[fromDay].splice(idx, 1);
    plan[toDay] = plan[toDay] || [];
    plan[toDay].push(activity);
    setWeekPlan(weekId, plan);
    return activity;
  }

  /* -------------------- sessões de estudo -------------------- */
  function logSession(session) {
    session.id = session.id || uid("sess");
    session.date = session.date || new Date().toISOString();
    db.studySessions.push(session);
    persistCollection("studySessions", db.studySessions);
    return session;
  }

  /* -------------------- badges -------------------- */
  function unlockBadge(badgeId) {
    if (!db.badgesUnlocked.includes(badgeId)) {
      db.badgesUnlocked.push(badgeId);
      persistCollection("badgesUnlocked", db.badgesUnlocked);
      return true;
    }
    return false;
  }

  /* -------------------- export/import (backup manual) -------------------- */
  function exportAll() {
    const dump = {};
    COLLECTIONS.forEach(name => dump[name] = db[name]);
    return dump;
  }
  function importAll(dump) {
    COLLECTIONS.forEach(name => {
      if (dump[name] !== undefined) {
        db[name] = dump[name];
        persistCollection(name, db[name]);
      }
    });
  }

  /* -------------------- ponto de integração Firebase (futuro) --------------
     Quando firebase/config.example.js for preenchido e copiado para
     firebase/config.js, um módulo firebase-store.js (a ser criado) pode
     implementar as mesmas assinaturas (getAll, add, update, remove...) usando
     Firestore, e este arquivo passa a delegar chamadas para lá quando
     `backend === "firestore"`. Nenhuma tela precisa mudar.
  --------------------------------------------------------------------------- */
  function isFirebaseConnected() {
    return db.settings && db.settings.firebaseConnected === true;
  }

  return {
    init, persistAll, currentWeekId,
    getAll, getById, add, update, remove,
    getSettings, updateSettings,
    getWeekPlan, setWeekPlan, addActivityToDay, updateActivity, removeActivity, moveActivity,
    logSession, unlockBadge,
    exportAll, importAll,
    isFirebaseConnected,
    uid
  };
})();

if (typeof window !== "undefined") window.Store = Store;
