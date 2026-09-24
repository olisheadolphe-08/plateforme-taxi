import { useEffect, useState } from 'react'
import Spinner from '../../components/common/Spinner'
import Alert from '../../components/common/Alert'
import EmptyState from '../../components/common/EmptyState'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import { DisponibiliteBadge } from '../../components/common/StatusBadge'
import { DISPO_LABELS, formatElapsed } from '../../utils/format'
import { api, ApiError } from '../../services/api'

const emptyForm = {
  id: null,
  nom: '',
  prenom: '',
  telephone: '',
  numero_permis: '',
  statut: 'disponible'
}

const statutOptions = Object.entries(DISPO_LABELS).map(([value, label]) => ({ value, label }))

export default function Chauffeurs() {
  const [chauffeurs, setChauffeurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  function load() {
    setLoading(true)
    api
      .chauffeurs()
      .then((res) => setChauffeurs(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  // Rafraîchit juste l'affichage (pas de nouvel appel réseau) toutes les
  // 30s, pour que la durée "en course depuis..." reste à jour.
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  function startCreate() {
    setForm(emptyForm)
    setFormErrors({})
    setShowForm(true)
  }

  function startEdit(chauffeur) {
    setForm({ ...chauffeur })
    setFormErrors({})
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormErrors({})
    setSaving(true)

    try {
      if (form.id) {
        await api.updateChauffeur(form.id, form)
      } else {
        await api.createChauffeur(form)
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
    if (!confirm('Supprimer ce chauffeur ?')) return
    await api.deleteChauffeur(id)
    load()
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">Chauffeurs</h1>
          <p className="mt-1 text-sm text-slate-500">Équipe de chauffeurs et disponibilité.</p>
        </div>
        <Button variant="success" onClick={startCreate}>+ Ajouter un chauffeur</Button>
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
            label="Nom"
            value={form.nom}
            error={formErrors.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
          />
          <Input
            label="Prénom"
            value={form.prenom}
            error={formErrors.prenom}
            onChange={(e) => setForm({ ...form, prenom: e.target.value })}
          />
          <Input
            label="Téléphone"
            value={form.telephone}
            error={formErrors.telephone}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
          />
          <Input
            label="Numéro de permis"
            value={form.numero_permis}
            error={formErrors.numero_permis}
            onChange={(e) => setForm({ ...form, numero_permis: e.target.value })}
          />
          <Select
            label="Statut"
            options={statutOptions}
            value={form.statut}
            error={formErrors.statut}
            onChange={(e) => setForm({ ...form, statut: e.target.value })}
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
        {chauffeurs.length === 0 ? (
          <EmptyState title="Aucun chauffeur enregistré" description="Ajoutez votre premier chauffeur." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Téléphone</th>
                  <th className="px-4 py-3">Permis</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chauffeurs.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {c.prenom} {c.nom}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.telephone}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.numero_permis}</td>
                    <td className="px-4 py-3">
                      <DisponibiliteBadge statut={c.statut} />
                      {c.statut === 'en_course' && (
                        <p className="mt-1 text-xs text-slate-400">
                          Depuis {formatElapsed(c.updated_at)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => startEdit(c)}
                        className="mr-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-300"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
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
