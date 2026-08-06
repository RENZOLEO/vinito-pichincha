// lib/reservas/config.ts

import { inferGender } from './genderByName'

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

export const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const

export function formatDateLong(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return `${WEEKDAYS[dt.getDay()]} ${d} de ${MONTHS[m - 1]} ${y}`
}

export function formatDateShort(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

export const TIME_SLOTS = ['20:00', '20:30', '20:45', '21:00', '21:30', '22:00'] as const
export type TimeSlot = typeof TIME_SLOTS[number]

export const TOTAL_TABLES = 18

export const TABLE_COMBOS: { tables: number[]; min: number; max: number }[] = [
  // Columna izquierda planta alta (mesas 1-5, combinables en secuencia)
  { tables: [1], min: 1, max: 2 },
  { tables: [1, 2], min: 3, max: 5 },
  { tables: [1, 2, 3], min: 5, max: 7 },
  { tables: [1, 2, 3, 4], min: 7, max: 8 },
  { tables: [1, 2, 3, 4, 5], min: 9, max: 10 },
  // Mesas 6 y 7
  { tables: [6], min: 1, max: 2 },
  { tables: [7], min: 1, max: 2 },
  { tables: [6, 7], min: 3, max: 6 },
  // Mesas 8, 9, 10, 11
  { tables: [8], min: 1, max: 2 },
  { tables: [9], min: 1, max: 2 },
  { tables: [10], min: 1, max: 2 },
  { tables: [8, 9], min: 3, max: 4 },
  { tables: [9, 10], min: 3, max: 4 },
  { tables: [8, 9, 10], min: 5, max: 6 },
  { tables: [9, 10, 11], min: 5, max: 6 },
  // Mesas 11 y 12
  { tables: [11], min: 1, max: 2 },
  { tables: [12], min: 1, max: 2 },
  { tables: [11, 12], min: 3, max: 4 },
  // Mesas 14 y 15
  { tables: [14], min: 1, max: 2 },
  { tables: [15], min: 1, max: 2 },
  { tables: [14, 15], min: 3, max: 5 },
  // Planta baja
  { tables: [100], min: 4, max: 4 },
  { tables: [101], min: 4, max: 4 },
  { tables: [100, 101], min: 5, max: 12 },
  { tables: [102], min: 1, max: 2 },
  { tables: [103], min: 1, max: 2 },
]

// A partir de qué cantidad de comensales entra en juego la preferencia de piso
// (grupos más chicos no tienen opción real entre planta alta/baja)
const FLOOR_PREFERENCE_MIN_GUESTS = 5

// Edad máxima considerada "joven" para la regla de piso
const FLOOR_PREFERENCE_MAX_AGE = 35

export function computeAge(birthDate: string | Date | null | undefined): number | null {
  if (!birthDate) return null
  const bd = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  if (isNaN(bd.getTime())) return null
  const today = new Date()
  let age = today.getUTCFullYear() - bd.getUTCFullYear()
  const monthDiff = today.getUTCMonth() - bd.getUTCMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < bd.getUTCDate())) {
    age--
  }
  return age
}

/**
 * Regla de negocio: grupos grandes (5+) de mujeres jóvenes (≤35, inferido por
 * fecha de nacimiento) se priorizan en planta baja (mesas 100+101, visibles
 * desde la calle). El resto de los grupos grandes se prioriza en planta alta.
 * Grupos chicos (<5) no compiten por piso, así que no aplica preferencia.
 */
export function getFloorPreference(
  guests: number,
  nombre: string,
  birthDate?: string | Date | null,
): 'alta' | 'baja' | undefined {
  if (guests < FLOOR_PREFERENCE_MIN_GUESTS) return undefined

  const age = computeAge(birthDate)
  const gender = inferGender(nombre)

  if (gender === 'F' && age !== null && age <= FLOOR_PREFERENCE_MAX_AGE) {
    return 'baja'
  }
  return 'alta'
}

export function getUsedTables(
  reservations: { tables: string }[],
): number[] {
  const used = new Set<number>()
  for (const r of reservations) {
    const tables: number[] = JSON.parse(r.tables)
    tables.forEach((t) => used.add(t))
  }
  return [...used]
}

export function findBestCombo(
  guests: number,
  usedTables: number[],
  opts?: { preferFloor?: 'alta' | 'baja' },
): { tables: number[]; floor: string } | null {
  const valid = TABLE_COMBOS.filter(
    (c) =>
      c.min <= guests &&
      guests <= c.max &&
      c.tables.every((t) => !usedTables.includes(t)),
  )
  const floorOf = (c: { tables: number[] }) => (c.tables[0] >= 100 ? 'baja' : 'alta')

  valid.sort((a, b) => {
    if (opts?.preferFloor) {
      const aMatch = floorOf(a) === opts.preferFloor ? 0 : 1
      const bMatch = floorOf(b) === opts.preferFloor ? 0 : 1
      if (aMatch !== bMatch) return aMatch - bMatch
    }
    return a.max - a.min - (b.max - b.min)
  })

  if (!valid.length) return null
  const combo = valid[0]
  return {
    tables: combo.tables,
    floor: floorOf(combo),
  }
}
