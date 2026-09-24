import ReservationForm from '../components/reservation/ReservationForm'

export default function Reservation() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold text-ink-900">Demande de réservation</h1>
      <p className="mt-1 text-sm text-slate-600">
        Renseignez les informations ci-dessous. Vous recevrez une référence pour suivre votre
        réservation.
      </p>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <ReservationForm />
      </div>
    </div>
  )
}
