import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Spinner from '../components/common/Spinner'
import Alert from '../components/common/Alert'
import ReservationLiveStatus from '../components/reservation/ReservationLiveStatus'
import { CircleCheckIcon } from '../components/common/Icons'
import { api } from '../services/api'

export default function ReservationSummary() {
  const { reference } = useParams()
  const [reservation, setReservation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    api
      .lookupReservation(reference)
      .then((res) => active && setReservation(res.data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [reference])

  if (loading) return <Spinner className="min-h-[60vh]" />

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <Alert variant="error">{error}</Alert>
        <Link to="/reservation" className="mt-6 inline-block text-sm font-semibold text-brand-700">
          Faire une nouvelle demande
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CircleCheckIcon className="mx-auto block h-10 w-10 text-emerald-600" />
        <h1 className="mt-2 text-xl font-extrabold text-ink-900">Réservation enregistrée !</h1>
        <p className="mt-1 text-sm text-slate-600">
          Conservez votre référence pour suivre l'état de votre course. Cette page se met à jour
          automatiquement dès que l'administrateur traite votre demande.
        </p>
        <p className="mt-4 inline-block rounded-lg bg-white px-4 py-2 font-mono text-lg font-bold text-brand-700 shadow-sm">
          {reservation.reference}
        </p>
      </div>

      <div className="mt-8">
        <ReservationLiveStatus initialReservation={reservation} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-base font-bold text-ink-900">Vos coordonnées</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Client" value={`${reservation.prenom_client} ${reservation.nom_client}`} />
          <Field label="Téléphone" value={reservation.telephone_client} />
          {reservation.remarque && (
            <Field label="Remarque" value={reservation.remarque} className="sm:col-span-2" />
          )}
        </dl>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/suivi"
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Suivre cette réservation plus tard
        </Link>
        <Link
          to="/"
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-ink-800"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}

function Field({ label, value, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-ink-900">{value}</dd>
    </div>
  )
}
