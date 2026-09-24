import { useEffect, useRef, useState } from 'react'
import Alert from '../common/Alert'
import { ReservationStatusBadge } from '../common/StatusBadge'
import { Trajet, CheckIcon } from '../common/Icons'
import { formatDateTime, STATUT_LABELS } from '../../utils/format'
import { api } from '../../services/api'

const STATUT_STEPS = ['en_attente', 'confirmee', 'terminee']
const POLL_INTERVAL_MS = 15000

/**
 * Affiche le détail d'une réservation identifiée par sa référence, et se
 * met à jour toute seule en arrière-plan (sondage) tant que le statut
 * n'est pas final. Utilisé à la fois juste après la création d'une
 * réservation (ReservationSummary) et sur la page de suivi (ReservationStatus),
 * pour que le client voie les changements faits par l'admin sans recharger.
 */
export default function ReservationLiveStatus({ initialReservation }) {
  const [reservation, setReservation] = useState(initialReservation)
  const [statutChange, setStatutChange] = useState(null)
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const previousStatut = useRef(initialReservation?.statut ?? null)
  const pollRef = useRef(null)

  useEffect(() => {
    setReservation(initialReservation)
    previousStatut.current = initialReservation?.statut ?? null
    setStatutChange(null)
  }, [initialReservation?.reference])

  async function poll(ref) {
    try {
      const res = await api.lookupReservation(ref)

      if (previousStatut.current && previousStatut.current !== res.data.statut) {
        const message = `Votre réservation est maintenant : ${
          STATUT_LABELS[res.data.statut] || res.data.statut
        }`
        setStatutChange(message)

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('TaxiGo — Mise à jour de votre réservation', { body: message })
        }
      }

      previousStatut.current = res.data.statut
      setReservation(res.data)
    } catch {
      // sondage silencieux : une erreur ponctuelle (réseau...) est ignorée
    }
  }

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)

    if (reservation && !['annulee', 'terminee'].includes(reservation.statut)) {
      pollRef.current = setInterval(() => poll(reservation.reference), POLL_INTERVAL_MS)
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservation?.reference, reservation?.statut])

  function requestNotificationPermission() {
    if (typeof Notification === 'undefined') return
    Notification.requestPermission().then(setNotifPermission)
  }

  if (!reservation) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {statutChange && (
        <div className="mb-6">
          <Alert variant="success">{statutChange}</Alert>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-sm text-slate-500">{reservation.reference}</p>
          <p className="text-base font-bold text-ink-900">
            <Trajet depart={reservation.lieu_depart} destination={reservation.destination} />
          </p>
        </div>
        <ReservationStatusBadge statut={reservation.statut} />
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Prévu le {formatDateTime(reservation.date_heure)} pour {reservation.nombre_passagers}{' '}
        passager(s)
      </p>

      {reservation.statut === 'annulee' ? (
        <Alert variant="error" className="mt-6">
          Cette réservation a été annulée.
        </Alert>
      ) : (
        <ol className="mt-6 flex items-center justify-between">
          {STATUT_STEPS.map((step, idx) => {
            const currentIdx = STATUT_STEPS.indexOf(reservation.statut)
            const reached = currentIdx >= idx
            return (
              <li key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      reached ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="mt-1 text-center text-[11px] font-medium text-slate-600">
                    {step === 'en_attente' && 'En attente'}
                    {step === 'confirmee' && 'Confirmée'}
                    {step === 'terminee' && 'Terminée'}
                  </span>
                </div>
                {idx < STATUT_STEPS.length - 1 && (
                  <span
                    className={`mx-2 h-0.5 flex-1 ${reached ? 'bg-brand-600' : 'bg-slate-200'}`}
                  />
                )}
              </li>
            )
          })}
        </ol>
      )}

      {reservation.chauffeur_nom && (
        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-ink-800">Chauffeur assigné</p>
          <p className="text-slate-600">
            {reservation.chauffeur_prenom} {reservation.chauffeur_nom}
            {reservation.immatriculation && ` — ${reservation.immatriculation}`}
          </p>
        </div>
      )}

      {reservation.historique?.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="mb-3 text-sm font-semibold text-ink-800">Historique</p>
          <ul className="space-y-3">
            {[...reservation.historique].reverse().map((h) => (
              <li key={h.id} className="flex items-start gap-3 text-sm">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                <div>
                  <p className="text-slate-700">
                    Statut :{' '}
                    <span className="font-medium">
                      {STATUT_LABELS[h.nouveau_statut] || h.nouveau_statut}
                    </span>
                    {h.commentaire ? ` — ${h.commentaire}` : ''}
                  </p>
                  <p className="text-xs text-slate-400">{formatDateTime(h.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!['annulee', 'terminee'].includes(reservation.statut) && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-4 text-xs text-slate-600">
          <span>Cette page se met à jour automatiquement toutes les 15 secondes.</span>
          {notifPermission === 'default' && (
            <button
              onClick={requestNotificationPermission}
              className="shrink-0 font-semibold text-brand-600 hover:underline"
            >
              Activer les notifications
            </button>
          )}
          {notifPermission === 'granted' && (
            <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-emerald-600">
              Notifications activées
              <CheckIcon className="h-4 w-4" />
            </span>
          )}
        </div>
      )}
    </div>
  )
}
