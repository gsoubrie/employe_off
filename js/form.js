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
    
    // ── Détection des erreurs de continuité ─────────────────────
    function getErrors () {
        const sd   = state.debut;
        const sf   = state.fin;
        const dVal = el( "debut" ).value;
        const fVal = el( "fin" ).value;
        const err  = {};
        
        // Règle 1 : début sans après-midi → pas de lendemain
        if ( dVal && fVal && fVal > dVal && !sd.apmidi ) {
            err.debutApmidi = true;
            err.debutMsg    = "Sans après-midi au début, la fin ne peut pas être un autre jour";
        }
        
        // Règle 2 : fin sans matin → trou
        if ( fVal && !sf.matin ) {
            err.finMatin = true;
            err.finMsg   = "La fin doit inclure le matin";
        }
        
        // Règle 3 : même jour, début = après-midi → fin ne peut pas inclure le matin
        if ( dVal && fVal && dVal === fVal && !sd.matin && sf.matin ) {
            err.finMatin = true;
            err.finMsg   = "Même jour : début après-midi, fin ne peut pas inclure le matin";
        }
        
        return err;
    }
    
    // ── Rendu boutons début ──────────────────────────────────────
    function renderDebut () {
        const s   = state.debut;
        const err = getErrors();
        
        el( "btn-debut-matin" ).className  = "pbtn " + (s.matin ? (err.debutMatin ? "err" : "on") : "off");
        el( "btn-debut-apmidi" ).className = "pbtn " + (s.apmidi ? (err.debutApmidi ? "err" : "on") : "off");
        el( "periode-debut" ).value        = periodeStr( s );
        el( "hint-debut" ).textContent     = err.debutMsg || "";
        
        // Activer les boutons si une date est saisie
        el( "toggle-debut" ).classList.toggle( "active", !!el( "debut" ).value );
    }
    
    // ── Rendu boutons fin ────────────────────────────────────────
    function renderFin () {
        const s   = state.fin;
        const err = getErrors();
        
        el( "btn-fin-matin" ).className  = "pbtn " + (s.matin ? (err.finMatin ? "err" : "on") : "off");
        el( "btn-fin-apmidi" ).className = "pbtn " + (s.apmidi ? (err.finApmidi ? "err" : "on") : "off");
        el( "periode-fin" ).value        = periodeStr( s );
        el( "hint-fin" ).textContent     = err.finMsg || "";
        
        // Activer les boutons si une date de fin est saisie
        el( "toggle-fin" ).classList.toggle( "active", !!el( "fin" ).value );
    }
    
    // ── Visibilité section fin ───────────────────────────────────
    // Cachée si : pas de date début, OU début = Après-midi seulement
    function updateFinSection () {
        const dVal       = el( "debut" ).value;
        const apmidiOnly = !state.debut.matin && state.debut.apmidi;
        
        if ( !dVal || apmidiOnly ) {
            el( "fin-section" ).style.display = "none";
            el( "fin" ).value                 = "";
            state.fin                         = { matin: true, apmidi: true };
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
        
        const err = getErrors();
        if ( err.debutMsg || err.finMsg ) {
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
            const dVal      = el( "debut" ).value;
            el( "fin" ).min = dVal || "";
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
                if ( s.matin && !s.apmidi ) {
                    return;
                }
                s.matin = !s.matin;
            }
            else {
                if ( !s.matin && s.apmidi ) {
                    return;
                }
                s.apmidi = !s.apmidi;
            }
            sync();
        },
        
        toggleFin ( half ) {
            const s = state.fin;
            if ( half === "Matin" ) {
                if ( s.matin && !s.apmidi ) {
                    return;
                }
                s.matin = !s.matin;
            }
            else {
                if ( !s.matin && s.apmidi ) {
                    return;
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
            const err = getErrors();
            return !err.debutMsg && !err.finMsg && !!el( "debut" ).value;
        },
        
        reset () {
            el( "debut" ).value = "";
            el( "fin" ).value   = "";
            state.debut         = { matin: true, apmidi: true };
            state.fin           = { matin: true, apmidi: true };
            sync();
        },
    };
}

// Instances globales
const PeriodeForm = createPeriodeForm( "f" );   // index.html  (préfixe "f-")
const ManagerForm = createPeriodeForm( "m" );   // manager.html (préfixe "m-")