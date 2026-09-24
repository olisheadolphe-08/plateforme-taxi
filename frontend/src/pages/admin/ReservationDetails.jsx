import { useEffect, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import Spinner from '../../components/common/Spinner'
import Alert from '../../components/common/Alert'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import Button from '../../components/common/Button'
import { ReservationStatusBadge } from '../../components/common/StatusBadge'
import { ArrowLeftIcon } from '../../components/common/Icons'
import { STATUT_LABELS, formatDateTime } from '../../utils/format'
import { api, ApiError } from '../../services/api'

const statutOptions = Object.entries(STATUT_LABELS).map(([value, label]) => ({ value, label }))

export default function ReservationDetails() {
  const { id } = useParams()
  const [reservation, setReservation] = useState(null)
  const [taxis, setTaxis] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const [nouveauStatut, setNouveauStatut] = useState('')
  const [taxiId, setTaxiId] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([api.adminReservation(id), api.taxis('disponible')])
      .then(([resRes, taxiRes]) => {
        setReservation(resRes.data)
        setNouveauStatut(resRes.data.statut)
        setTaxiId(resRes.data.taxi_id || '')
        setTaxis(taxiRes.data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function handleUpdate(e) {
    e.preventDefault()
    setFormError(null)

    if (nouveauStatut === 'confirmee' && !taxiId && !reservation.taxi_id) {
      setFormError('Veuillez assigner un taxi pour confirmer cette réservation.')
      return
    }

    setSaving(true)
    try {
      const res = await api.updateReservationStatut(id, {
        statut: nouveauStatut,
        commentaire,
        taxi_id: taxiId || null
      })
      setReservation(res.data)
      setCommentaire('')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />
  if (error) return <Alert variant="error">{error}</Alert>

  return (
    <div>
      <Link
        to="/admin/reservations"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Retour à la liste
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-mono text-sm text-slate-500">{reservation.reference}</h1>
          <p className="text-2xl font-extrabold text-ink-900">
            {reservation.prenom_client} {reservation.nom_client}
          </p>
        </div>
        <ReservationStatusBadge statut={reservation.statut} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-ink-900">Détails du trajet</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Téléphone" value={reservation.telephone_client} />
              <Field label="Email" value={reservation.email_client || '—'} />
              <Field label="Départ" value={reservation.lieu_depart} />
              <Field label="Destination" value={reservation.destination} />
              <Field label="Date et heure" value={formatDateTime(reservation.date_heure)} />
              <Field label="Passagers" value={reservation.nombre_passagers} />
              {reservation.remarque && (
                <Field label="Remarque" value={reservation.remarque} className="sm:col-span-2" />
              )}
              {reservation.chauffeur_nom && (
                <Field
                  label="Taxi assigné"
                  value={`${reservation.immatriculation} — ${reservation.chauffeur_prenom} ${reservation.chauffeur_nom}`}
                  className="sm:col-span-2"
                />
              )}
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-ink-900">Historique des statuts</h2>
            <ol className="mt-4 space-y-3">
              {reservation.historique.map((h) => (
                <li key={h.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  <div>
                    <p className="font-medium text-ink-900">
                      {STATUT_LABELS[h.nouveau_statut]}
                      {h.admin_nom && (
                        <span className="font-normal text-slate-500">
                          {' '}
                          par {h.admin_prenom} {h.admin_nom}
                        </span>
                      )}
                    </p>
                    {h.commentaire && <p className="text-slate-500">{h.commentaire}</p>}
                    <p className="text-xs text-slate-400">{formatDateTime(h.created_at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-ink-900">Mettre à jour le statut</h2>
          <form onSubmit={handleUpdate} className="mt-4 space-y-4">
            {formError && <Alert variant="error">{formError}</Alert>}

            <Select
              label="Nouveau statut"
              name="statut"
              value={nouveauStatut}
              options={statutOptions}
              onChange={(e) => setNouveauStatut(e.target.value)}
            />

            {nouveauStatut === 'confirmee' && (
              <Select
                label="Assigner un taxi"
                name="taxi_id"
                value={taxiId}
                options={[
                  { value: '', label: 'Sélectionner un taxi disponible' },
                  ...taxis.map((t) => ({
                    value: t.id,
                    label: `${t.immatriculation} — ${t.marque} ${t.modele}`
                  }))
                ]}
                onChange={(e) => setTaxiId(e.target.value)}
              />
            )}

            <Textarea
              label="Commentaire (optionnel)"
              name="commentaire"
              placeholder="Motif d'annulation, précision, etc."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
            />

            <Button type="submit" loading={saving} className="w-full">
              Enregistrer
            </Button>
          </form>
        </section>
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
