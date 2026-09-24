import { describe, it, expect } from 'vitest'
import { formatElapsed, formatDateTime, STATUT_LABELS, DISPO_LABELS } from '../format'

describe('formatDateTime', () => {
  it('retourne un tiret pour une valeur vide', () => {
    expect(formatDateTime(null)).toBe('—')
    expect(formatDateTime('')).toBe('—')
  })

  it('retourne la valeur brute si elle ne peut pas être interprétée', () => {
    expect(formatDateTime('pas-une-date')).toBe('pas-une-date')
  })

  it('formate une date valide en français', () => {
    const result = formatDateTime('2026-09-10 14:30')
    // On évite de dépendre du fuseau horaire exact du runner : on vérifie
    // juste la présence des éléments attendus plutôt qu'une égalité stricte.
    expect(result).toContain('2026')
    expect(result).toContain('09')
  })
})

describe('formatElapsed', () => {
  it('retourne null pour une valeur vide', () => {
    expect(formatElapsed(null)).toBeNull()
    expect(formatElapsed('')).toBeNull()
  })

  it('affiche "à l\'instant" pour une date très récente', () => {
    const maintenant = new Date().toISOString()
    expect(formatElapsed(maintenant)).toBe("à l'instant")
  })

  it('affiche des minutes pour une date récente', () => {
    const ilYA5Min = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(formatElapsed(ilYA5Min)).toBe('5 min')
  })

  it('affiche des heures pour une date de plusieurs heures', () => {
    const ilYA2h = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    expect(formatElapsed(ilYA2h)).toBe('2h')
  })

  it('affiche des jours au-delà de 24h', () => {
    const ilYA3j = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatElapsed(ilYA3j)).toBe('3 j')
  })
})

describe('libellés de statut', () => {
  it('couvre les 4 statuts de réservation', () => {
    expect(Object.keys(STATUT_LABELS)).toEqual(
      expect.arrayContaining(['en_attente', 'confirmee', 'annulee', 'terminee'])
    )
  })

  it('couvre les 3 statuts de disponibilité chauffeur/taxi', () => {
    expect(Object.keys(DISPO_LABELS)).toEqual(
      expect.arrayContaining(['disponible', 'indisponible', 'en_course'])
    )
  })
})
