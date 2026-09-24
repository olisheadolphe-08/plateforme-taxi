import { useEffect, useState } from 'react'
import Spinner from '../../components/common/Spinner'
import Alert from '../../components/common/Alert'
import EmptyState from '../../components/common/EmptyState'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import { DisponibiliteBadge } from '../../components/common/StatusBadge'
import { DISPO_LABELS } from '../../utils/format'
import { api, ApiError } from '../../services/api'

const emptyForm = {
  id: null,
  immatriculation: '',
  modele: '',
  marque: '',
  nombre_places: 4,
  statut: 'disponible',
  chauffeur_id: ''
}

const statutOptions = Object.entries(DISPO_LABELS).map(([value, label]) => ({ value, label }))

export default function Taxis() {
  const [taxis, setTaxis] = useState([])
  const [chauffeurs, setChauffeurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  function load() {
    setLoading(true)
    Promise.all([api.taxis(), api.chauffeurs()])
      .then(([taxiRes, chauffeurRes]) => {
        setTaxis(taxiRes.data)
        setChauffeurs(chauffeurRes.data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function startCreate() {
    setForm(emptyForm)
    setFormErrors({})
    setShowForm(true)
  }

  function startEdit(taxi) {
    setForm({
      id: taxi.id,
      immatriculation: taxi.immatriculation,
      modele: taxi.modele,
      marque: taxi.marque,
      nombre_places: taxi.nombre_places,
      statut: taxi.statut,
      chauffeur_id: taxi.chauffeur_id || ''
    })
    setFormErrors({})
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormErrors({})
    setSaving(true)

    const payload = {
      ...form,
      nombre_places: Number(form.nombre_places),
      chauffeur_id: form.chauffeur_id || null
    }

    try {
      if (form.id) {
        await api.updateTaxi(form.id, payload)
      } else {
        await api.createTaxi(payload)
      }
      setShowForm(false)
      load()
    } catch (err) {
      if (err instanceof ApiError && err.errors) setFormErrors(err.errors)
      else setFormErrors({ _global: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce taxi ?')) return
    await api.deleteTaxi(id)
    load()
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">Taxis</h1>
          <p className="mt-1 text-sm text-slate-500">Parc de véhicules et disponibilité.</p>
        </div>
        <Button variant="success" onClick={startCreate}>+ Ajouter un taxi</Button>
      </div>

      {error && (
        <div className="mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
        >
          {formErrors._global && (
            <div className="sm:col-span-2">
              <Alert variant="error">{formErrors._global}</Alert>
            </div>
          )}
          <Input
            label="Immatriculation"
            value={form.immatriculation}
            error={formErrors.immatriculation}
            onChange={(e) => setForm({ ...form, immatriculation: e.target.value })}
          />
          <Input
            label="Marque"
            value={form.marque}
            error={formErrors.marque}
            onChange={(e) => setForm({ ...form, marque: e.target.value })}
          />
          <Input
            label="Modèle"
            value={form.modele}
            error={formErrors.modele}
            onChange={(e) => setForm({ ...form, modele: e.target.value })}
          />
          <Input
            label="Nombre de places"
            type="number"
            min={1}
            max={20}
            value={form.nombre_places}
            error={formErrors.nombre_places}
            onChange={(e) => setForm({ ...form, nombre_places: e.target.value })}
          />
          <Select
            label="Statut"
            options={statutOptions}
            value={form.statut}
            error={formErrors.statut}
            onChange={(e) => setForm({ ...form, statut: e.target.value })}
          />
          <Select
            label="Chauffeur assigné"
            options={[
              { value: '', label: 'Aucun' },
              ...chauffeurs.map((c) => ({ value: c.id, label: `${c.prenom} ${c.nom}` }))
            ]}
            value={form.chauffeur_id}
            onChange={(e) => setForm({ ...form, chauffeur_id: e.target.value })}
          />
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" variant="success" loading={saving}>
              Enregistrer
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6">
        {taxis.length === 0 ? (
          <EmptyState title="Aucun taxi enregistré" description="Ajoutez votre premier véhicule." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Immatriculation</th>
                  <th className="px-4 py-3">Véhicule</th>
                  <th className="px-4 py-3">Places</th>
                  <th className="px-4 py-3">Chauffeur</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taxis.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{t.immatriculation}</td>
                    <td className="px-4 py-3 text-ink-900">
                      {t.marque} {t.modele}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.nombre_places}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.chauffeur_nom ? `${t.chauffeur_prenom} ${t.chauffeur_nom}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <DisponibiliteBadge statut={t.statut} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => startEdit(t)}
                        className="mr-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-300"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 focus:ring-2 focus:ring-rose-300"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
