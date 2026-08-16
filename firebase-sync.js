/* ==========================================================================
   firebase-sync.js — Autenticação + sincronização com Firestore
   --------------------------------------------------------------------------
   Este arquivo é o ÚNICO ponto de contato com o Firebase. Ele nunca é
   chamado diretamente pelas telas (app.js) — quem fala com ele é o
   store.js, que decide quando puxar/empurrar dados. Isso mantém a mesma
   separação em camadas do resto do projeto.

   Se `firebase/config.js` não existir (ainda não configurado) ou os
   scripts do Firebase não carregarem, este arquivo simplesmente não ativa
   nada — a plataforma continua funcionando 100% em localStorage, sem erros.

   Requer os SDKs "compat" do Firebase carregados via <script> no index.html
   ANTES deste arquivo (firebase-app-compat.js, firebase-auth-compat.js,
   firebase-firestore-compat.js) e o firebase/config.js definindo
   window.firebaseConfig.
   ========================================================================== */

const FirebaseSync = (() => {
  let app = null, auth = null, db = null;
  let currentUser = null;
  let enabled = false;
  let initialized = false;
  const authListeners = [];

  function init() {
    if (initialized) return;
    initialized = true;

    if (typeof firebase === "undefined") {
      console.info("FirebaseSync: SDK do Firebase não carregado — modo local.");
      return;
    }
    const cfg = window.firebaseConfig;
    if (!cfg || !cfg.apiKey || cfg.apiKey.indexOf("SUA_API_KEY") !== -1) {
      console.info("FirebaseSync: firebase/config.js não configurado ainda — modo local.");
      return;
    }

    try {
      app = firebase.initializeApp(cfg);
      auth = firebase.auth();
      db = firebase.firestore();
      // cache offline do Firestore — ajuda no celular com conexão instável
      db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
      enabled = true;

      auth.onAuthStateChanged(user => {
        currentUser = user;
        authListeners.forEach(cb => cb(user));
      });
    } catch (e) {
      console.warn("FirebaseSync: falha ao iniciar Firebase:", e);
      enabled = false;
    }
  }

  function signInWithGoogle() {
    if (!enabled) return Promise.reject(new Error("Firebase não configurado — veja README.md"));
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider);
  }

  function signOut() {
    return auth ? auth.signOut() : Promise.resolve();
  }

  function isEnabled() { return enabled; }
  function isSignedIn() { return enabled && !!currentUser; }
  function getUser() { return currentUser; }

  /** Chame para ser avisado sempre que o estado de login mudar (inclusive no carregamento inicial). */
  function onAuthChange(cb) {
    authListeners.push(cb);
    if (initialized && enabled) cb(currentUser);
  }

  /** Envia uma coleção inteira para o Firestore (documento único por coleção, por usuário). */
  async function pushCollection(name, data) {
    if (!enabled || !currentUser) return;
    try {
      await db.collection("users").doc(currentUser.uid).collection("data").doc(name).set({
        value: data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {
      console.warn(`FirebaseSync: falha ao sincronizar "${name}":`, e);
    }
  }

  /** Busca todas as coleções salvas no Firestore para o usuário atual. */
  async function pullAll() {
    if (!enabled || !currentUser) return {};
    const result = {};
    const snap = await db.collection("users").doc(currentUser.uid).collection("data").get();
    snap.forEach(doc => { result[doc.id] = doc.data().value; });
    return result;
  }

  return { init, signInWithGoogle, signOut, isEnabled, isSignedIn, getUser, onAuthChange, pushCollection, pullAll };
})();

if (typeof window !== "undefined") window.FirebaseSync = FirebaseSync;
