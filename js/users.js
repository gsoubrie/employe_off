// ============================================================
//  COMPOSANT UTILISATEURS
//  Gère l'affichage des sélecteurs d'employés et les helpers UI
// ============================================================
/* jshint esversion: 6 */
const AVATAR_COLORS = [
  { bg: "#E1F5EE", text: "#0F6E56" },
  { bg: "#E6F1FB", text: "#185FA5" },
  { bg: "#EEEDFE", text: "#3C3489" },
  { bg: "#FAEEDA", text: "#854F0B" },
  { bg: "#FBEAF0", text: "#72243E" },
  { bg: "#FAECE7", text: "#712B13" },
  { bg: "#EAF3DE", text: "#3B6D11" },
  { bg: "#FCEBEB", text: "#791F1F" },
];

function avatarColor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(person) {
  return `${(person.prenom[0] || "").toUpperCase()}${(person.nom[0] || "").toUpperCase()}`;
}

function avatarHTML(person, large = false) {
  const col = avatarColor(fullName(person));
  const cls = large ? "avatar avatar-lg" : "avatar";
  return `<div class="${cls}" style="background:${col.bg};color:${col.text}">${initials(person)}</div>`;
}

// Remplit un <select> avec la liste des employés
function populateEmployeeSelect(selectId, placeholder = "Choisir un employé") {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.innerHTML = `<option value="">— ${placeholder} —</option>`;
  EMPLOYEES.forEach((emp) => {
    const opt = document.createElement("option");
    opt.value = emp.id;
    opt.textContent = fullName(emp);
    el.appendChild(opt);
  });
}

// Remplit un <select> avec la liste des types de congés
function populateLeaveTypeSelect(selectId) {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.innerHTML = "";
  LEAVE_TYPES.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.label;
    el.appendChild(opt);
  });
}

// Rendu d'un badge de type
function leaveTypeBadge(typeId) {
  const t = getLeaveType(typeId);
  return `<span class="type-pill" style="background:${t.color.bg};color:${t.color.text}">${t.label}</span>`;
}

// Rendu du badge de statut
function statusBadge(status) {
  const map = {
    pending:  "En attente",
    approved: "Approuvé",
    rejected: "Refusé",
  };
  return `<span class="status ${status}">${map[status] || status}</span>`;
}

// Toast global
function showToast(msg, type = "success") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.style.background = type === "success" ? "#1D9E75" : type === "error" ? "#E24B4A" : "#EF9F27";
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3000);
}

// Formate une date "YYYY-MM-DD" en "12 jan. 2025"
function formatDate(str) {
  if (!str) return "";
  return new Date(str + "T00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// Nombre de jours entre deux dates (inclus)
function dayCount(debut, fin) {
  return Math.round((new Date(fin) - new Date(debut)) / 86400000) + 1;
}

// Affiche le banner si Firebase n'est pas configuré
function checkFirebaseBanner() {
  const banner = document.getElementById("firebase-banner");
  if (!banner) return;
  if (!isFirebaseConfigured()) {
    banner.style.display = "block";
  } else {
    banner.style.display = "none";
  }
}
