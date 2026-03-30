// ============================================================
//  COMPOSANT CALENDRIER (calendar.js)
//  Rendu du calendrier mensuel avec affichage des congés
// ============================================================

class LeaveCalendar {
  constructor(gridId, titleId, legendId) {
    this.gridId   = gridId;
    this.titleId  = titleId;
    this.legendId = legendId;
    this.current  = new Date();
    this.leaves   = [];

    // Conserver les en-têtes de jours
    this._dayHeaders = null;
  }

  setLeaves(leaves) {
    // On n'affiche que les congés approuvés sur le calendrier
    this.leaves = leaves.filter((l) => l.status === "approved");
    this.render();
  }

  prevMonth() { this.current = new Date(this.current.getFullYear(), this.current.getMonth() - 1, 1); this.render(); }
  nextMonth() { this.current = new Date(this.current.getFullYear(), this.current.getMonth() + 1, 1); this.render(); }
  goToday()   { this.current = new Date(); this.render(); }

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

    // Grille
    const grid = document.getElementById(this.gridId);
    if (!grid) return;

    // Sauvegarder les en-têtes si pas encore fait
    if (!this._dayHeaders) {
      this._dayHeaders = Array.from(grid.querySelectorAll(".cal-day-name"))
        .map((el) => el.cloneNode(true));
    }
    grid.innerHTML = "";
    this._dayHeaders.forEach((h) => grid.appendChild(h.cloneNode(true)));

    // Calculs
    let startDow = new Date(year, month, 1).getDay();
    startDow = startDow === 0 ? 6 : startDow - 1; // lundi = 0

    const daysInMonth   = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const totalCells    = Math.ceil((startDow + daysInMonth) / 7) * 7;

    // Légende des personnes présentes ce mois
    const names = new Set();
    this.leaves.forEach((l) => {
      const mStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const mEnd   = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
      if (l.debut <= mEnd && l.fin >= mStart) names.add(l.employeeName);
    });

    const legendEl = document.getElementById(this.legendId);
    if (legendEl) {
      legendEl.innerHTML = [...names].map((name) => {
        const emp = EMPLOYEES.find((e) => fullName(e) === name);
        const col = emp ? avatarColor(name) : { bg: "#ddd", text: "#555" };
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

      // Congés du jour
      const onDay = this.leaves.filter((l) => dateStr >= l.debut && dateStr <= l.fin);
      onDay.slice(0, 2).forEach((l) => {
        const emp = EMPLOYEES.find((e) => fullName(e) === l.employeeName);
        const col = emp ? avatarColor(l.employeeName) : { bg: "#eee", text: "#555" };
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
