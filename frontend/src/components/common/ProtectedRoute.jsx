import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import Spinner from './Spinner'

export default function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth()

  if (loading) return <Spinner />

  if (!admin) return <Navigate to="/admin/connexion" replace />

  return children
}
