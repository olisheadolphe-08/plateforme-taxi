import { describe, it, expect } from 'vitest'
import {
  isValidPhone,
  isValidEmail,
  isFutureDateTime,
  validateReservationForm
} from '../validators'

function validData(overrides = {}) {
  const dansUneHeure = new Date(Date.now() + 60 * 60 * 1000)
  return {
    nom_client: 'Rakoto',
    prenom_client: 'Jean',
    telephone_client: '0341234567',
    email_client: '',
    lieu_depart: 'Analakely',
    destination: 'Ivato',
    date: dansUneHeure.toISOString().slice(0, 10),
    heure: dansUneHeure.toTimeString().slice(0, 5),
    nombre_passagers: 2,
    ...overrides
  }
}

describe('isValidPhone', () => {
  it('accepte des formats courants', () => {
    expect(isValidPhone('0341234567')).toBe(true)
    expect(isValidPhone('+261 34 12 345 67')).toBe(true)
    expect(isValidPhone('(034) 123-4567')).toBe(true)
  })

  it('refuse un numéro trop court ou avec des lettres', () => {
    expect(isValidPhone('123')).toBe(false)
    expect(isValidPhone('abcdefgh')).toBe(false)
  })
})

describe('isValidEmail', () => {
  it('accepte un email bien formé', () => {
    expect(isValidEmail('client@example.com')).toBe(true)
  })

  it("refuse ce qui n'est pas un email", () => {
    expect(isValidEmail('pas-un-email')).toBe(false)
    expect(isValidEmail('sans-arobase.com')).toBe(false)
  })
})

describe('isFutureDateTime', () => {
  it('accepte une date dans le futur', () => {
    const dansUnJour = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    expect(isFutureDateTime(dansUnJour)).toBe(true)
  })

  it('refuse une date dans le passé', () => {
    const hier = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    expect(isFutureDateTime(hier)).toBe(false)
  })

  it('refuse une valeur vide ou invalide', () => {
    expect(isFutureDateTime('')).toBe(false)
    expect(isFutureDateTime('pas-une-date')).toBe(false)
  })
})

describe('validateReservationForm', () => {
  it("ne renvoie aucune erreur pour des données valides", () => {
    expect(validateReservationForm(validData())).toEqual({})
  })

  it('signale un nom trop court', () => {
    const errors = validateReservationForm(validData({ nom_client: 'R' }))
    expect(errors).toHaveProperty('nom_client')
  })

  it('signale un téléphone manquant', () => {
    const errors = validateReservationForm(validData({ telephone_client: '' }))
    expect(errors).toHaveProperty('telephone_client')
  })

  it("n'exige pas d'email (champ optionnel)", () => {
    const errors = validateReservationForm(validData({ email_client: '' }))
    expect(errors).not.toHaveProperty('email_client')
  })

  it('signale un email fourni mais invalide', () => {
    const errors = validateReservationForm(validData({ email_client: 'invalide' }))
    expect(errors).toHaveProperty('email_client')
  })

  it('signale un départ et une destination identiques', () => {
    const errors = validateReservationForm(
      validData({ lieu_depart: 'Ivato', destination: 'Ivato' })
    )
    expect(errors).toHaveProperty('destination')
  })

  it('signale une date dans le passé', () => {
    const errors = validateReservationForm(validData({ date: '2020-01-01', heure: '10:00' }))
    expect(errors).toHaveProperty('date_heure')
  })

  it.each([0, -1, 9, ''])('signale un nombre de passagers invalide (%s)', (valeur) => {
    const errors = validateReservationForm(validData({ nombre_passagers: valeur }))
    expect(errors).toHaveProperty('nombre_passagers')
  })

  it('accepte le nombre de passagers à la limite haute (8)', () => {
    const errors = validateReservationForm(validData({ nombre_passagers: 8 }))
    expect(errors).not.toHaveProperty('nombre_passagers')
  })
})
