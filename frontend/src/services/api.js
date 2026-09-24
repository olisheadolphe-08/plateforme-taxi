const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

/**
 * Petit client HTTP central : gère le préfixe d'URL, le JSON, le jeton
 * d'authentification admin et la normalisation des erreurs API.
 */
async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = localStorage.getItem('taxi_admin_token')
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })
  } catch (networkError) {
    throw new ApiError(
      "Impossible de contacter le serveur. Vérifiez votre connexion ou que l'API est démarrée.",
      0,
      null
    )
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    // réponse non-JSON, ignorée
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.message || 'Une erreur est survenue.',
      response.status,
      payload?.errors || null
    )
  }

  return payload
}

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

export const api = {
  // Public — réservations client
  createReservation: (data) => request('/reservations', { method: 'POST', body: data }),
  lookupReservation: (reference) =>
    request(`/reservations/lookup?reference=${encodeURIComponent(reference)}`),
  lookupReservationsByPhone: (telephone) =>
    request(`/reservations/lookup-par-telephone?telephone=${encodeURIComponent(telephone)}`),

  // Auth admin
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me', { auth: true }),

  // Admin — réservations
  adminReservations: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString()
    return request(`/admin/reservations${qs ? `?${qs}` : ''}`, { auth: true })
  },
  adminReservation: (id) => request(`/admin/reservations/${id}`, { auth: true }),
  updateReservationStatut: (id, data) =>
    request(`/admin/reservations/${id}/statut`, { method: 'PATCH', body: data, auth: true }),
  dashboard: () => request('/admin/dashboard', { auth: true }),

  // Admin — taxis
  taxis: (statut) => request(`/admin/taxis${statut ? `?statut=${statut}` : ''}`, { auth: true }),
  createTaxi: (data) => request('/admin/taxis', { method: 'POST', body: data, auth: true }),
  updateTaxi: (id, data) =>
    request(`/admin/taxis/${id}`, { method: 'PATCH', body: data, auth: true }),
  deleteTaxi: (id) => request(`/admin/taxis/${id}`, { method: 'DELETE', auth: true }),

  // Admin — chauffeurs
  chauffeurs: (statut) =>
    request(`/admin/chauffeurs${statut ? `?statut=${statut}` : ''}`, { auth: true }),
  createChauffeur: (data) =>
    request('/admin/chauffeurs', { method: 'POST', body: data, auth: true }),
  updateChauffeur: (id, data) =>
    request(`/admin/chauffeurs/${id}`, { method: 'PATCH', body: data, auth: true }),
  deleteChauffeur: (id) => request(`/admin/chauffeurs/${id}`, { method: 'DELETE', auth: true }),

  // Admin — notifications
  notifications: () => request('/admin/notifications', { auth: true }),
  unreadNotificationsCount: () => request('/admin/notifications/non-lues', { auth: true }),
  markNotificationRead: (id) =>
    request(`/admin/notifications/${id}/lue`, { method: 'PATCH', auth: true }),
  markAllNotificationsRead: () =>
    request('/admin/notifications/lues', { method: 'PATCH', auth: true })
}
