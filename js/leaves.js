// ============================================================
//  COMPOSANT CONGÉS (leaves.js)
// ============================================================

const COLLECTION = "conges";
const PAYFIT_SUBJECT_TYPES = ["CP", "MALADIE", "FAMILLE", "AUTRE"];

// ── Calcul du nombre de jours ─────────────────────────────────
// Journée = 1j, Matin = 0.5j, Après-midi = 0.5j

function periodeValue(periode) {
  return periode === "Journée" ? 1 : 0.5;
}

function calculateDays(debut, fin, periodeDebut, periodeFin) {
  if (debut === fin) return periodeValue(periodeDebut);

  let total = 0;
  const d2  = new Date(fin   + "T00:00");
  const cur = new Date(debut + "T00:00");
  while (cur <= d2) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) {
      const dateStr = cur.toISOString().slice(0, 10);
      if      (dateStr === debut) total += periodeValue(periodeDebut);
      else if (dateStr === fin)   total += periodeValue(periodeFin);
      else                        total += 1;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return total;
}

// ── Format sujet Payfit ───────────────────────────────────────
function buildPayfitSubject(leave) {
  return `${leave.typeLabel};${leave.employeeLastName};${leave.debut};${leave.periodeDebut};${leave.fin};${leave.periodeFin} => ${leave.nbJours} j`;
}

// ── Soumission ────────────────────────────────────────────────
async function submitLeave(formData) {
  const { employeeId, debut, fin, typeId, periodeDebut, periodeFin, note } = formData;

  if (!employeeId || !debut || !fin || !typeId) throw new Error("Champs obligatoires manquants");
  if (debut > fin) throw new Error("La date de fin doit être après la date de début");

  const employee  = getEmployeeById(employeeId);
  const leaveType = getLeaveType(typeId);
  if (!employee) throw new Error("Employé introuvable");

  const pd = periodeDebut || "Journée";
  const pf = periodeFin   || "Journée";
  const nbJours = calculateDays(debut, fin, pd, pf);
  const initialStatus = leaveType.requiresValidation ? "pending" : "approved";

  const allManagers = getAllManagers();
  const managerIds  = allManagers.map((m) => m.id);

  const docData = {
    employeeId,
    employeeName:     fullName(employee),
    employeeLastName: employee.nom,
    employeeEmail:    employee.email,
    managerId:        managerIds[0],
    managerIds,
    managerEmail:     allManagers.map((m) => m.email).join(","),
    managerName:      allManagers.map((m) => fullName(m)).join(", "),
    debut, fin,
    periodeDebut: pd,
    periodeFin:   pf,
    typeId,
    typeLabel:  leaveType.label,
    note:       note || "",
    nbJours,
    status:     initialStatus,
  };

  const docId = await fsAdd(COLLECTION, docData);
  if (leaveType.requiresValidation) sendLeaveRequestEmail({ ...docData, id: docId });
  return { id: docId, ...docData };
}

// ── Statut ────────────────────────────────────────────────────
async function updateLeaveStatus(leaveId, status, comment = "") {
  await fsUpdate(COLLECTION, leaveId, { status, managerComment: comment });
}

// ── Récupération ─────────────────────────────────────────────
function listenLeaves(filters, callback) {
  return fsListen(COLLECTION, filters, callback);
}

// ── Email vers les 3 managers ─────────────────────────────────
function buildEmailSubject(leave) {
  if (PAYFIT_SUBJECT_TYPES.includes(leave.typeId)) return buildPayfitSubject(leave);
  return `Demande de ${leave.typeLabel} – ${leave.employeeName}`;
}

function sendLeaveRequestEmail(leave) {
  const allManagers = getAllManagers();
  if (!allManagers.length) return;

  const nb       = leave.nbJours;
  const subject  = encodeURIComponent(buildEmailSubject(leave));
  const toEmail  = allManagers[0].email;
  const ccEmails = [
    ...allManagers.slice(1).map((m) => m.email),
    leave.employeeEmail,
  ].filter(Boolean).join(",");

  const body = encodeURIComponent(
`Bonjour,

${leave.employeeName} a soumis une demande de ${leave.typeLabel} :

  • Du    : ${formatDate(leave.debut)} (${leave.periodeDebut})
  • Au    : ${formatDate(leave.fin)} (${leave.periodeFin})
  • Durée : ${nb} jour${nb > 1 ? "s" : ""}
${leave.note ? `  • Note  : ${leave.note}\n` : ""}
Pour valider ou refuser cette demande :
${window.location.origin}${window.location.pathname.replace(/[^/]*$/, "")}manager.html

Cordialement,
L'application Congés Équipe`
  );

  window.location.href = `mailto:${toEmail}?cc=${encodeURIComponent(ccEmails)}&subject=${subject}&body=${body}`;
}

// ── Rendu liste ───────────────────────────────────────────────
function renderLeaveItem(leave, { showActions = false, onApprove, onReject, onDelete } = {}) {
  const emp    = getEmployeeById(leave.employeeId);
  const person = emp || { prenom: leave.employeeName.split(" ")[0], nom: leave.employeeName.split(" ")[1] || "" };
  const nb     = leave.nbJours || dayCount(leave.debut, leave.fin);
  const today  = new Date().toISOString().slice(0, 10);
  const past   = leave.fin < today;

  const showPeriode = (leave.periodeDebut && leave.periodeDebut !== "Journée") || (leave.periodeFin && leave.periodeFin !== "Journée");
  const periodeInfo = showPeriode
    ? `<span style="font-size:11px;color:var(--text2)">${leave.periodeDebut} → ${leave.periodeFin}</span>` : "";

  const actionsHTML = showActions && leave.status === "pending" ? `
    <button class="btn success sm" onclick="${onApprove}('${leave.id}')">✓ Valider</button>
    <button class="btn danger sm"  onclick="${onReject}('${leave.id}')">✕ Refuser</button>` : "";

  const deleteHTML = onDelete ? `
    <button class="icon-btn" onclick="${onDelete}('${leave.id}')" title="Supprimer">✕</button>` : "";

  return `
    <div class="list-item" style="${past ? "opacity:.5" : ""}" data-leave-id="${leave.id}">
      ${avatarHTML(person)}
      <div class="list-item-info">
        <div class="name">${leave.employeeName}</div>
        <div class="meta">${formatDate(leave.debut)} → ${formatDate(leave.fin)} · ${nb} jour${nb > 1 ? "s" : ""}</div>
        <div style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          ${leaveTypeBadge(leave.typeId)}
          ${statusBadge(leave.status)}
          ${periodeInfo}
          ${leave.note ? `<span style="font-size:12px;color:var(--text2)">${leave.note}</span>` : ""}
        </div>
      </div>
      <div class="list-item-actions">${actionsHTML}${deleteHTML}</div>
    </div>`;
}

// ── Stats ─────────────────────────────────────────────────────
function computeStats(leaves) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    total:    leaves.length,
    pending:  leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    upcoming: leaves.filter((l) => l.status === "approved" && l.fin >= today).length,
  };
}