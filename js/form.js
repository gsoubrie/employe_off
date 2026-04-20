// ============================================================
//  FORM.JS — Logique toggles Matin/Après-midi
//  Instanciable avec un préfixe d'IDs pour réutilisation
//  Usage :
//    const PeriodeForm   = createPeriodeForm("f");   // index.html
//    const ManagerForm   = createPeriodeForm("m");   // manager.html
// ============================================================
/* jshint esversion: 6 */

/* jshint strict: true */

function createPeriodeForm ( prefix ) {
    
    // ── État interne ────────────────────────────────────────────
    const state = {
        debut: { matin: true, apmidi: true },
        fin  : { matin: true, apmidi: true }
    };
    
    // ── Helpers ─────────────────────────────────────────────────
    const p  = ( id ) => `${prefix}-${id}`;
    const el = ( id ) => document.getElementById( p( id ) );
    
    function periodeStr ( { matin, apmidi } ) {
        if ( matin && apmidi ) {
            return "Journée";
        }
        if ( matin ) {
            return "Matin";
        }
        return "Après-midi";
    }
    
    // ── Rendu boutons début ──────────────────────────────────────
    function renderDebut () {
        const s = state.debut;
        el( "btn-debut-matin" ).className  = "pbtn " + (s.matin ? "on" : "off");
        el( "btn-debut-apmidi" ).className = "pbtn " + (s.apmidi ? "on" : "off");
        el( "periode-debut" ).value        = periodeStr( s );
        el( "hint-debut" ).textContent     = "";

        // Activer les boutons si une date est saisie
        el( "toggle-debut" ).classList.toggle( "active", !!el( "debut" ).value );
    }
    
    // ── Rendu boutons fin ────────────────────────────────────────
    function renderFin () {
        const s = state.fin;

        // Règle 3 : le matin de la fin est toujours actif et non-toggleable
        el( "btn-fin-matin" ).className  = "pbtn on disabled";
        el( "btn-fin-apmidi" ).className = "pbtn " + (s.apmidi ? "on" : "off");
        el( "periode-fin" ).value        = periodeStr( s );
        el( "hint-fin" ).textContent     = "";

        // Activer les boutons si une date de fin est saisie
        el( "toggle-fin" ).classList.toggle( "active", !!el( "fin" ).value );
    }
    
    // ── Visibilité section fin ───────────────────────────────────
    // Règle 2 : cachée si après-midi du début est décoché
    function updateFinSection () {
        const dVal = el( "debut" ).value;

        if ( !dVal || !state.debut.apmidi ) {
            el( "fin-section" ).style.display = "none";
            el( "fin" ).value                                      = "";
            state.fin                                              = { matin: true, apmidi: true };
            renderFin();
        }
        else {
            el( "fin-section" ).style.display = "";
        }
    }
    
    // ── Preview nombre de jours ──────────────────────────────────
    function updatePreview () {
        const dVal = el( "debut" ).value;
        const fVal = el( "fin" ).value;
        const fin  = (fVal && fVal >= dVal) ? fVal : dVal;
        const pd   = el( "periode-debut" ).value;
        const pf   = (fVal && fVal >= dVal) ? el( "periode-fin" ).value : pd;
        const box  = el( "preview-days" );
        
        if ( !dVal ) {
            box.style.display = "none";
            return;
        }
        
        const nb          = calculateDays( dVal, fin, pd, pf );
        box.style.display = "block";
        box.innerHTML     = `<strong>${nb} jour${nb > 1 ? "s" : ""}</strong> ouvré${nb > 1 ? "s" : ""}`;
    }
    
    // ── Sync global ──────────────────────────────────────────────
    function sync () {
        renderDebut();
        updateFinSection();
        renderFin();
        updatePreview();
    }
    
    // ── API publique ─────────────────────────────────────────────
    return {
        
        onDebutChange () {
            const dVal = el( "debut" ).value;
            if ( dVal ) {
                const next = new Date( dVal );
                next.setDate( next.getDate() + 1 );
                el( "fin" ).min = next.toISOString().slice( 0, 10 );
            }
            else {
                el( "fin" ).min = "";
            }
            if ( el( "fin" ).value && el( "fin" ).value < dVal ) {
                el( "fin" ).value = "";
                state.fin         = { matin: true, apmidi: true };
            }
            sync();
        },
        
        onFinChange () {
            sync();
        },
        
        toggleDebut ( half ) {
            const s = state.debut;
            if ( half === "Matin" ) {
                // Règle 1 : décocher matin est toujours permis (tant qu'au moins un reste actif)
                if ( s.matin && !s.apmidi ) {
                    return; // empêche de tout décocher
                }
                s.matin = !s.matin;
            }
            else {
                // Règle 2 : décocher après-midi cache la section fin
                if ( !s.matin && s.apmidi ) {
                    return; // empêche de tout décocher
                }
                s.apmidi = !s.apmidi;
            }
            sync();
        },
        
        toggleFin ( half ) {
            const s = state.fin;
            if ( half === "Matin" ) {
                // Règle 3 : le matin de la fin n'est jamais toggleable
                return;
            }
            else {
                // Règle 4 : après-midi de la fin peut être décoché librement
                if ( !s.matin && s.apmidi ) {
                    return; // empêche de tout décocher (sécurité)
                }
                s.apmidi = !s.apmidi;
            }
            sync();
        },
        
        getValues () {
            const dVal = el( "debut" ).value;
            const fVal = el( "fin" ).value;
            const fin  = (fVal && fVal >= dVal) ? fVal : dVal;
            const pd   = el( "periode-debut" ).value;
            const pf   = (fVal && fVal >= dVal) ? el( "periode-fin" ).value : pd;
            return { debut: dVal, fin, periodeDebut: pd, periodeFin: pf };
        },
        
        isValid () {
            return !!el( "debut" ).value;
        },
        
        reset () {
            el( "debut" ).value = "";
            el( "fin" ).value   = "";
            state.debut         = { matin: true, apmidi: true };
            state.fin           = { matin: true, apmidi: true };
            sync();
        }
    };
}

// Instances globales
const PeriodeForm = createPeriodeForm( "f" );   // index.html  (préfixe "f-")
const ManagerForm = createPeriodeForm( "m" );   // manager.html (préfixe "m-")