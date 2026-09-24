import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../common/Input'
import Textarea from '../common/Textarea'
import Button from '../common/Button'
import Alert from '../common/Alert'
import { validateReservationForm } from '../../utils/validators'
import { api, ApiError } from '../../services/api'

const initialState = {
  nom_client: '',
  prenom_client: '',
  telephone_client: '',
  email_client: '',
  lieu_depart: '',
  destination: '',
  date: '',
  heure: '',
  nombre_passagers: 1,
  remarque: ''
}

export default function ReservationForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined, date_heure: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError(null)

    const validationErrors = validateReservationForm(form)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      const res = await api.createReservation({
        nom_client: form.nom_client.trim(),
        prenom_client: form.prenom_client.trim(),
        telephone_client: form.telephone_client.trim(),
        email_client: form.email_client.trim(),
        lieu_depart: form.lieu_depart.trim(),
        destination: form.destination.trim(),
        date_heure: `${form.date} ${form.heure}`,
        nombre_passagers: Number(form.nombre_passagers),
        remarque: form.remarque.trim()
      })

      navigate(`/reservation/confirmation/${res.data.reference}`)
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors)
      } else if (err instanceof ApiError) {
        setServerError(err.message)
      } else {
        setServerError('Une erreur inattendue est survenue. Veuillez réessayer.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <section>
        <h2 className="mb-4 text-base font-bold text-ink-900">Vos coordonnées</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nom"
            name="nom_client"
            placeholder="Rakoto"
            value={form.nom_client}
            error={errors.nom_client}
            onChange={(e) => update('nom_client', e.target.value)}
          />
          <Input
            label="Prénom"
            name="prenom_client"
            placeholder="Jean"
            value={form.prenom_client}
            error={errors.prenom_client}
            onChange={(e) => update('prenom_client', e.target.value)}
          />
          <Input
            label="Téléphone"
            name="telephone_client"
            placeholder="034 12 345 67"
            value={form.telephone_client}
            error={errors.telephone_client}
            onChange={(e) => update('telephone_client', e.target.value)}
          />
          <Input
            label="Email (optionnel)"
            type="email"
            name="email_client"
            placeholder="jean.rakoto@email.com"
            value={form.email_client}
            error={errors.email_client}
            onChange={(e) => update('email_client', e.target.value)}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-bold text-ink-900">Détails du trajet</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Lieu de départ"
            name="lieu_depart"
            placeholder="Analakely, Antananarivo"
            value={form.lieu_depart}
            error={errors.lieu_depart}
            onChange={(e) => update('lieu_depart', e.target.value)}
          />
          <Input
            label="Destination"
            name="destination"
            placeholder="Ivato Aéroport"
            value={form.destination}
            error={errors.destination}
            onChange={(e) => update('destination', e.target.value)}
          />
          <Input
            label="Date"
            type="date"
            name="date"
            min={today}
            value={form.date}
            error={errors.date_heure}
            onChange={(e) => update('date', e.target.value)}
          />
          <Input
            label="Heure"
            type="time"
            name="heure"
            value={form.heure}
            onChange={(e) => update('heure', e.target.value)}
          />
          <Input
            label="Nombre de passagers"
            type="number"
            name="nombre_passagers"
            min={1}
            max={8}
            value={form.nombre_passagers}
            error={errors.nombre_passagers}
            onChange={(e) => update('nombre_passagers', e.target.value)}
          />
        </div>
        <Textarea
          label="Remarque (optionnel)"
          name="remarque"
          placeholder="Bagages volumineux, siège bébé, etc."
          value={form.remarque}
          onChange={(e) => update('remarque', e.target.value)}
          className="mt-4"
        />
      </section>

      <Button type="submit" loading={submitting} className="w-full sm:w-auto">
        Confirmer la demande de réservation
      </Button>
    </form>
  )
}
