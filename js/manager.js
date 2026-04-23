// ============================================================
//  MANAGER.JS — Logique principale manager.html
// ============================================================
/* jshint esversion: 6 */
/* jshint strict: true */


let currentManager  = null;
let allLeaves       = [];
let pendingRejectId = null;
let cal;
let unsubscribe     = null;

// ── Auth ──────────────────────────────────────────────────────
document.addEventListener( "DOMContentLoaded", () => {
    const urlToken  = new URLSearchParams( window.location.search ).get( "token" );
    const sessToken = (() => {
        try {
            return sessionStorage.getItem( "conges_token" );
        }
        catch ( e ) {
            return null;
        }
    })();
    const token     = urlToken || sessToken;
    
    if ( !token ) {
        showLoginWall();
        return;
    }
    const employee = getEmployeeByToken( token );
    if ( !employee || !isManager( employee.id ) ) {
        showLoginWall();
        return;
    }
    
    try {
        sessionStorage.setItem( "conges_token", token );
    }
    catch ( e ) {
    }
    if ( urlToken ) {
        const u = new URL( window.location.href );
        u.searchParams.delete( "token" );
        window.history.replaceState( {}, "", u.toString() );
    }
    
    currentManager = employee;
    bootApp();
} );

function showLoginWall () {
    document.getElementById( "login-wall" ).classList.add( "visible" );
}

function bootApp () {
    document.getElementById( "app" ).style.display            = "block";
    document.getElementById( "user-name-header" ).textContent = fullName( currentManager );
    document.getElementById( "user-avatar-header" ).innerHTML = avatarHTML( currentManager );
    
    try {
        document.getElementById( "employee-link" ).href =
            "index.html?token=" + sessionStorage.getItem( "conges_token" );
    }
    catch ( e ) {
    }
    
    initFirebase();
    checkFirebaseBanner();
    
    cal = new LeaveCalendar( "cal-grid", "cal-title", "cal-legend" );
    
    // Remplir le sélecteur d'employés
    populateEmployeeSelect( "m-employee", "Choisir un employé" );
    populateLeaveTypeSelect( "m-type" );
    
    if ( isFirebaseConfigured() ) {
        unsubscribe = listenLeaves( [], ( leaves ) => {
            allLeaves = leaves.sort( ( a, b ) => b.debut.localeCompare( a.debut ) );
            renderAll();
        } );
    }
}

// ── Navigation ────────────────────────────────────────────────
const TAB_IDS = ["pending", "all", "calendrier", "saisie"];

function switchTab ( t ) {
    document.querySelectorAll( ".tab" ).forEach( ( el, i ) =>
        el.classList.toggle( "active", TAB_IDS[ i ] === t ) );
    document.querySelectorAll( ".section" ).forEach( ( el ) =>
        el.classList.remove( "active" ) );
    document.getElementById( "tab-" + t ).classList.add( "active" );
    if ( t === "calendrier" ) {
        cal.render();
    }
}

// ── Rendu global ──────────────────────────────────────────────
function renderAll () {
    renderPending();
    renderAllList();
    renderStats();
    cal.setLeaves( allLeaves );
}

function renderPending () {
    const pending     = allLeaves.filter( ( l ) => l.status === "pending" );
    const badge       = document.getElementById( "badge-pending" );
    badge.textContent = pending.length ? ` (${pending.length})` : "";
    badge.style.color = pending.length ? "var(--amber)" : "";
    
    const el = document.getElementById( "pending-list" );
    if ( !pending.length ) {
        el.innerHTML = '<div class="empty">Aucune demande en attente ✓</div>';
        return;
    }
    el.innerHTML = pending.map( ( l ) =>
        renderLeaveItem( l, { showActions: true, onApprove: "handleApprove", onReject: "openRejectModal" } )
    ).join( "" );
}

function renderAllList () {
    const el = document.getElementById( "all-list" );
    if ( !allLeaves.length ) {
        el.innerHTML = '<div class="empty">Aucun congé enregistré</div>';
        return;
    }
    el.innerHTML = allLeaves.map( ( l ) =>
        renderLeaveItem( l, { showActions: true, onApprove: "handleApprove", onReject: "openRejectModal" } )
    ).join( "" );
}

function renderStats () {
    const s                                           = computeStats( allLeaves );
    document.getElementById( "stats-grid" ).innerHTML = `
    <div class="stat-card"><div class="stat-label">Total</div><div class="stat-value">${s.total}</div></div>
    <div class="stat-card"><div class="stat-label">En attente</div><div class="stat-value" style="color:var(--amber)">${s.pending}</div></div>
    <div class="stat-card"><div class="stat-label">Approuvés</div><div class="stat-value" style="color:var(--green)">${s.approved}</div></div>
    <div class="stat-card"><div class="stat-label">À venir</div><div class="stat-value">${s.upcoming}</div></div>`;
}

