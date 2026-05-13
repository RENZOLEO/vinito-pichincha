// app/api/reservas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { findBestCombo, getUsedTables, TIME_SLOTS } from '@/lib/reservas/config'

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

    const reservationDate = new Date(date)
    const dayStart = new Date(date + 'T00:00:00.000Z')
    const dayEnd = new Date(date + 'T23:59:59.999Z')

    const [slotReservations, slotBlocks] = await Promise.all([
      prisma.reservation.findMany({
        where: { date: { gte: dayStart, lte: dayEnd }, time },
        select: { tables: true },
      }),
      prisma.tableBlock.findMany({
        where: {
          date: { gte: dayStart, lte: dayEnd },
          OR: [{ time: null }, { time }],
        },
        select: { tables: true },
      }),
    ])

    const usedTables = getUsedTables([...slotReservations, ...slotBlocks])
    const combo = findBestCombo(guests, usedTables)

    if (!combo) {
      return NextResponse.json(
        { error: 'No hay disponibilidad para este horario' },
        { status: 409 },
      )
    }

    const customerName = `${nombre} ${apellido}`
    const existing = await prisma.customer.findUnique({ where: { phone: telefono } })
    const isReturning = existing !== null && existing.visits > 0

    const customer = existing
      ? await prisma.customer.update({
          where: { phone: telefono },
          data: {
            visits: { increment: 1 },
            lastVisit: reservationDate,
            birthDate: existing.birthDate ?? (birthDate ? new Date(birthDate) : null),
          },
        })
      : await prisma.customer.create({
          data: {
            name: customerName,
            phone: telefono,
            birthDate: birthDate ? new Date(birthDate) : null,
            visits: 1,
            firstVisit: reservationDate,
            lastVisit: reservationDate,
          },
        })

    const reservation = await prisma.reservation.create({
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
