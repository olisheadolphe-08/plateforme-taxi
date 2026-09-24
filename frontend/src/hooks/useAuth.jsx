import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('taxi_admin_token')
    if (!token) {
      setLoading(false)
      return
    }

    api
      .me()
      .then((res) => setAdmin(res.data))
      .catch(() => {
        localStorage.removeItem('taxi_admin_token')
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const res = await api.login(email, password)
    localStorage.setItem('taxi_admin_token', res.data.token)
    setAdmin(res.data.admin)
    return res.data.admin
  }

  function logout() {
    localStorage.removeItem('taxi_admin_token')
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}
