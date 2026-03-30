// ============================================================
//  FIREBASE CONFIGURATION
//  1. Créez un projet sur https://console.firebase.google.com
//  2. Activez Firestore (mode test pour commencer)
//  3. Allez dans Project Settings > General > Your apps > Web
//  4. Copiez votre firebaseConfig et remplacez les valeurs ci-dessous
// ============================================================

const FIREBASE_CONFIG = {
  apiKey:            "VOTRE_API_KEY",
  authDomain:        "VOTRE_PROJECT.firebaseapp.com",
  projectId:         "VOTRE_PROJECT_ID",
  storageBucket:     "VOTRE_PROJECT.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId:             "VOTRE_APP_ID",
};

// ── Init ──────────────────────────────────────────────────────
let db = null;
let firebaseReady = false;

function initFirebase() {
  try {
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    db = firebase.firestore();
    firebaseReady = true;
    console.log("[Firebase] Connecté à Firestore");
  } catch (err) {
    console.error("[Firebase] Erreur d'initialisation :", err);
    firebaseReady = false;
  }
}

// ── Helpers Firestore ─────────────────────────────────────────

async function fsAdd(collection, data) {
  if (!firebaseReady) throw new Error("Firebase non initialisé");
  const ref = await db.collection(collection).add({
    ...data,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

async function fsUpdate(collection, docId, data) {
  if (!firebaseReady) throw new Error("Firebase non initialisé");
  await db.collection(collection).doc(docId).update({
    ...data,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

async function fsDelete(collection, docId) {
  if (!firebaseReady) throw new Error("Firebase non initialisé");
  await db.collection(collection).doc(docId).delete();
}

async function fsGetAll(collection, filters = []) {
  if (!firebaseReady) throw new Error("Firebase non initialisé");
  let query = db.collection(collection);
  for (const [field, op, value] of filters) {
    query = query.where(field, op, value);
  }
  const snap = await query.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Écoute en temps réel
function fsListen(collection, filters, callback) {
  if (!firebaseReady) return () => {};
  let query = db.collection(collection);
  for (const [field, op, value] of filters) {
    query = query.where(field, op, value);
  }
  return query.onSnapshot((snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(docs);
  });
}

function isFirebaseConfigured() {
  return FIREBASE_CONFIG.apiKey !== "VOTRE_API_KEY";
}
