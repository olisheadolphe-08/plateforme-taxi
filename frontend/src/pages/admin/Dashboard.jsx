import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Spinner from '../../components/common/Spinner'
import Alert from '../../components/common/Alert'
import StatCard from '../../components/admin/StatCard'
import { STATUT_LABELS } from '../../utils/format'
import { api } from '../../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .dashboard()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (error) return <Alert variant="error">{error}</Alert>

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink-900">Tableau de bord</h1>
      <p className="mt-1 text-sm text-slate-500">Vue d'ensemble de l'activité de réservation.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Réservations totales" value={stats.total} />
        <StatCard label="Aujourd'hui" value={stats.aujourdhui} accent="text-brand-600" />
        {Object.entries(stats.par_statut).map(([statut, total]) => (
          <StatCard key={statut} label={STATUT_LABELS[statut]} value={total} />
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/admin/reservations?statut=en_attente"
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Traiter les réservations en attente
        </Link>
        <Link
          to="/admin/taxis"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800"
        >
          Voir la disponibilité des taxis
        </Link>
      </div>
    </div>
  )
}
