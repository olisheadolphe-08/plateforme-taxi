import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="text-xl font-bold text-ink-900">Page introuvable</h1>
      <Link to="/" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
        Retour à l'accueil
      </Link>
    </div>
  )
}
