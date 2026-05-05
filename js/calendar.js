// ============================================================
//  COMPOSANT CALENDRIER (calendar.js)
//  Rendu du calendrier mensuel avec affichage des congés
//  Tient compte des périodes (Matin/Midi/Soir/Journée)
//  pour ne pas afficher un badge sur un demi-jour absent.
// ============================================================

class LeaveCalendar {
  constructor(gridId, titleId, legendId) {
    this.gridId   = gridId;
    this.titleId  = titleId;
    this.legendId = legendId;
    this.current  = new Date();
    this.leaves   = [];
    this._dayHeaders = null;
  }

  setLeaves(leaves) {
    // On n'affiche que les congés approuvés
    this.leaves = leaves.filter((l) => l.status === "approved");
    this.render();
  }

  prevMonth() { this.current = new Date(this.current.getFullYear(), this.current.getMonth() - 1, 1); this.render(); }
  nextMonth() { this.current = new Date(this.current.getFullYear(), this.current.getMonth() + 1, 1); this.render(); }
  goToday()   { this.current = new Date(); this.render(); }

  // ── Est-ce qu'un congé "couvre" vraiment un jour donné ? ──
  // Un congé couvre un jour si :
  //   - C'est un jour intermédiaire (ni début ni fin) → toujours oui
  //   - C'est le jour de début → oui sauf si periodeDebut = "Midi" ou "Soir"
  //     (l'employé est là le matin)
  //   - C'est le jour de fin → oui sauf si periodeFin = "Matin"
  //     (l'employé revient l'après-midi)
  _coversDay(leave, dateStr) {
    if (dateStr < leave.debut || dateStr > leave.fin) return false;

    const pd = leave.periodeDebut || "Journée";
    const pf = leave.periodeFin   || "Journée";

    // Jour de début : absent seulement à partir de la période début
    // Si periodeDebut = "Midi" ou "Soir", le matin il est là → on affiche quand même
    // (on considère que le badge = "absent une partie du jour" → on affiche toujours)
    // SAUF : si c'est le SEUL jour ET que la période couvre moins d'une demi-journée
    // La vraie règle métier demandée : sur le jour de fin, si periodeFin = "Matin",
    // le salarié revient l'après-midi → ne PAS afficher le badge ce jour-là.
    if (dateStr === leave.fin && leave.fin !== leave.debut) {
      if (pf === "Matin") return false; // revient l'après-midi
    }

    // Sur le jour de début, si periodeDebut = "Soir", il est là toute la journée sauf fin
    // → on affiche quand même (absent le soir)
    // Pas de cas à exclure côté début selon la règle actuelle.

    return true;
  }

  render() {
    const year  = this.current.getFullYear();
    const month = this.current.getMonth();
    const today = new Date();

    // Titre
    const titleEl = document.getElementById(this.titleId);
    if (titleEl) {
      titleEl.textContent = new Date(year, month, 1)
        .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
        .replace(/^\w/, (c) => c.toUpperCase());
    }

    const grid = document.getElementById(this.gridId);
    if (!grid) return;

    // Sauvegarder les en-têtes
    if (!this._dayHeaders) {
      this._dayHeaders = Array.from(grid.querySelectorAll(".cal-day-name"))
        .map((el) => el.cloneNode(true));
    }
    grid.innerHTML = "";
    this._dayHeaders.forEach((h) => grid.appendChild(h.cloneNode(true)));

    // Calculs
    let startDow = new Date(year, month, 1).getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    const daysInMonth   = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const totalCells    = Math.ceil((startDow + daysInMonth) / 7) * 7;

    // Légende : personnes présentes ce mois
    const mStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const mEnd   = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
    const names  = new Set();
    this.leaves.forEach((l) => {
      if (l.debut <= mEnd && l.fin >= mStart) names.add(l.employeeName);
    });

    const legendEl = document.getElementById(this.legendId);
    if (legendEl) {
      legendEl.innerHTML = [...names].map((name) => {
        const col = avatarColor(name);
        return `<div class="cal-legend-item">
          <div class="cal-legend-dot" style="background:${col.text}"></div>
          <span>${name}</span>
        </div>`;
      }).join("");
    }

    // Cellules
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement("div");
      cell.className = "cal-cell";

      let d, m2 = month, y2 = year;
      if (i < startDow) {
        d = prevMonthDays - startDow + i + 1; m2 = month - 1;
        cell.classList.add("other-month");
      } else if (i >= startDow + daysInMonth) {
        d = i - startDow - daysInMonth + 1; m2 = month + 1;
        cell.classList.add("other-month");
      } else {
        d = i - startDow + 1;
      }

      if (m2 < 0)  { m2 = 11; y2--; }
      if (m2 > 11) { m2 = 0;  y2++; }

      const isToday = d === today.getDate() && m2 === today.getMonth() && y2 === today.getFullYear();
      if (isToday) cell.classList.add("today");

      const dateStr = `${y2}-${String(m2 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cell.innerHTML = `<div class="cal-num">${d}</div>`;

      // Congés couvrant ce jour (avec gestion des périodes)
      const onDay = this.leaves.filter((l) => this._coversDay(l, dateStr));

      onDay.slice(0, 2).forEach((l) => {
        const col = avatarColor(l.employeeName);
        const b = document.createElement("div");
        b.className = "cal-badge";
        b.style.cssText = `background:${col.bg};color:${col.text}`;
        b.title = `${l.employeeName} – ${l.typeLabel}`;
        b.textContent = l.employeeName.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
        cell.appendChild(b);
      });

      if (onDay.length > 2) {
        const more = document.createElement("div");
        more.className = "cal-badge";
        more.style.cssText = "background:var(--bg2);color:var(--text2)";
        more.textContent = `+${onDay.length - 2}`;
        cell.appendChild(more);
      }

      grid.appendChild(cell);
    }
  }
}