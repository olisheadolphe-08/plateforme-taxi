import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Spinner from '../../components/common/Spinner'
import Alert from '../../components/common/Alert'
import EmptyState from '../../components/common/EmptyState'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import { ReservationStatusBadge } from '../../components/common/StatusBadge'
import { Trajet } from '../../components/common/Icons'
import { STATUT_LABELS, formatDateTime } from '../../utils/format'
import { api } from '../../services/api'

const statutOptions = [
  { value: '', label: 'Tous les statuts' },
  ...Object.entries(STATUT_LABELS).map(([value, label]) => ({ value, label }))
]

export default function Reservations() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statut = searchParams.get('statut') || ''
  const page = Number(searchParams.get('page') || '1')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [reservations, setReservations] = useState([])
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .adminReservations({ statut, search: searchParams.get('search') || '', page })
      .then((res) => {
        setReservations(res.data.items)
        setMeta(res.data.meta)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [statut, page, searchParams])

  function updateParams(patch) {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    setSearchParams(next)
  }

  function handleStatutChange(value) {
    // Revenir à la page 1 dès qu'un filtre change, sinon on peut se
    // retrouver sur une page qui n'existe plus pour le nouveau filtre.
    updateParams({ statut: value, page: null })
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    updateParams({ search: search || null, page: null })
  }

  function goToPage(p) {
    updateParams({ page: p > 1 ? String(p) : null })
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">Réservations</h1>
          <p className="mt-1 text-sm text-slate-500">Consultez et traitez les demandes reçues.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              name="search"
              placeholder="Nom, téléphone, référence…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <Select
            name="statut"
            value={statut}
            options={statutOptions}
            onChange={(e) => handleStatutChange(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6">
        {loading && <Spinner />}
        {!loading && error && <Alert variant="error">{error}</Alert>}
        {!loading && !error && reservations.length === 0 && (
          <EmptyState
            title="Aucune réservation trouvée"
            description="Modifiez les filtres ou attendez de nouvelles demandes."
          />
        )}

        {!loading && !error && reservations.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Référence</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Trajet</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.reference}</td>
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {r.prenom_client} {r.nom_client}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <Trajet depart={r.lieu_depart} destination={r.destination} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(r.date_heure)}</td>
                    <td className="px-4 py-3">
                      <ReservationStatusBadge statut={r.statut} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/reservations/${r.id}`}
                        className="text-sm font-semibold text-brand-700 hover:underline"
                      >
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && meta && meta.total_pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <p>
              {meta.total} réservation{meta.total > 1 ? 's' : ''} — page {meta.page} sur{' '}
              {meta.total_pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => goToPage(meta.page - 1)}
                disabled={meta.page <= 1}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                onClick={() => goToPage(meta.page + 1)}
                disabled={meta.page >= meta.total_pages}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
