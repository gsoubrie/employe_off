// ============================================================
//  FICHIER DE CONFIGURATION DES EMPLOYÉS
//  Éditez ce fichier pour ajouter / modifier / supprimer des employés.
//  Chaque employé doit avoir un id unique (pas de doublons).
// ============================================================

const MANAGERS = [
  {
    id: "GSOU",
    prenom: "Grégoire",
    nom: "Soubrié",
    email: "g.soubrie@shinken-solutions.com",
  }
];

const EMPLOYEES = [
  {
    id: "GSOU_2",
    prenom: "Grégoire",
    nom: "Soubrié",
    email: "g.soubrie@shinken-solutions.com",
    managerId: "GSOU",
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
