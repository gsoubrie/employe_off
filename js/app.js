// ============================================================
//  APP.JS — Logique principale index.html
//  Auth token, navigation, soumission, liste, stats
// ============================================================
/* jshint esversion: 6 */

let currentEmployee = null;
let allLeaves       = [];
let cal;

// ── Auth par token ────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const urlToken  = new URLSearchParams(window.location.search).get("token");
  const sessToken = (() => { try { return sessionStorage.getItem("conges_token"); } catch(e) { return null; } })();
  const token     = urlToken || sessToken;

  const employee = token ? getEmployeeByToken(token) : null;

  if (employee) {
    // Persister le token et nettoyer l'URL
    try { sessionStorage.setItem("conges_token", token); } catch(e) {}
    if (urlToken) {
      const u = new URL(window.location.href);
      u.searchParams.delete("token");
      window.history.replaceState({}, "", u.toString());
    }
    currentEmployee = employee;
    bootApp();
  } else {
    // Pas de token valide : accès anonyme, calendrier uniquement
    bootCalendarOnly();
  }
});

function bootCalendarOnly() {
  document.getElementById("app").style.display = "block";

  // Masquer les onglets Saisie et Mes congés, ne garder que Calendrier
  document.querySelectorAll(".tab").forEach((t) => {
    if (t.textContent.trim() !== "Calendrier") t.style.display = "none";
  });

  // Activer directement l'onglet calendrier
  document.querySelectorAll(".section").forEach((el) => el.classList.remove("active"));
  document.getElementById("tab-calendrier").classList.add("active");

  initFirebase();
  checkFirebaseBanner();

  cal = new LeaveCalendar("cal-grid", "cal-title", "cal-legend");

  if (isFirebaseConfigured()) {
    listenLeaves([], (leaves) => {
      allLeaves = leaves;
      cal.setLeaves(leaves);
      cal.render();
    });
  }
}

function bootApp() {
  document.getElementById("app").style.display = "block";

  // Remplir le header utilisateur
  document.getElementById("f-employee").value             = currentEmployee.id;
  document.getElementById("f-employee-display").textContent = fullName(currentEmployee);
  document.getElementById("user-name-header").textContent   = fullName(currentEmployee);
  document.getElementById("user-avatar-header").innerHTML   = avatarHTML(currentEmployee);

  // Bouton manager si l'employé est manager
  if (isManager(currentEmployee.id)) {
    const lnk = document.getElementById("manager-link");
    lnk.style.display = "inline-flex";
    try { lnk.href = "manager.html?token=" + sessionStorage.getItem("conges_token"); } catch(e) {}
  }

  initFirebase();
  checkFirebaseBanner();
  populateLeaveTypeSelect("f-type");

  cal = new LeaveCalendar("cal-grid", "cal-title", "cal-legend");

  if (isFirebaseConfigured()) {
    listenLeaves([], (leaves) => {
      allLeaves = leaves;
      cal.setLeaves(leaves);
      renderMyLeaves();
      renderStats();
    });
  }
}

// ── Navigation ────────────────────────────────────────────────
function switchTab(t) {
  const tabs = ["saisie", "calendrier", "liste"];
  document.querySelectorAll(".tab").forEach((el, i) =>
    el.classList.toggle("active", tabs[i] === t));
  document.querySelectorAll(".section").forEach((el) =>
    el.classList.remove("active"));
  document.getElementById("tab-" + t).classList.add("active");
  if (t === "calendrier") cal.render();
}

// ── Soumission ────────────────────────────────────────────────
async function handleSubmit() {
  if (!PeriodeForm.isValid()) {
    showToast("Corrigez les erreurs avant de soumettre", "error");
    return;
  }

  const btn = document.getElementById("btn-submit");
  btn.disabled    = true;
  btn.textContent = "Envoi...";

  try {
    const { debut, fin, periodeDebut, periodeFin } = PeriodeForm.getValues();

    await submitLeave({
      employeeId:   currentEmployee.id,
      debut,
      fin,
      periodeDebut,
      periodeFin,
      typeId: document.getElementById("f-type").value,
      note:   document.getElementById("f-note").value,
    });

    showToast("Demande soumise — mail envoyé aux managers !");
    document.getElementById("f-note").value = "";
    PeriodeForm.reset();

  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled    = false;
    btn.textContent = "Soumettre la demande";
  }
}

// ── Mes congés ────────────────────────────────────────────────
function renderMyLeaves() {
  const mine = allLeaves
    .filter((l) => l.employeeId === currentEmployee.id)
    .sort((a, b) => b.debut.localeCompare(a.debut));

  const el = document.getElementById("leaves-list");
  if (!mine.length) {
    el.innerHTML = '<div class="empty">Aucun congé enregistré</div>';
    return;
  }
  el.innerHTML = mine
    .map((l) => renderLeaveItem(l))
    .join("");
}


// ── Stats ─────────────────────────────────────────────────────
function renderStats() {
  const mine = allLeaves.filter((l) => l.employeeId === currentEmployee.id);
  const s    = computeStats(mine);
  document.getElementById("stats-grid").innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total</div>
      <div class="stat-value">${s.total}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">En attente</div>
      <div class="stat-value" style="color:var(--amber)">${s.pending}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Approuvés</div>
      <div class="stat-value" style="color:var(--green)">${s.approved}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">À venir</div>
      <div class="stat-value">${s.upcoming}</div>
    </div>`;
}