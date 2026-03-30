// ============================================================
//  FICHIER DE CONFIGURATION DES EMPLOYÉS
//  Éditez ce fichier pour ajouter / modifier / supprimer des employés.
//  Chaque employé doit avoir un id unique (pas de doublons).
// ============================================================

const MANAGERS = [
  {
    id: "mgr1",
    prenom: "Sophie",
    nom: "Martin",
    email: "sophie.martin@entreprise.fr",
  },
  {
    id: "mgr2",
    prenom: "Thomas",
    nom: "Bernard",
    email: "thomas.bernard@entreprise.fr",
  },
];

const EMPLOYEES = [
  // --- Équipe Sophie Martin ---
  {
    id: "emp1",
    prenom: "Alice",
    nom: "Dupont",
    email: "alice.dupont@entreprise.fr",
    managerId: "mgr1",
  },
  {
    id: "emp2",
    prenom: "Marc",
    nom: "Leblanc",
    email: "marc.leblanc@entreprise.fr",
    managerId: "mgr1",
  },
  {
    id: "emp3",
    prenom: "Julie",
    nom: "Rousseau",
    email: "julie.rousseau@entreprise.fr",
    managerId: "mgr1",
  },
  {
    id: "emp4",
    prenom: "Kevin",
    nom: "Moreau",
    email: "kevin.moreau@entreprise.fr",
    managerId: "mgr1",
  },
  // --- Équipe Thomas Bernard ---
  {
    id: "emp5",
    prenom: "Laura",
    nom: "Petit",
    email: "laura.petit@entreprise.fr",
    managerId: "mgr2",
  },
  {
    id: "emp6",
    prenom: "Nicolas",
    nom: "Simon",
    email: "nicolas.simon@entreprise.fr",
    managerId: "mgr2",
  },
  {
    id: "emp7",
    prenom: "Emma",
    nom: "Laurent",
    email: "emma.laurent@entreprise.fr",
    managerId: "mgr2",
  },
];

// Helpers
function getEmployeeById(id) {
  return EMPLOYEES.find((e) => e.id === id) || null;
}

function getManagerById(id) {
  return MANAGERS.find((m) => m.id === id) || null;
}

function getManagerForEmployee(employeeId) {
  const emp = getEmployeeById(employeeId);
  if (!emp) return null;
  return getManagerById(emp.managerId);
}

function getEmployeesByManager(managerId) {
  return EMPLOYEES.filter((e) => e.managerId === managerId);
}

function fullName(person) {
  return `${person.prenom} ${person.nom}`;
}
