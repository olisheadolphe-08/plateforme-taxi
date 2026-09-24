import { useState } from 'react'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Alert from '../components/common/Alert'
import { ReservationStatusBadge } from '../components/common/StatusBadge'
import ReservationLiveStatus from '../components/reservation/ReservationLiveStatus'
import { Trajet } from '../components/common/Icons'
import { formatDateTime } from '../utils/format'
import { api, ApiError } from '../services/api'

export default function ReservationStatus() {
  const [reference, setReference] = useState('')
  const [reservation, setReservation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const [showPhoneSearch, setShowPhoneSearch] = useState(false)
  const [phone, setPhone] = useState('')
  const [phoneResults, setPhoneResults] = useState(null)
  const [phoneError, setPhoneError] = useState(null)
  const [phoneLoading, setPhoneLoading] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    setError(null)
    setReservation(null)

    if (!reference.trim()) {
      setError('Veuillez saisir une référence de réservation.')
      return
    }

    setLoading(true)
    try {
      const res = await api.lookupReservation(reference.trim())
      setReservation(res.data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePhoneSearch(e) {
    e.preventDefault()
    setPhoneError(null)
    setPhoneResults(null)

    if (!phone.trim()) {
      setPhoneError('Veuillez saisir votre numéro de téléphone.')
      return
    }

    setPhoneLoading(true)
    try {
      const res = await api.lookupReservationsByPhone(phone.trim())
      setPhoneResults(res.data)
    } catch (err) {
      setPhoneError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    } finally {
      setPhoneLoading(false)
    }
  }

  function selectFromPhoneResults(ref) {
    setReference(ref)
    setShowPhoneSearch(false)
    setPhoneResults(null)
    setPhone('')
    setError(null)
    setLoading(true)
    api
      .lookupReservation(ref)
      .then((res) => setReservation(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-extrabold text-ink-900">Suivi de réservation</h1>
      <p className="mt-1 text-sm text-slate-600">
        Entrez la référence reçue lors de votre demande (ex : RES-20260909-A1B2C3).
      </p>

      <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Input
          name="reference"
          placeholder="RES-20260909-A1B2C3"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" loading={loading}>
          Rechercher
        </Button>
      </form>

      <button
        onClick={() => setShowPhoneSearch((v) => !v)}
        className="mt-3 text-sm font-semibold text-brand-600 hover:underline"
      >
        {showPhoneSearch ? 'Masquer' : 'Référence perdue ? Rechercher par numéro de téléphone'}
      </button>

      {showPhoneSearch && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <form onSubmit={handlePhoneSearch} className="flex flex-col gap-3 sm:flex-row">
            <Input
              name="telephone"
              placeholder="Numéro utilisé lors de la réservation"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" loading={phoneLoading}>
              Chercher
            </Button>
          </form>

          {phoneError && (
            <div className="mt-3">
              <Alert variant="error">{phoneError}</Alert>
            </div>
          )}

          {phoneResults && phoneResults.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">
              Aucune réservation trouvée avec ce numéro.
            </p>
          )}

          {phoneResults && phoneResults.length > 0 && (
            <ul className="mt-3 space-y-2">
              {phoneResults.map((r) => (
                <li key={r.reference}>
                  <button
                    onClick={() => selectFromPhoneResults(r.reference)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm hover:border-brand-400"
                  >
                    <span>
                      <span className="block font-mono text-xs text-slate-500">
                        {r.reference}
                      </span>
                      <span className="font-medium text-ink-900">
                        <Trajet depart={r.lieu_depart} destination={r.destination} />
                      </span>
                      <span className="block text-xs text-slate-500">
                        {formatDateTime(r.date_heure)}
                      </span>
                    </span>
                    <ReservationStatusBadge statut={r.statut} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {reservation && (
        <div className="mt-8">
          <ReservationLiveStatus initialReservation={reservation} />
        </div>
      )}
    </div>
  )
}
