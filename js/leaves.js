// ============================================================
//  COMPOSANT CONGÉS (leaves.js)
// ============================================================
/* jshint esversion: 6 */
/* jshint strict: true */


const COLLECTION           = "conges";
const PAYFIT_SUBJECT_TYPES = ["CP", "MEDICAL", "FAMILLE", "AUTRE"];


// ── Jours fériés français 2024-2029 (dates fixes) ─────────────
const FERIES = new Set( [
    // 2024
    "2024-01-01", // Jour de l'an
    "2024-04-01", // Lundi de Pâques
    "2024-05-01", // Fête du Travail
    "2024-05-08", // Victoire 1945
    "2024-05-09", // Ascension
    "2024-07-14", // Fête Nationale
    "2024-08-15", // Assomption
    "2024-11-01", // Toussaint
    "2024-11-11", // Armistice
    "2024-12-25", // Noël
    // 2025
    "2025-01-01", // Jour de l'an
    "2025-04-21", // Lundi de Pâques
    "2025-05-01", // Fête du Travail
    "2025-05-08", // Victoire 1945
    "2025-05-29", // Ascension
    "2025-07-14", // Fête Nationale
    "2025-08-15", // Assomption
    "2025-11-01", // Toussaint
    "2025-11-11", // Armistice
    "2025-12-25", // Noël
    // 2026
    "2026-01-01", // Jour de l'an
    "2026-04-06", // Lundi de Pâques
    "2026-05-01", // Fête du Travail
    "2026-05-08", // Victoire 1945
    "2026-05-14", // Ascension
    "2026-07-14", // Fête Nationale
    "2026-08-15", // Assomption
    "2026-11-01", // Toussaint
    "2026-11-11", // Armistice
    "2026-12-25", // Noël
    // 2027
    "2027-01-01", // Jour de l'an
    "2027-03-29", // Lundi de Pâques
    "2027-05-01", // Fête du Travail
    "2027-05-06", // Ascension
    "2027-05-08", // Victoire 1945
    "2027-07-14", // Fête Nationale
    "2027-08-15", // Assomption
    "2027-11-01", // Toussaint
    "2027-11-11", // Armistice
    "2027-12-25", // Noël
    // 2028
    "2028-01-01", // Jour de l'an
    "2028-04-17", // Lundi de Pâques
    "2028-05-01", // Fête du Travail
    "2028-05-08", // Victoire 1945
    "2028-05-25", // Ascension
    "2028-07-14", // Fête Nationale
    "2028-08-15", // Assomption
    "2028-11-01", // Toussaint
    "2028-11-11", // Armistice
    "2028-12-25", // Noël
    // 2029
    "2029-01-01", // Jour de l'an
    "2029-04-02", // Lundi de Pâques
    "2029-05-01", // Fête du Travail
    "2029-05-08", // Victoire 1945
    "2029-05-10", // Ascension
    "2029-07-14", // Fête Nationale
    "2029-08-15", // Assomption
    "2029-11-01", // Toussaint
    "2029-11-11", // Armistice
    "2029-12-25"  // Noël
] );

function isFerie ( dateStr ) {
    return FERIES.has( dateStr );
}


// ── Calcul du nombre de jours ─────────────────────────────────
// Journée = 1j, Matin = 0.5j, Après-midi = 0.5j
// Samedis, dimanches et jours fériés français exclus.

function periodeValue ( periode ) {
    return periode === "Journée" ? 1 : 0.5;
}

function toLocalDateStr ( date ) {
    const y  = date.getFullYear();
    const m  = String( date.getMonth() + 1 ).padStart( 2, "0" );
    const d  = String( date.getDate() ).padStart( 2, "0" );
    return `${y}-${m}-${d}`;
}

function calculateDays ( debut, fin, periodeDebut, periodeFin ) {
    if ( debut === fin ) {
        const d = new Date( debut + "T00:00" );
        if ( d.getDay() === 0 || d.getDay() === 6 || isFerie( debut ) ) {
            return 0;
        }
        return periodeValue( periodeDebut );
    }
    let total = 0;
    const d2  = new Date( fin + "T00:00" );
    const cur = new Date( debut + "T00:00" );
    while ( cur <= d2 ) {
        const dow     = cur.getDay();
        const dateStr = toLocalDateStr( cur );
        if ( dow !== 0 && dow !== 6 && !isFerie( dateStr ) ) {
            if ( dateStr === debut ) {
                total += periodeValue( periodeDebut );
            }
            else if ( dateStr === fin ) {
                total += periodeValue( periodeFin );
            }
            else {
                total += 1;
            }
        }
        cur.setDate( cur.getDate() + 1 );
    }
    return total;
}

// ── Format sujet Payfit ───────────────────────────────────────
function buildPayfitSubject ( leave ) {
    return `${leave.typeLabel};${leave.employeeLastName};${leave.debut};${leave.periodeDebut};${leave.fin};${leave.periodeFin} => ${leave.nbJours} j`;
}

