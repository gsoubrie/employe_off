// ============================================================
//  COMPOSANT CONGÉS (leaves.js)
//  Logique métier : ajout, liste, envoi mail, statut
// ============================================================

const COLLECTION = "conges";

// ── Ajout d'un congé ─────────────────────────────────────────

async function submitLeave(formData) {
  const { employeeId, debut, fin, typeId, note } = formData;

  if (!employeeId || !debut || !fin || !typeId) {
    throw new Error("Champs obligatoires manquants");
  }
  if (debut > fin) {
    throw new Error("La date de fin doit être après la date de début");
  }

  const employee = getEmployeeById(employeeId);
  const manager  = getManagerForEmployee(employeeId);
  const leaveType = getLeaveType(typeId);

  if (!employee) throw new Error("Employé introuvable");

  const leaveType_requiresValidation = leaveType.requiresValidation;
  const initialStatus = leaveType_requiresValidation ? "pending" : "approved";

  const docData = {
    employeeId,
    employeeName:   fullName(employee),
    employeeEmail:  employee.email,
    managerId:      employee.managerId,
    managerEmail:   manager ? manager.email : "",
    managerName:    manager ? fullName(manager) : "",
    debut,
    fin,
    typeId,
    typeLabel:      leaveType.label,
    note:           note || "",
    status:         initialStatus,
  };

  const docId = await fsAdd(COLLECTION, docData);

  // Envoi du mail si validation requise
  if (leaveType_requiresValidation && manager) {
    sendLeaveRequestEmail({ ...docData, id: docId });
  }

  return { id: docId, ...docData };
}

// ── Validation / Refus ───────────────────────────────────────

async function updateLeaveStatus(leaveId, status, comment = "") {
  await fsUpdate(COLLECTION, leaveId, { status, managerComment: comment });
}

// ── Récupération ─────────────────────────────────────────────

async function getAllLeaves() {
  return fsGetAll(COLLECTION);
}

async function getLeavesByManager(managerId) {
  return fsGetAll(COLLECTION, [["managerId", "==", managerId]]);
}

async function getLeavesByEmployee(employeeId) {
  return fsGetAll(COLLECTION, [["employeeId", "==", employeeId]]);
}

// Écoute temps réel (retourne la fonction unsubscribe)
function listenLeaves(filters, callback) {
  return fsListen(COLLECTION, filters, callback);
}

// ── Email ────────────────────────────────────────────────────

function sendLeaveRequestEmail(leave) {
  const manager = getManagerById(leave.managerId);
  if (!manager) return;

  const nb = dayCount(leave.debut, leave.fin);
  const subject = encodeURIComponent(`Demande de congé – ${leave.employeeName}`);
  const body = encodeURIComponent(
`Bonjour ${manager.prenom},

${leave.employeeName} a soumis une demande de ${leave.typeLabel} :

  • Du    : ${formatDate(leave.debut)}
  • Au    : ${formatDate(leave.fin)}
  • Durée : ${nb} jour${nb > 1 ? "s" : ""}
${leave.note ? `  • Note   : ${leave.note}\n` : ""}
Pour valider ou refuser cette demande, connectez-vous à l'application :
${window.location.origin}/manager.html

Cordialement,
L'application Congés Équipe`
  );

  const cc = leave.employeeEmail ? `cc=${encodeURIComponent(leave.employeeEmail)}&` : "";
  window.location.href = `mailto:${manager.email}?${cc}subject=${subject}&body=${body}`;
}

// ── Rendu liste ──────────────────────────────────────────────

function renderLeaveItem(leave, { showActions = false, onApprove, onReject, onDelete } = {}) {
  const emp = getEmployeeById(leave.employeeId);
  const person = emp || { prenom: leave.employeeName.split(" ")[0], nom: leave.employeeName.split(" ")[1] || "", email: leave.employeeEmail };
  const nb = dayCount(leave.debut, leave.fin);
  const today = new Date().toISOString().slice(0, 10);
  const past = leave.fin < today;

  const actionsHTML = showActions && leave.status === "pending" ? `
    <button class="btn success sm" onclick="${onApprove}('${leave.id}')">✓ Valider</button>
    <button class="btn danger sm"  onclick="${onReject}('${leave.id}')">✕ Refuser</button>
  ` : "";

  const deleteHTML = onDelete ? `
    <button class="icon-btn" onclick="${onDelete}('${leave.id}')" title="Supprimer">✕</button>
  ` : "";

  return `
    <div class="list-item" style="${past ? "opacity:.5" : ""}" data-leave-id="${leave.id}">
      ${avatarHTML(person)}
      <div class="list-item-info">
        <div class="name">${leave.employeeName}</div>
        <div class="meta">${formatDate(leave.debut)} → ${formatDate(leave.fin)} · ${nb} jour${nb > 1 ? "s" : ""}</div>
        <div style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          ${leaveTypeBadge(leave.typeId)}
          ${statusBadge(leave.status)}
          ${leave.note ? `<span style="font-size:12px;color:var(--text2)">${leave.note}</span>` : ""}
        </div>
      </div>
      <div class="list-item-actions">
        ${actionsHTML}
        ${deleteHTML}
      </div>
    </div>`;
}

// ── Stats ────────────────────────────────────────────────────

function computeStats(leaves) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    total:    leaves.length,
    pending:  leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    upcoming: leaves.filter((l) => l.status === "approved" && l.fin >= today).length,
  };
}
