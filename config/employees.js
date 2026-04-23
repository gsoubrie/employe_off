// ============================================================
//  FICHIER DE CONFIGURATION DES EMPLOYÉS
// ============================================================
/* jshint esversion: 6 */

const MANAGERS = [
    { id: "JROY", prenom: "Joachim", nom: "Roy", email: "j.roy@shinken-solutions.com", token: "1a4acea15ecfd5087fe7063abd15d9e5" },
    { id: "GSOU", prenom: "Grégoire", nom: "Soubrié", email: "g.soubrie@shinken-solutions.com", token: "cf395d4ce16ffce17d8333b19fcae01a" },
    { id: "BMAR", prenom: "Benjamin", nom: "Martin", email: "b.martin@shinken-solutions.com", token: "1dd6efe6d12843a859418f1a60b01bf6" },
    { id: "MLUC", prenom: "Mathéo", nom: "Lucak", email: "m.lucak@shinken-solutions.com", token: "af47119edaeb5914893947f074f9bd01" }
];

const EMPLOYEES = [
    { id: "JROY", prenom: "Joachim", nom: "Roy", email: "j.roy@shinken-solutions.com", managerId: "JROY", token: "1a4acea15ecfd5087fe7063abd15d9e5" },
    { id: "GSOU", prenom: "Grégoire", nom: "Soubrié", email: "g.soubrie@shinken-solutions.com", managerId: "JROY", token: "cf395d4ce16ffce17d8333b19fcae01a" },
    { id: "BMAR", prenom: "Benjamin", nom: "Martin", email: "b.martin@shinken-solutions.com", managerId: "JROY", token: "1dd6efe6d12843a859418f1a60b01bf6" },
    { id: "BMOU", prenom: "Bastien", nom: "Mourgues", email: "b.mourgues@shinken-solutions.com", managerId: "BMAR", token: "9ec2229b6593994361a6f02e0dd8744d" },
    { id: "QSOU", prenom: "Quentin", nom: "Soubeyrol", email: "q.soubeyrol@shinken-solutions.com", managerId: "GSOU", token: "e3dfd70e804e5d8f26886fde03da2f70" },
    { id: "BLAB", prenom: "Bastien", nom: "Labouche", email: "b.labouche@shinken-solutions.com", managerId: "BMAR", token: "a1493d81f74b2c62ce318be51d34e574" },
    { id: "PMON", prenom: "Paul", nom: "Montassier", email: "p.montassier@shinken-solutions.com", managerId: "BMAR", token: "b852d0ef85cee09e4b939316bd588244" },
    { id: "CPOU", prenom: "Clément", nom: "Pouilloux", email: "c.pouilloux@shinken-solutions.com", managerId: "GSOU", token: "af377230508f2951e23495db4df733b7" },
    { id: "TKHE", prenom: "Thomas", nom: "Khédim", email: "t.khedim@shinken-solutions.com", managerId: "GSOU", token: "a40cc738e5261c3245681d9513a335c6" },
    { id: "MLUC", prenom: "Mathéo", nom: "Lucak", email: "m.lucak@shinken-solutions.com", managerId: "MLUC", token: "af47119edaeb5914893947f074f9bd01" },
    { id: "FCLA", prenom: "Françis", nom: "Claricia", email: "f.claricia@shinken-solutions.com", managerId: "BMAR", token: "bbe3cc29808642b2c2cbfb837d48dd12" },
    { id: "CVIC", prenom: "César", nom: "Victor", email: "c.victor@shinken-solutions.com", managerId: "MLUC", token: "3a09683c5f04eb737a352eec125399cd" },
    { id: "SDUR", prenom: "Sami", nom: "Durand", email: "s.durand@shinken-solutions.com", managerId: "GSOU", token: "154a9b55e6d9e568deaf1d7ef594c423" },
    { id: "LPOR", prenom: "Lukas", nom: "Portier", email: "l.portier@shinken-solutions.com", managerId: "BMAR", token: "070fbdede4fefd1cc110d4d60330c91d" },
    { id: "LVEL", prenom: "Lucas", nom: "Vellin-Patche", email: "l.vellin-patche@shinken-solutions.com", managerId: "GSOU", token: "01b87d91f910ab9872d23e6e28785d0e" },
    { id: "CDAV", prenom: "Chloé", nom: "David", email: "c.david@shinken-solutions.com", managerId: "BMAR", token: "a701d0e9b7b3823bf53d0b4d59bcec1f" },
    { id: "NLEM", prenom: "Nathan", nom: "Lemoule Duparc", email: "n.lemoule-duparc@shinken-solutions.com", managerId: "GSOU", token: "7346342584b0306566262d419fde038a" },
    { id: "JCOR", prenom: "Jason", nom: "Corso", email: "j.corso@shinken-solutions.com", managerId: "MLUC", token: "64c3ced6588ed617e3f022f495cffb85" },
    { id: "AFRE", prenom: "Alexis", nom: "Frère", email: "a.frere@shinken-solutions.com", managerId: "JROY", token: "ac934548b483cf893e797a4ec517b4ec" },
    { id: "ARUB", prenom: "Alrick", nom: "Rubio", email: "a.rubio@shinken-solutions.com", managerId: "JROY", token: "3f2b5e7da8c08a8d20576bec3a056da7" }
];

// ── Helpers ───────────────────────────────────────────────────
function getEmployeeById ( id ) {
    return EMPLOYEES.find( ( e ) => e.id === id ) || null;
}

function getEmployeeByToken ( token ) {
    return EMPLOYEES.find( ( e ) => e.token === token ) || null;
}

function getManagerById ( id ) {
    return MANAGERS.find( ( m ) => m.id === id ) || null;
}

function getAllManagers () {
    return MANAGERS;
}

function isManager ( employeeId ) {
    return MANAGERS.some( ( m ) => m.id === employeeId );
}

function getManagerForEmployee ( employeeId ) {
    const emp = getEmployeeById( employeeId );
    return emp ? getManagerById( emp.managerId ) : null;
}

// Chaque manager voit les employés de son équipe + tous les managers voient tout en vue manager
function getEmployeesByManager ( managerId ) {
    return EMPLOYEES.filter( ( e ) => e.managerId === managerId );
}

function fullName ( person ) {
    return `${person.prenom} ${person.nom}`;
}