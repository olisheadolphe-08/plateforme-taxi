export const STATUT_LABELS = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  annulee: 'Annulée',
  terminee: 'Terminée'
}

export const STATUT_STYLES = {
  en_attente: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmee: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  annulee: 'bg-rose-100 text-rose-800 border-rose-200',
  terminee: 'bg-slate-200 text-slate-700 border-slate-300'
}

export const DISPO_LABELS = {
  disponible: 'Disponible',
  indisponible: 'Indisponible',
  en_course: 'En course'
}

export const DISPO_STYLES = {
  disponible: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  indisponible: 'bg-slate-200 text-slate-700 border-slate-300',
  en_course: 'bg-sky-100 text-sky-800 border-sky-200'
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Formate une durée écoulée depuis une date en texte court et lisible
 * (ex : "12 min", "1h 05", "2j"). Utilisé pour afficher depuis combien de
 * temps un chauffeur est en course (basé sur son updated_at).
 */
export function formatElapsed(value) {
  if (!value) return null
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return null

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return 'à l\'instant'

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'à l\'instant'
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const remMinutes = minutes % 60
  if (hours < 24) return `${hours}h${remMinutes > 0 ? ` ${String(remMinutes).padStart(2, '0')}` : ''}`

  const days = Math.floor(hours / 24)
  return `${days} j`
}
