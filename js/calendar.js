// ============================================================
//  COMPOSANT CALENDRIER (calendar.js)
//  Rendu du calendrier mensuel avec barres de couleur continues
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

    // Palette de couleurs par employé (stable via hash)
    const PALETTE = [
      { bg: "#DBEAFE", bar: "#3B82F6", text: "#1E3A8A" },
      { bg: "#D1FAE5", bar: "#10B981", text: "#064E3B" },
      { bg: "#FEF3C7", bar: "#F59E0B", text: "#78350F" },
      { bg: "#FCE7F3", bar: "#EC4899", text: "#831843" },
      { bg: "#EDE9FE", bar: "#8B5CF6", text: "#4C1D95" },
      { bg: "#FFEDD5", bar: "#F97316", text: "#7C2D12" },
      { bg: "#CFFAFE", bar: "#06B6D4", text: "#164E63" },
      { bg: "#F0FDF4", bar: "#22C55E", text: "#14532D" },
      { bg: "#FEE2E2", bar: "#EF4444", text: "#7F1D1D" },
      { bg: "#F5F3FF", bar: "#7C3AED", text: "#2E1065" },
      { bg: "#FDF2F8", bar: "#D946EF", text: "#701A75" },
      { bg: "#ECFDF5", bar: "#059669", text: "#022C22" },
    ];

    function employeeColor(name) {
      let h = 0;
      for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
      return PALETTE[h % PALETTE.length];
    }

    // Légende des personnes présentes ce mois
    const mStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const mEnd   = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const presentLeaves = this.leaves.filter((l) => l.debut <= mEnd && l.fin >= mStart);
    const namesSet = new Set(presentLeaves.map((l) => l.employeeName));

    const legendEl = document.getElementById(this.legendId);
    if (legendEl) {
      legendEl.innerHTML = [...namesSet].map((name) => {
        const col = employeeColor(name);
        return `<div class="cal-legend-item">
          <div class="cal-legend-dot" style="background:${col.bar}"></div>
          <span>${name}</span>
        </div>`;
      }).join("");
    }

    // Attribution d'une ligne par congé pour éviter les chevauchements
    // On calcule les "tracks" (lignes) pour l'affichage des barres
    function assignTracks(leaves) {
      const sorted = [...leaves].sort((a, b) => a.debut.localeCompare(b.debut));
      const tracks = []; // chaque track = tableau de congés non chevauchants
      sorted.forEach((leave) => {
        let placed = false;
        for (const track of tracks) {
          const last = track[track.length - 1];
          if (last.fin < leave.debut) {
            track.push(leave);
            placed = true;
            break;
          }
        }
        if (!placed) tracks.push([leave]);
      });
      // Retourne un Map leaveId -> trackIndex
      const map = new Map();
      tracks.forEach((track, i) => track.forEach((l) => map.set(l.id, i)));
      return map;
    }

    const trackMap = assignTracks(this.leaves.filter((l) => l.debut <= mEnd && l.fin >= mStart));

    // Cellules
    const cells = [];
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
      cell.dataset.date = dateStr;

      cells.push({ cell, dateStr, colIndex: i % 7 });
      grid.appendChild(cell);
    }

    // Rendu des barres de congé
    // Pour chaque congé, on dessine une barre qui s'étend sur les cellules concernées
    // En coupant les lignes à chaque début de semaine
    this.leaves.filter((l) => l.debut <= mEnd && l.fin >= mStart).forEach((leave) => {
      const col   = employeeColor(leave.employeeName);
      const track = trackMap.get(leave.id) ?? 0;
      const prénom = leave.employeeName.split(" ")[0];

      // Trouver les cellules concernées dans le mois affiché
      const concerned = cells.filter((c) => c.dateStr >= leave.debut && c.dateStr <= leave.fin && !c.cell.classList.contains("other-month"));
      if (!concerned.length) return;

      // Grouper par semaine (ligne dans la grille)
      const byWeek = new Map();
      concerned.forEach((c) => {
        const weekIdx = Math.floor(cells.indexOf(c) / 7);
        if (!byWeek.has(weekIdx)) byWeek.set(weekIdx, []);
        byWeek.get(weekIdx).push(c);
      });

byWeek.forEach((weekCells) => {
  const first  = weekCells[0];
  const last   = weekCells[weekCells.length - 1];
  const isStart = first.dateStr === leave.debut;
  const isEnd   = last.dateStr  === leave.fin;

  // ── Demi-journée : uniquement sur la cellule concernée ──
  // On détermine si ce segment de semaine est la 1re ou la dernière tranche
  const halfDay = leave.halfDay ?? null; // "morning" | "afternoon" | null

  // left/width en % de cellule (0-100).  1 cellule = 100%.
  // Pour une barre multi-cellules on travaille en px via calc().
  const isMorningOnly   = halfDay === "morning"   && isStart && first === last;
  const isAfternoonOnly = halfDay === "afternoon" && isEnd   && first === last;

  // Décalage gauche et largeur selon la demi-journée
  let leftOffset, barWidth;

  if (isAfternoonOnly) {
    // Barre sur la moitié droite de la cellule
    leftOffset = `calc(50%)`;
    barWidth   = `calc(50% - 4px)`;
  } else if (isMorningOnly) {
    // Barre sur la moitié gauche de la cellule
    leftOffset = isStart ? "4px" : "0";
    barWidth   = `calc(50% - 4px)`;
  } else {
    // Comportement normal (journée entière ou barre multi-cellules)
    leftOffset = isStart ? "4px" : "0";
    barWidth   = `calc(${spanCount * 100}% + ${spanCount - 1}px - ${isStart ? "4px" : "0px"} - ${isEnd ? "4px" : "0px"})`;
  }

  // Border-radius : arrondi à gauche si début, à droite si fin
  const rrTL = (isStart && !isAfternoonOnly) ? "4px" : "0";
  const rrTR = (isEnd   && !isMorningOnly)   ? "4px" : "0";
  const rrBR = rrTR;
  const rrBL = rrTL;

  bar.style.cssText = `
    position: absolute;
    top: ${top}px;
    left: ${leftOffset};
    width: ${barWidth};
    height: ${BAR_HEIGHT}px;
    background: ${col.bar};
    color: #fff;
    font-size: 11px;
    font-weight: 500;
    line-height: ${BAR_HEIGHT}px;
    padding: 0 6px;
    border-radius: ${rrTL} ${rrTR} ${rrBR} ${rrBL};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    z-index: 2;
    cursor: default;
    box-sizing: border-box;
  `;

  // Afficher le prénom uniquement sur le 1er segment visible
  bar.textContent = (first.dateStr === leave.debut || first.colIndex === 0) ? prénom : "";

  first.cell.style.position = "relative";
  first.cell.style.overflow = "visible";
  first.cell.appendChild(bar);
});
    });

    // Assurer que les cellules ont assez de hauteur pour les barres
    const maxTracks = Math.max(0, ...Array.from(trackMap.values())) + 1;
    const minHeight = 22 + maxTracks * 20 + 6;
    grid.querySelectorAll(".cal-cell:not(.cal-day-name)").forEach((c) => {
      c.style.minHeight = `${Math.max(minHeight, 60)}px`;
    });
  }
}