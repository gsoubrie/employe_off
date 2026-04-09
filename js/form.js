// ============================================================
//  FORMULAIRE DE SAISIE — form.js
//  Gère les toggles Matin/Après-midi et la logique de continuité
// ============================================================

const PeriodeForm = (() => {

  // ── État interne ──────────────────────────────────────────
  const state = {
    debut: { matin: true, apmidi: true },
    fin:   { matin: true, apmidi: true },
  };

  // ── Helpers ───────────────────────────────────────────────
  function periodeStr({ matin, apmidi }) {
    if (matin && apmidi) return "Journée";
    if (matin)           return "Matin";
    return "Après-midi";
  }

  function el(id) { return document.getElementById(id); }

  // ── Rendu boutons début ───────────────────────────────────
  function renderDebut() {
    const s   = state.debut;
    const err = getErrors();

    el("btn-debut-matin").className  = "pbtn " + (s.matin  ? (err.debutMatin  ? "err" : "on") : "off");
    el("btn-debut-apmidi").className = "pbtn " + (s.apmidi ? (err.debutApmidi ? "err" : "on") : "off");
    el("f-periode-debut").value      = periodeStr(s);

    const errMsg = err.debutMsg || "";
    el("hint-debut").textContent = errMsg;

    // Activer les boutons si une date est saisie
    el("toggle-debut").classList.toggle("active", !!el("f-debut").value);
  }

  // ── Rendu boutons fin ─────────────────────────────────────
  function renderFin() {
    const s   = state.fin;
    const err = getErrors();
    const finVal = el("f-fin").value;

    el("btn-fin-matin").className  = "pbtn " + (s.matin  ? (err.finMatin  ? "err" : "on") : "off");
    el("btn-fin-apmidi").className = "pbtn " + (s.apmidi ? (err.finApmidi ? "err" : "on") : "off");
    el("f-periode-fin").value      = periodeStr(s);

    const errMsg = err.finMsg || "";
    el("hint-fin").textContent = errMsg;

    // Activer les boutons si une date de fin est saisie
    el("toggle-fin").classList.toggle("active", !!finVal);
  }

  // ── Détection des erreurs de continuité ───────────────────
  // Règles :
  //  1. Début sans après-midi → impossible de finir un autre jour
  //  2. Fin sans matin → trou (la vraie fin serait la veille)
  //  3. Même jour, début = après-midi → fin ne peut pas inclure le matin
  function getErrors() {
    const sd     = state.debut;
    const sf     = state.fin;
    const dVal   = el("f-debut").value;
    const fVal   = el("f-fin").value;
    const errors = {};

    // Règle 1
    if (dVal && fVal && fVal > dVal && !sd.apmidi) {
      errors.debutApmidi = true;
      errors.debutMsg    = "Sans après-midi au début, la fin ne peut pas être un autre jour";
    }

    // Règle 2
    if (fVal && !sf.matin) {
      errors.finMatin = true;
      errors.finMsg   = "La fin doit inclure le matin";
    }

    // Règle 3
    if (dVal && fVal && dVal === fVal && !sd.matin && sf.matin) {
      errors.finMatin = true;
      errors.finMsg   = "Même jour : début après-midi, fin ne peut pas inclure le matin";
    }

    return errors;
  }

  // ── Section fin : visible dès que la date début est saisie ──
  // On ne cache JAMAIS la fin — on affiche juste une erreur rouge
  // si la combinaison crée un trou de continuité.
  function updateFinSection() {
    const dVal = el("f-debut").value;
    el("fin-section").style.display = dVal ? "" : "none";
    
    const hidden_end = state.debut.matin && !state.debut.apmidi;

    if (!dVal) {
      el("fin-section").style.display = "none";
    } else if (hidden_end) {
      el("fin-section").style.display = "none";
      el("f-fin").value = "";
      state.fin = { matin: true, apmidi: true };
      renderFin();
    } else {
      el("fin-section").style.display = "";
    }
  }

  // ── Preview du nombre de jours ────────────────────────────
  function updatePreview() {
    const dVal = el("f-debut").value;
    const fVal = el("f-fin").value;
    const fin  = (fVal && fVal >= dVal) ? fVal : dVal;
    const pd   = el("f-periode-debut").value;
    const pf   = (fVal && fVal >= dVal) ? el("f-periode-fin").value : pd;
    const box  = el("preview-days");

    if (!dVal) { box.style.display = "none"; return; }

    // Ne pas afficher si erreurs de continuité
    const err = getErrors();
    if (err.debutMsg || err.finMsg) { box.style.display = "none"; return; }

    const nb = calculateDays(dVal, fin, pd, pf);
    box.style.display = "block";
    box.innerHTML = `<strong>${nb} jour${nb > 1 ? "s" : ""}</strong> ouvré${nb > 1 ? "s" : ""}`;
  }

  // ── Sync global ───────────────────────────────────────────
  function sync() {
    renderDebut();
    updateFinSection();
    renderFin();
    updatePreview();
  }

  // ── API publique ──────────────────────────────────────────
  return {

    // Appelé quand la date de début change
    onDebutChange() {
      const dVal = el("f-debut").value;
      // Forcer la date min de fin = date de début
      el("f-fin").min = dVal || "";
      // Si la fin est avant le début, la vider
      if (el("f-fin").value && el("f-fin").value < dVal) {
        el("f-fin").value = "";
        state.fin = { matin: true, apmidi: true };
      }
      sync();
    },

    // Appelé quand la date de fin change
    onFinChange() {
      sync();
    },

    // Toggle bouton début
    toggleDebut(half) {
      const s = state.debut;
      if (half === "Matin") {
        if (s.matin && !s.apmidi) return; // seul actif
        s.matin = !s.matin;
      } else {
        if (!s.matin && s.apmidi) return; // seul actif
        s.apmidi = !s.apmidi;
      }
      sync();
    },

    // Toggle bouton fin
    toggleFin(half) {
      const s = state.fin;
      if (half === "Matin") {
        if (s.matin && !s.apmidi) return; // seul actif
        s.matin = !s.matin;
      } else {
        if (!s.matin && s.apmidi) return; // seul actif
        s.apmidi = !s.apmidi;
      }
      sync();
    },

    // Valeurs à soumettre
    getValues() {
      const dVal = el("f-debut").value;
      const fVal = el("f-fin").value;
      const fin  = (fVal && fVal >= dVal) ? fVal : dVal;
      const pd   = el("f-periode-debut").value;
      const pf   = (fVal && fVal >= dVal) ? el("f-periode-fin").value : pd;
      return { debut: dVal, fin, periodeDebut: pd, periodeFin: pf };
    },

    // Vérifie si le formulaire est valide avant soumission
    isValid() {
      const err = getErrors();
      return !err.debutMsg && !err.finMsg && !!el("f-debut").value;
    },

    // Reset complet
    reset() {
      el("f-debut").value = "";
      el("f-fin").value   = "";
      state.debut = { matin: true, apmidi: true };
      state.fin   = { matin: true, apmidi: true };
      sync();
    },
  };

})();