# Congés Équipe

Application web de gestion des congés, hébergeable sur GitHub Pages.

---

## Structure des fichiers

```
conges-equipe/
├── index.html            ← App employés (saisie + calendrier + liste)
├── manager.html          ← Espace manager (validation des demandes)
├── config/
│   ├── employees.js      ← ✏️  Liste employés & managers (à éditer)
│   └── leaveTypes.js     ← ✏️  Types de congés (à éditer)
├── js/
│   ├── firebase.js       ← ✏️  Config Firebase (à renseigner)
│   ├── users.js          ← Composant utilisateurs & UI helpers
│   ├── calendar.js       ← Composant calendrier mensuel
│   └── leaves.js         ← Logique métier congés
└── css/
    └── style.css         ← Styles globaux
```

---

## 1. Configuration Firebase (base de données)

### Créer le projet

1. Allez sur [console.firebase.google.com](https://console.firebase.google.com)
2. **"Ajouter un projet"** → nommez-le (ex: `conges-equipe`)
3. Désactivez Google Analytics (inutile ici) → **"Créer le projet"**

### Activer Firestore

1. Dans le menu gauche → **Firestore Database**
2. **"Créer une base de données"**
3. Choisissez **"Démarrer en mode test"** (30 jours, suffisant pour commencer)
4. Choisissez la région `europe-west1` (Belgique, la plus proche)

### Récupérer la configuration

1. ⚙️ **Paramètres du projet** (icône engrenage en haut à gauche)
2. Onglet **"Général"** → section **"Vos applications"**
3. Cliquez sur l'icône **`</>`** (Web) → nommez l'app → **"Enregistrer"**
4. Copiez l'objet `firebaseConfig`

### Coller dans le projet

Ouvrez `js/firebase.js` et remplacez :

```js
const FIREBASE_CONFIG = {
  apiKey:            "VOTRE_API_KEY",         // ← remplacer
  authDomain:        "VOTRE_PROJECT.firebaseapp.com",
  projectId:         "VOTRE_PROJECT_ID",
  storageBucket:     "VOTRE_PROJECT.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId:             "VOTRE_APP_ID",
};
```

---

## 2. Ajouter vos employés

Éditez `config/employees.js` :

```js
const MANAGERS = [
  { id: "mgr1", prenom: "Sophie", nom: "Martin", email: "sophie@entreprise.fr" },
];

const EMPLOYEES = [
  { id: "emp1", prenom: "Alice", nom: "Dupont", email: "alice@entreprise.fr", managerId: "mgr1" },
  // Ajoutez autant d'employés que nécessaire...
];
```

> **Règle** : chaque `id` doit être unique. Ne réutilisez jamais un id supprimé.

---

## 3. Modifier les types de congés

Éditez `config/leaveTypes.js` pour ajouter, supprimer ou modifier les types.

---

## 4. Déployer sur GitHub Pages

1. Créez un repository GitHub (ex: `conges-equipe`)
2. Uploadez **tous les fichiers** en conservant l'arborescence
3. **Settings** → **Pages** → Branch: `main` / `/ (root)` → **Save**
4. URL disponible dans ~2 minutes : `https://votre-pseudo.github.io/conges-equipe/`

### Autoriser GitHub Pages dans Firebase

Dans la console Firebase → **Authentication** → **Paramètres** → **Domaines autorisés** :
Ajoutez `votre-pseudo.github.io`

---

## 5. Utilisation

### Employés (`index.html`)
- Onglet **Saisie** : sélectionner l'employé, les dates, le type → soumettre
- Le mail part automatiquement vers le manager (via votre client mail)
- Onglet **Calendrier** : vue mensuelle des congés approuvés
- Onglet **Tous les congés** : liste filtrables par statut/employé

### Managers (`manager.html`)
- Choisir son nom en haut
- Onglet **En attente** : valider ou refuser chaque demande
- Un mail de confirmation part automatiquement à l'employé

---

## Sécurité (optionnel, après les 30 jours de mode test)

Dans **Firestore → Règles**, remplacez par :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conges/{doc} {
      allow read, write: if true; // Pour usage interne uniquement
    }
  }
}
```

Pour une vraie authentification, il faudrait ajouter Firebase Auth (étape suivante si besoin).