// ── Actions validation ────────────────────────────────────────
async function handleApprove ( id ) {
    try {
        await updateLeaveStatus( id, "approved" );
        showToast( "Congé approuvé" );
        sendStatusEmail( id, "approved" );
    }
    catch ( e ) {
        showToast( "Erreur : " + e.message, "error" );
    }
}

function openRejectModal ( id ) {
    pendingRejectId                                          = id;
    document.getElementById( "reject-comment" ).value        = "";
    document.getElementById( "modal-overlay" ).style.display = "flex";
}

function closeModal () {
    document.getElementById( "modal-overlay" ).style.display = "none";
    pendingRejectId                                          = null;
}

async function confirmReject () {
    if ( !pendingRejectId ) {
        return;
    }
    const comment = document.getElementById( "reject-comment" ).value;
    try {
        await updateLeaveStatus( pendingRejectId, "rejected", comment );
        showToast( "Congé refusé" );
        sendStatusEmail( pendingRejectId, "rejected", comment );
        closeModal();
    }
    catch ( e ) {
        showToast( "Erreur : " + e.message, "error" );
    }
}

function sendStatusEmail ( leaveId, status, comment = "", leaveOverride = null ) {
    const leave = leaveOverride || allLeaves.find( ( l ) => l.id === leaveId );
    if ( !leave || !leave.employeeEmail ) {
        return;
    }
    const label      = status === "approved" ? "approuvée" : "refusée";
    const nb         = leave.nbJours || dayCount( leave.debut, leave.fin );
    const subject    = encodeURIComponent( buildEmailSubject( leave ) );
    const ccEmails   = getAllManagers()
        .map( ( m ) => m.email )
        .filter( Boolean )
        .join( ";" );
    const body       = encodeURIComponent(
        `Bonjour ${leave.employeeName.split( " " )[ 0 ]},

Votre demande de ${leave.typeLabel} (${formatDate( leave.debut )} → ${formatDate( leave.fin )}, ${nb} jour${nb > 1 ? "s" : ""}) a été ${label}.
${comment ? `\nCommentaire : ${comment}\n` : ""}
Cordialement,
${fullName( currentManager )}`
    );
    window.open( `mailto:${leave.employeeEmail}?cc=${ccEmails}&subject=${subject}&body=${body}` );
}

document.getElementById( "modal-overlay" ).addEventListener( "click", ( e ) => {
    if ( e.target === e.currentTarget ) {
        closeModal();
    }
} );

// ── Saisie pour un employé ────────────────────────────────────
function onEmployeeSelect () {
    const empId = document.getElementById( "m-employee" ).value;
    const form  = document.getElementById( "m-form" );
    
    if ( !empId ) {
        form.style.display = "none";
        return;
    }
    
    // Afficher le formulaire et le réinitialiser
    form.style.display = "";
    ManagerForm.reset();
    document.getElementById( "m-note" ).value = "";
}

async function handleManagerSubmit () {
    const empId = document.getElementById( "m-employee" ).value;
    if ( !empId ) {
        showToast( "Choisissez un employé", "error" );
        return;
    }
    if ( !ManagerForm.isValid() ) {
        showToast( "Corrigez les erreurs avant de soumettre", "error" );
        return;
    }
    
    const btn       = document.getElementById( "m-btn-submit" );
    btn.disabled    = true;
    btn.textContent = "Enregistrement...";
    
    try {
        const { debut, fin, periodeDebut, periodeFin } = ManagerForm.getValues();
        
        const result = await submitLeave( {
            employeeId: empId,
            debut,
            fin,
            periodeDebut,
            periodeFin,
            typeId          : document.getElementById( "m-type" ).value,
            note            : document.getElementById( "m-note" ).value,
            skipRequestEmail: true
        } );

        // Mail de confirmation envoyé à l'employé (congé approuvé directement par le manager)
        sendStatusEmail( result.id, "approved", "", result );
        
        showToast( `Congé enregistré pour ${fullName( getEmployeeById( empId ) )} !` );
        
        // Reset
        document.getElementById( "m-employee" ).value     = "";
        document.getElementById( "m-note" ).value         = "";
        document.getElementById( "m-form" ).style.display = "none";
        ManagerForm.reset();
        
    }
    catch ( err ) {
        showToast( err.message, "error" );
    }
    finally {
        btn.disabled    = false;
        btn.textContent = "Enregistrer le congé";
    }
}

async function handleDelete(id) {
  if (!confirm("Supprimer ce congé ?")) return;
  try {
    await fsDelete("conges", id);
    showToast("Congé supprimé");
  } catch (e) {
    showToast("Erreur lors de la suppression", "error");
  }
}