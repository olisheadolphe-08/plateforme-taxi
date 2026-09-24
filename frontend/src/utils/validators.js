export function isRequired(value) {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

export function isValidPhone(value) {
  return /^[0-9+\s()-]{8,20}$/.test(value)
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isFutureDateTime(value) {
  if (!value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date > new Date()
}

/**
 * Valide le formulaire de réservation côté client (miroir des règles
 * appliquées côté serveur dans ReservationController::validate()).
 */
export function validateReservationForm(data) {
  const errors = {}

  if (!isRequired(data.nom_client) || data.nom_client.trim().length < 2) {
    errors.nom_client = 'Le nom doit contenir au moins 2 caractères.'
  }

  if (!isRequired(data.prenom_client) || data.prenom_client.trim().length < 2) {
    errors.prenom_client = 'Le prénom doit contenir au moins 2 caractères.'
  }

  if (!isRequired(data.telephone_client)) {
    errors.telephone_client = 'Le numéro de téléphone est obligatoire.'
  } else if (!isValidPhone(data.telephone_client)) {
    errors.telephone_client = 'Le numéro de téléphone est invalide.'
  }

  if (data.email_client && !isValidEmail(data.email_client)) {
    errors.email_client = "L'adresse email est invalide."
  }

  if (!isRequired(data.lieu_depart)) {
    errors.lieu_depart = 'Le lieu de départ est obligatoire.'
  }

  if (!isRequired(data.destination)) {
    errors.destination = 'La destination est obligatoire.'
  }

  if (
    isRequired(data.lieu_depart) &&
    isRequired(data.destination) &&
    data.lieu_depart.trim().toLowerCase() === data.destination.trim().toLowerCase()
  ) {
    errors.destination = 'Le lieu de départ et la destination doivent être différents.'
  }

  if (!isRequired(data.date) || !isRequired(data.heure)) {
    errors.date_heure = 'La date et l\'heure sont obligatoires.'
  } else if (!isFutureDateTime(`${data.date}T${data.heure}`)) {
    errors.date_heure = 'La date de réservation doit être dans le futur.'
  }

  const passagers = Number(data.nombre_passagers)
  if (!isRequired(data.nombre_passagers) || Number.isNaN(passagers)) {
    errors.nombre_passagers = 'Le nombre de passagers est obligatoire.'
  } else if (passagers < 1 || passagers > 8) {
    errors.nombre_passagers = 'Le nombre de passagers doit être compris entre 1 et 8.'
  }

  return errors
}
