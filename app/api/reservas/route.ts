import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { findBestCombo, getFloorPreference, getUsedTables, TIME_SLOTS } from '@/lib/reservas/config'
import { sendConfirmationEmail } from '@/lib/email'
import crypto from 'crypto'

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

  const usedTables = getUsedTables([...dayReservations, ...dayBlocks])
  const timeSlots = dateStr === '2026-07-03' ? [...TIME_SLOTS, '23:00'] : [...TIME_SLOTS]
  const slots = timeSlots.map((time) => {
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, time, guests, nombre, apellido, telefono, birthDate, email } = body

    if (!date || !time || !guests || !nombre || !apellido || !telefono) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    // Verificar si el cliente está en lista negra
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone: telefono },
      select: { blacklisted: true },
    })
    if (existingCustomer?.blacklisted) {
      return NextResponse.json(
        { error: 'No es posible realizar la reserva en este momento. Contactá al local para más información.' },
        { status: 403 }
      )
    }

    const reservationDate = new Date(date + 'T00:00:00.000Z')
    const dayStart = new Date(date + 'T00:00:00.000Z')
    const dayEnd = new Date(date + 'T23:59:59.999Z')

    const result = await withSlotLock(date, () =>
      prisma.$transaction(async (tx) => {
        const [dayReservations, dayBlocks] = await Promise.all([
          tx.reservation.findMany({
            where: { date: { gte: dayStart, lte: dayEnd } },
            select: { tables: true },
          }),
          tx.tableBlock.findMany({
            where: { date: { gte: dayStart, lte: dayEnd } },
            select: { tables: true },
          }),
        ])

        const usedTables = getUsedTables([...dayReservations, ...dayBlocks])
        const preferFloor = getFloorPreference(guests, nombre, birthDate)
        const combo = findBestCombo(guests, usedTables, { preferFloor })

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
                email: existing.email ?? (email || null),
                birthDate: existing.birthDate ?? (birthDate ? new Date(birthDate + 'T00:00:00.000Z') : null),
              },
            })
          : await tx.customer.create({
              data: {
                name: customerName,
                phone: telefono,
                email: email || null,
                birthDate: birthDate ? new Date(birthDate + 'T00:00:00.000Z') : null,
                visits: 1,
                firstVisit: reservationDate,
                lastVisit: reservationDate,
              },
            })

        const cancelToken = crypto.randomUUID()

        const reservation = await tx.reservation.create({
          data: {
            date: reservationDate,
            time,
            guests,
            tables: JSON.stringify(combo.tables),
            floor: combo.floor,
            customerId: customer.id,
            returning: isReturning,
            cancelToken,
          },
        })

        return { reservation, combo, customerName, isReturning, cancelToken, customerEmail: customer.email }
      })
    )

    if (!result) {
      return NextResponse.json(
        { error: 'No hay disponibilidad para este horario' },
        { status: 409 },
      )
    }

    const { reservation, combo, customerName, isReturning, cancelToken, customerEmail } = result

    // Send confirmation email if customer provided email
    if (customerEmail) {
      try {
        const { formatDateLong } = await import('@/lib/reservas/config')
        await sendConfirmationEmail({
          to: customerEmail,
          nombre: customerName.split(' ')[0],
          fecha: formatDateLong(date),
          hora: time,
          personas: guests,
          cancelToken,
        })
      } catch (e) {
        console.error('Email confirmation error:', e)
      }
    }

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