// ── Soumission ────────────────────────────────────────────────
async function submitLeave ( formData ) {
    const { employeeId, debut, fin, typeId, periodeDebut, periodeFin, note } = formData;
    
    if ( !employeeId || !debut || !fin || !typeId ) {
        throw new Error( "Champs obligatoires manquants" );
    }
    if ( debut > fin ) {
        throw new Error( "La date de fin doit être après la date de début" );
    }
    
    const employee  = getEmployeeById( employeeId );
    const leaveType = getLeaveType( typeId );
    if ( !employee ) {
        throw new Error( "Employé introuvable" );
    }
    
    const pd            = periodeDebut || "Journée";
    const pf            = periodeFin || "Journée";
    const nbJours       = calculateDays( debut, fin, pd, pf );
    const initialStatus = leaveType.requiresValidation ? "pending" : "approved";
    
    const allManagers = getAllManagers();
    const managerIds  = allManagers.map( ( m ) => m.id );
    
    const docData = {
        employeeId,
        employeeName    : fullName( employee ),
        employeeLastName: employee.nom,
        employeeEmail   : employee.email,
        managerId       : managerIds[ 0 ],
        managerIds,
        managerEmail    : allManagers.map( ( m ) => m.email ).join( "," ),
        managerName     : allManagers.map( ( m ) => fullName( m ) ).join( ", " ),
        debut, fin,
        periodeDebut    : pd,
        periodeFin      : pf,
        typeId,
        typeLabel       : leaveType.label,
        note            : note || "",
        nbJours,
        status          : initialStatus
    };
    
    const docId = await fsAdd( COLLECTION, docData );
    if ( leaveType.requiresValidation ) {
        sendLeaveRequestEmail( { ...docData, id: docId } );
    }
    return { id: docId, ...docData };
}

// ── Statut ────────────────────────────────────────────────────
async function updateLeaveStatus ( leaveId, status, comment = "" ) {
    await fsUpdate( COLLECTION, leaveId, { status, managerComment: comment } );
}

// ── Récupération ─────────────────────────────────────────────
function listenLeaves ( filters, callback ) {
    return fsListen( COLLECTION, filters, callback );
}

// ── Email vers les 3 managers ─────────────────────────────────
function buildEmailSubject ( leave ) {
    if ( PAYFIT_SUBJECT_TYPES.includes( leave.typeId ) ) {
        return buildPayfitSubject( leave );
    }
    return `Demande de ${leave.typeLabel} – ${leave.employeeName}`;
}

function sendLeaveRequestEmail ( leave ) {
    const allManagers   = getAllManagers();
    const directManager = getManagerById( leave.managerId );
    if ( !allManagers.length ) {
        return;
    }
    
    const nb      = leave.nbJours;
    const subject = encodeURIComponent( buildEmailSubject( leave ) );
    
    // Manager direct en destinataire principal, les autres managers en CC
    const toEmail  = directManager ? directManager.email : allManagers[ 0 ].email;
    const ccEmails = [
        ...allManagers.filter( ( m ) => m.email !== toEmail ).map( ( m ) => m.email ),
        leave.employeeEmail
    ].filter( Boolean ).join( "," );
    
    const body = encodeURIComponent(
        `Bonjour,

${leave.employeeName} a soumis une demande de ${leave.typeLabel} :

  • Du    : ${formatDate( leave.debut )} (${leave.periodeDebut})
  • Au    : ${formatDate( leave.fin )} (${leave.periodeFin})
  • Durée : ${nb} jour${nb > 1 ? "s" : ""}
${leave.note ? `  • Note  : ${leave.note}\n` : ""}
Pour valider ou refuser cette demande :
${window.location.origin}${window.location.pathname.replace( /[^/]*$/, "" )}manager.html

Cordialement,
L'application Congés Équipe`
    );
    
    window.location.href = `mailto:${toEmail}?cc=${encodeURIComponent( ccEmails )}&subject=${subject}&body=${body}`;
}

// ── Rendu liste ───────────────────────────────────────────────
function renderLeaveItem ( leave, { showActions = false, onApprove, onReject } = {} ) {
    const emp    = getEmployeeById( leave.employeeId );
    const person = emp || { prenom: leave.employeeName.split( " " )[ 0 ], nom: leave.employeeName.split( " " )[ 1 ] || "" };
    const nb     = leave.nbJours || dayCount( leave.debut, leave.fin );
    const today  = new Date().toISOString().slice( 0, 10 );
    const past   = leave.fin < today;
    
    const showPeriode = (leave.periodeDebut && leave.periodeDebut !== "Journée") || (leave.periodeFin && leave.periodeFin !== "Journée");
    const periodeInfo = showPeriode
                        ? `<span style="font-size:11px;color:var(--text2)">${leave.periodeDebut} → ${leave.periodeFin}</span>` : "";
    
    const actionsHTML = showActions && leave.status === "pending" ? `
    <button class="btn success sm" onclick="${onApprove}('${leave.id}')">✓ Valider</button>
    <button class="btn danger sm"  onclick="${onReject}('${leave.id}')">✕ Refuser</button>` : "";
    
    const deleteHTML = `<button class="icon-btn" onclick="handleDelete('${leave.id}')" title="Supprimer">✕</button>`;
    
    return `
    <div class="list-item" style="${past ? "opacity:.5" : ""}" data-leave-id="${leave.id}">
      ${avatarHTML( person )}
      <div class="list-item-info">
        <div class="name">${leave.employeeName}</div>
        <div class="meta">${formatDate( leave.debut )} → ${formatDate( leave.fin )} · ${nb} jour${nb > 1 ? "s" : ""}</div>
        <div style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          ${leaveTypeBadge( leave.typeId )}
          ${statusBadge( leave.status )}
          ${periodeInfo}
          ${leave.note ? `<span style="font-size:12px;color:var(--text2)">${leave.note}</span>` : ""}
        </div>
      </div>
      <div class="list-item-actions">${actionsHTML}${deleteHTML}</div>
    </div>`;
}

// ── Stats ─────────────────────────────────────────────────────
function computeStats ( leaves ) {
    const today = new Date().toISOString().slice( 0, 10 );
    return {
        total   : leaves.length,
        pending : leaves.filter( ( l ) => l.status === "pending" ).length,
        approved: leaves.filter( ( l ) => l.status === "approved" ).length,
        upcoming: leaves.filter( ( l ) => l.status === "approved" && l.fin >= today ).length
    };
}