import { Link } from 'react-router-dom'

const steps = [
  {
    title: '1. Remplissez le formulaire',
    text: 'Indiquez votre trajet, la date souhaitée et le nombre de passagers.'
  },
  {
    title: '2. Recevez une référence',
    text: 'Votre demande est enregistrée et vous recevez une référence de suivi.'
  },
  {
    title: '3. Suivez votre statut',
    text: 'Consultez à tout moment si votre course est confirmée, en attente ou terminée.'
  }
]

const atouts = [
  { title: 'Chauffeurs vérifiés', text: 'Tous nos chauffeurs sont identifiés et disposent d\'un permis valide.' },
  { title: 'Disponible 24/7', text: 'Réservez à toute heure, pour maintenant ou pour plus tard.' },
  { title: 'Sans engagement', text: 'Aucun paiement en ligne requis pour effectuer une demande.' }
]

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-ink-900 to-ink-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-200">
            Réservation en ligne, sans engagement
          </p>
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">
            Votre taxi, réservé en quelques minutes.
          </h1>
          <p className="mt-4 max-w-xl text-slate-300">
            TaxiGo vous permet de demander une course en ligne et de suivre son statut en temps
            réel, sur ordinateur comme sur mobile.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/reservation"
              className="rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-700"
            >
              Réserver un taxi
            </Link>
            <Link
              to="/suivi"
              className="rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Suivre une réservation
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold text-ink-900">Comment ça marche ?</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-ink-900">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold text-ink-900">Pourquoi choisir TaxiGo ?</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {atouts.map((atout) => (
              <div key={atout.title} className="rounded-xl bg-slate-50 p-6">
                <h3 className="font-bold text-ink-900">{atout.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{atout.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
