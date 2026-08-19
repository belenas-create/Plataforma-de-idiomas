/* ==========================================================================
   store.js — Camada de dados (Storage Abstraction Layer)
   --------------------------------------------------------------------------
   localStorage é sempre a cópia local/offline. Quando o Firebase está
   configurado E o usuário está logado (via firebase-sync.js), toda escrita
   também é replicada no Firestore, e no login a cópia do Firestore é
   puxada e sobrescreve a local — assim o mesmo usuário vê os mesmos dados
   em qualquer aparelho. Sem login, ou sem Firebase configurado, tudo
   continua funcionando 100% localmente, sem nenhum erro.

   NENHUMA outra tela fala com localStorage ou com o Firestore diretamente
   — tudo passa por este arquivo.

   Coleções (modelo de dados lógico — item #45 do briefing):
     languages, study_sessions, weekly_plans, resources, courses,
     methods, notes, goals, tags, notebooks, settings, badges_unlocked
   ========================================================================== */

const Store = (() => {
  const NAMESPACE = "langplatform_v1";
  const COLLECTIONS = [
    "languages", "studySessions", "weeklyPlans", "resources", "courses",
    "methods", "notes", "tags", "notebooks",
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

  function persistCollection(name, data, opts = {}) {
    try {
      localStorage.setItem(key(name), JSON.stringify(data));
    } catch (e) {
      console.warn("Store: falha ao salvar", name, e);
    }
    // replica pro Firestore em segundo plano (não bloqueia a UI) — só se
    // estiver logada e não for uma escrita que já veio do próprio Firestore
    if (!opts.skipRemote && typeof window !== "undefined" && window.FirebaseSync && window.FirebaseSync.isSignedIn()) {
      window.FirebaseSync.pushCollection(name, data);
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
    // caderno de anotações (gramática, dicas — vocabulário fica no Anki, fora da plataforma)
    db.notes = loadCollection("notes") || SEED_DATA.notes || [];
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
    migrateWeeklyPlanIds();
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

  /* -------------------- migração: atividades sem id --------------------
     Versões antigas do template semanal semeavam atividades sem `id`.
     Isso quebrava silenciosamente editar/excluir (o campo virava a string
     "undefined" no formulário, que não batia com nenhum id real). Aqui a
     gente conserta qualquer atividade já salva (local ou vinda da nuvem)
     que ainda esteja sem id, uma única vez. */
  function migrateWeeklyPlanIds() {
    if (!db.weeklyPlans) return;
    let changed = false;
    Object.keys(db.weeklyPlans).forEach(weekId => {
      const plan = db.weeklyPlans[weekId];
      if (!plan) return;
      Object.keys(plan).forEach(day => {
        (plan[day] || []).forEach(act => {
          if (act && !act.id) {
            act.id = uid("act");
            changed = true;
          }
        });
      });
    });
    if (changed) persistCollection("weeklyPlans", db.weeklyPlans);
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

  /* -------------------- sincronização com Firebase -------------------- */
  function isFirebaseConnected() {
    return typeof window !== "undefined" && !!window.FirebaseSync && window.FirebaseSync.isSignedIn();
  }
  function isFirebaseConfigured() {
    return typeof window !== "undefined" && !!window.FirebaseSync && window.FirebaseSync.isEnabled();
  }

  /**
   * Chamado (por app.js) sempre que o login muda para "logada".
   * Se já existem dados na nuvem, eles substituem os locais (a nuvem manda).
   * Se é o primeiro login (nuvem vazia), os dados locais atuais sobem.
   * Retorna true se puxou dados existentes da nuvem, false se subiu os locais.
   */
  async function syncFromFirebase() {
    if (!window.FirebaseSync || !window.FirebaseSync.isSignedIn()) return false;
    const remote = await window.FirebaseSync.pullAll();
    const hasRemoteData = Object.keys(remote).length > 0;

    if (hasRemoteData) {
      COLLECTIONS.forEach(name => {
        if (remote[name] !== undefined) {
          db[name] = remote[name];
          persistCollection(name, db[name], { skipRemote: true });
        }
      });
      // conserta (e re-sincroniza) qualquer atividade antiga vinda da nuvem sem id
      migrateWeeklyPlanIds();
    } else {
      await pushAllToFirebase();
    }
    return hasRemoteData;
  }

  async function pushAllToFirebase() {
    if (!window.FirebaseSync || !window.FirebaseSync.isSignedIn()) return;
    for (const name of COLLECTIONS) {
      if (db[name] !== undefined) await window.FirebaseSync.pushCollection(name, db[name]);
    }
  }

  return {
    init, persistAll, currentWeekId,
    getAll, getById, add, update, remove,
    getSettings, updateSettings,
    getWeekPlan, setWeekPlan, addActivityToDay, updateActivity, removeActivity, moveActivity,
    logSession, unlockBadge,
    exportAll, importAll,
    isFirebaseConnected, isFirebaseConfigured, syncFromFirebase, pushAllToFirebase,
    uid
  };
})();

if (typeof window !== "undefined") window.Store = Store;
