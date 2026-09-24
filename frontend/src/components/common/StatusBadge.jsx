import { STATUT_LABELS, STATUT_STYLES, DISPO_LABELS, DISPO_STYLES } from '../../utils/format'

export function ReservationStatusBadge({ statut }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUT_STYLES[statut] || ''}`}
    >
      {STATUT_LABELS[statut] || statut}
    </span>
  )
}

export function DisponibiliteBadge({ statut }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${DISPO_STYLES[statut] || ''}`}
    >
      {DISPO_LABELS[statut] || statut}
    </span>
  )
}
