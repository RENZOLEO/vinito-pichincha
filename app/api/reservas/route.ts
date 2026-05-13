// app/api/reservas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { findBestCombo, getUsedTables, TIME_SLOTS } from '@/lib/reservas/config'

// Serializes concurrent booking attempts for the same date+time slot.
// Node.js is single-threaded: the check between while-exit and slotLocks.set
// is synchronous, so no two callers can both see "no lock" at the same time.
const slotLocks = new Map<string, Promise<void>>()

async function withSlotLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  while (slotLocks.has(key)) {
    await slotLocks.get(key)
  }
  let release!: () => void
  const lock = new Promise<void>((resolve) => { release = resolve })
  slotLocks.set(key, lock)
  try {
    return await fn()
  } finally {
    release()
    slotLocks.delete(key)
  }
}

// GET /api/reservas?date=2024-12-20&guests=4
// Returns available time slots for a given date and guest count
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date')
  const guests = parseInt(searchParams.get('guests') || '2')

  if (!dateStr) {
    return NextResponse.json({ error: 'date required' }, { status: 400 })
  }

  const dayStart = new Date(dateStr + 'T00:00:00.000Z')
  const dayEnd = new Date(dateStr + 'T23:59:59.999Z')

  const [dayReservations, dayBlocks] = await Promise.all([
    prisma.reservation.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } },
      select: { time: true, tables: true },
    }),
    prisma.tableBlock.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } },
      select: { time: true, tables: true },
    }),
  ])

  const slots = TIME_SLOTS.map((time) => {
    const slotReservations = dayReservations.filter((r) => r.time === time)
    const slotBlocks = dayBlocks.filter((b) => b.time === null || b.time === time)
    const usedTables = getUsedTables([...slotReservations, ...slotBlocks])
    const combo = findBestCombo(guests, usedTables)
    return {
      time,
      available: combo !== null,
      tables: combo?.tables ?? [],
      floor: combo?.floor ?? null,
    }
  })

  return NextResponse.json({ slots })
}

// POST /api/reservas
// Creates a reservation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, time, guests, nombre, apellido, telefono, birthDate } = body

    if (!date || !time || !guests || !nombre || !apellido || !telefono) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    const reservationDate = new Date(date + 'T00:00:00.000Z')
    const dayStart = new Date(date + 'T00:00:00.000Z')
    const dayEnd = new Date(date + 'T23:59:59.999Z')

    // Acquire per-slot lock so concurrent requests are serialized.
    // The inner $transaction makes the re-check and insert atomic at the DB level.
    const result = await withSlotLock(`${date}:${time}`, () =>
      prisma.$transaction(async (tx) => {
        const [slotReservations, slotBlocks] = await Promise.all([
          tx.reservation.findMany({
            where: { date: { gte: dayStart, lte: dayEnd }, time },
            select: { tables: true },
          }),
          tx.tableBlock.findMany({
            where: {
              date: { gte: dayStart, lte: dayEnd },
              OR: [{ time: null }, { time }],
            },
            select: { tables: true },
          }),
        ])

        const usedTables = getUsedTables([...slotReservations, ...slotBlocks])
        const combo = findBestCombo(guests, usedTables)

        if (!combo) return null

        const customerName = `${nombre} ${apellido}`
        const existing = await tx.customer.findUnique({ where: { phone: telefono } })
        const isReturning = existing !== null && existing.visits > 0

        const customer = existing
          ? await tx.customer.update({
              where: { phone: telefono },
              data: {
                visits: { increment: 1 },
                lastVisit: reservationDate,
                birthDate: existing.birthDate ?? (birthDate ? new Date(birthDate + 'T00:00:00.000Z') : null),
              },
            })
          : await tx.customer.create({
              data: {
                name: customerName,
                phone: telefono,
                birthDate: birthDate ? new Date(birthDate + 'T00:00:00.000Z') : null,
                visits: 1,
                firstVisit: reservationDate,
                lastVisit: reservationDate,
              },
            })

        const reservation = await tx.reservation.create({
          data: {
            date: reservationDate,
            time,
            guests,
            tables: JSON.stringify(combo.tables),
            floor: combo.floor,
            customerId: customer.id,
            returning: isReturning,
          },
        })

        return { reservation, combo, customerName, isReturning }
      })
    )

    if (!result) {
      return NextResponse.json(
        { error: 'No hay disponibilidad para este horario' },
        { status: 409 },
      )
    }

    const { reservation, combo, customerName, isReturning } = result

    return NextResponse.json({
      ok: true,
      reservation: {
        id: reservation.id,
        date,
        time,
        guests,
        tables: combo.tables,
        floor: combo.floor,
        clientName: customerName,
        returning: isReturning,
      },
    })
  } catch (err) {
    console.error('Error creating reservation:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
