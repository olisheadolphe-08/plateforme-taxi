import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Alert from '../../components/common/Alert'
import { TaxiIcon } from '../../components/common/Icons'
import { useAuth } from '../../hooks/useAuth.jsx'
import { ApiError } from '../../services/api'

export default function Login() {
  const { admin, login, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && admin) return <Navigate to="/admin" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login(email, password)
      navigate('/admin')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-xl text-white">
            <TaxiIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-3 text-lg font-extrabold text-ink-900">Espace administrateur</h1>
          <p className="text-sm text-slate-500">TaxiGo — Back-office</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="admin@taxi.mg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
          <Input
            label="Mot de passe"
            type="password"
            name="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <Button type="submit" loading={submitting} className="w-full">
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  )
}
