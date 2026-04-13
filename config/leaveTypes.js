// ============================================================
//  FICHIER DE CONFIGURATION DES TYPES DE CONGÉS
//  Éditez ce fichier pour ajouter / modifier / supprimer des types.
//  Chaque type doit avoir un id unique.
// ============================================================
/* jshint esversion: 6 */
/* jshint strict: true */

const LEAVE_TYPES = [
  {
    id: "CP",
    label: "Congés payés",
    color: { bg: "#E1F5EE", text: "#0F6E56", dot: "#1D9E75" },
    requiresValidation: true,
  },
  {
    id: "RTT",
    label: "RTT",
    color: { bg: "#E6F1FB", text: "#185FA5", dot: "#378ADD" },
    requiresValidation: true,
  },
  {
    id: "MALADIE",
    label: "Maladie",
    color: { bg: "#FCEBEB", text: "#791F1F", dot: "#E24B4A" },
    requiresValidation: false,
  },
  {
    id: "FAMILLE",
    label: "Événement familial",
    color: { bg: "#FBEAF0", text: "#72243E", dot: "#D4537E" },
    requiresValidation: true,
  },
  {
    id: "FORMATION",
    label: "Formation",
    color: { bg: "#EEEDFE", text: "#3C3489", dot: "#7F77DD" },
    requiresValidation: true,
  },
  {
    id: "SANS_SOLDE",
    label: "Congé sans solde",
    color: { bg: "#F1EFE8", text: "#5F5E5A", dot: "#888780" },
    requiresValidation: true,
  },
  {
    id: "AUTRE",
    label: "Autre",
    color: { bg: "#FAEEDA", text: "#854F0B", dot: "#EF9F27" },
    requiresValidation: true,
  },
];

function getLeaveType(id) {
  return LEAVE_TYPES.find((t) => t.id === id) || LEAVE_TYPES[LEAVE_TYPES.length - 1];
}
