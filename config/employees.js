// ============================================================
//  FICHIER DE CONFIGURATION DES EMPLOYÉS
//  Éditez ce fichier pour ajouter / modifier / supprimer des employés.
//  Chaque employé doit avoir un id unique (pas de doublons).
// ============================================================

const MANAGERS = [
  //{
  //  id: "JROY",
  //  prenom: "Joachim",
  //  nom: "Roy",
  //  email: "j.roy@shinken-solutions.com",
  //},
  {
    id: "GSOU",
    prenom: "Grégoire",
    nom: "Soubrié",
    email: "g.soubrie@shinken-solutions.com",
  },
  //{
  //  id: "BMAR",
  //  prenom: "Benjamin",
  //  nom: "Martin",
  //  email: "b.martin@shinken-solutions.com",
  //},
  //{
  //  id: "MLUC",
  //  prenom: "Mathéo",
  //  nom: "Lucak",
  //  email: "m.lucak@shinken-solutions.com",
  //},
];

const EMPLOYEES = [
  { id: "JROY",  prenom: "Joachim",       nom: "Roy",              email: "j.roy@shinken-solutions.com",            managerId: "JROY" },
  { id: "GSOU",  prenom: "Grégoire",      nom: "Soubrié",          email: "g.soubrie@shinken-solutions.com",        managerId: "GSOU" },
  { id: "BMAR",  prenom: "Benjamin",      nom: "Martin",           email: "b.martin@shinken-solutions.com",         managerId: "BMAR" },
  { id: "BMOU",  prenom: "Bastien",       nom: "Mourgues",         email: "b.mourgues@shinken-solutions.com",       managerId: "BMAR" },
  { id: "QSOU",  prenom: "Quentin",       nom: "Soubeyrol",        email: "q.soubeyrol@shinken-solutions.com",      managerId: "GSOU" },
  { id: "BLAB",  prenom: "Bastien",       nom: "Labouche",         email: "b.labouche@shinken-solutions.com",       managerId: "BMAR" },
  { id: "PMON",  prenom: "Paul",          nom: "Montassier",       email: "p.montassier@shinken-solutions.com",     managerId: "BMAR" },
  { id: "CPOU",  prenom: "Clément",       nom: "Pouilloux",        email: "c.pouilloux@shinken-solutions.com",      managerId: "GSOU" },
  { id: "TKHE",  prenom: "Thomas",        nom: "Khédim",           email: "t.khedim@shinken-solutions.com",         managerId: "GSOU" },
  { id: "MLUC",  prenom: "Mathéo",        nom: "Lucak",            email: "m.lucak@shinken-solutions.com",          managerId: "MLUC" },
  { id: "FCLA",  prenom: "Françis",       nom: "Claricia",         email: "f.claricia@shinken-solutions.com",       managerId: "BMAR" },
  { id: "CVIC",  prenom: "César",         nom: "Victor",           email: "c.victor@shinken-solutions.com",         managerId: "MLUC" },
  { id: "SDUR",  prenom: "Sami",          nom: "Durand",           email: "s.durand@shinken-solutions.com",         managerId: "GSOU" },
  { id: "LPOR",  prenom: "Lukas",         nom: "Portier",          email: "l.portier@shinken-solutions.com",        managerId: "BMAR" },
  { id: "LVEL",  prenom: "Lucas",         nom: "Vellin-Patche",    email: "l.vellin-patche@shinken-solutions.com",  managerId: "GSOU" },
  { id: "CDAV",  prenom: "Chloé",         nom: "David",            email: "c.david@shinken-solutions.com",          managerId: "BMAR" },
  { id: "NLEM",  prenom: "Nathan",        nom: "Lemoule Duparc",   email: "n.lemoule-duparc@shinken-solutions.com", managerId: "GSOU" },
  { id: "JCOR",  prenom: "Jason",         nom: "Corso",            email: "j.corso@shinken-solutions.com",          managerId: "MLUC" },
  { id: "AFRE",  prenom: "Alexis",        nom: "Frère",            email: "a.frere@shinken-solutions.com",          managerId: "JROY" },
  { id: "ARUB",  prenom: "Alrick",        nom: "Rubio",            email: "a.rubio@shinken-solutions.com",          managerId: "JROY" },
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

// Retourne tous les managers (pour envoi multi-destinataires)
function getAllManagers() {
  return MANAGERS;
}

function getEmployeesByManager(managerId) {
  // En mode multi-managers, tous les employés sont visibles par chaque manager
  return EMPLOYEES;
}

function fullName(person) {
  return `${person.prenom} ${person.nom}`;
}