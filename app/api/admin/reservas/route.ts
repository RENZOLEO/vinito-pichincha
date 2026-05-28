// app/api/admin/reservas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { findBestCombo, getUsedTables } from '@/lib/reservas/config'

// GET /api/admin/reservas?date=2024-12-20
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const argNow = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const localToday = `${argNow.getUTCFullYear()}-${String(argNow.getUTCMonth() + 1).padStart(2, '0')}-${String(argNow.getUTCDate()).padStart(2, '0')}`
  const dateStr = searchParams.get('date') ?? localToday

  const dayStart = new Date(dateStr + 'T00:00:00.000Z')
  const dayEnd = new Date(dateStr + 'T23:59:59.999Z')

  const reservations = await prisma.reservation.findMany({
    where: { date: { gte: dayStart, lte: dayEnd } },
    include: { customer: true },
    orderBy: { time: 'asc' },
  })

  return NextResponse.json({ reservations })
}

// PATCH /api/admin/reservas
// Body: { id, completed } | { id, feedbackSent } | { id, guests } | { id, noShow }
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, completed, feedbackSent, guests, noShow } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Edit guest count: reassign tables using global daily capacity
  if (guests !== undefined) {
    const existing = await prisma.reservation.findUnique({
      where: { id },
      select: { date: true },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const dayStart = new Date(existing.date)
    dayStart.setUTCHours(0, 0, 0, 0)
    const dayEnd = new Date(existing.date)
    dayEnd.setUTCHours(23, 59, 59, 999)

    const [otherReservations, dayBlocks] = await Promise.all([
      prisma.reservation.findMany({
        where: { date: { gte: dayStart, lte: dayEnd }, NOT: { id } },
        select: { tables: true },
      }),
      prisma.tableBlock.findMany({
        where: { date: { gte: dayStart, lte: dayEnd } },
        select: { tables: true },
      }),
    ])

    const usedTables = getUsedTables([...otherReservations, ...dayBlocks])
    const combo = findBestCombo(guests, usedTables)
    if (!combo) {
      return NextResponse.json(
        { error: 'Sin disponibilidad para esa cantidad de comensales' },
        { status: 409 },
      )
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { guests, tables: JSON.stringify(combo.tables), floor: combo.floor },
    })
    return NextResponse.json({ ok: true, reservation: updated })
  }

  // Mark no-show: increment noShowCount on customer, blacklist if >= 2
  if (noShow !== undefined) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      select: { customerId: true },
    })
    if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const customer = await prisma.customer.findUnique({
      where: { id: reservation.customerId },
      select: { noShowCount: true },
    })
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const newNoShowCount = customer.noShowCount + 1
    const shouldBlacklist = newNoShowCount >= 2

    await prisma.$transaction([
      prisma.reservation.update({
        where: { id },
        data: { noShow: true },
      }),
      prisma.customer.update({
        where: { id: reservation.customerId },
        data: {
          noShowCount: newNoShowCount,
          ...(shouldBlacklist && { blacklisted: true }),
        },
      }),
    ])

    return NextResponse.json({ ok: true, blacklisted: shouldBlacklist })
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: {
      ...(completed !== undefined && { completed }),
      ...(feedbackSent !== undefined && { feedbackSent }),
    },
  })

  return NextResponse.json({ ok: true, reservation: updated })
}

// DELETE /api/admin/reservas?id=123
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') ?? '')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await prisma.reservation.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

// PUT /api/admin/reservas — lista de clientes
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''

  const customers = await prisma.customer.findMany({
    where: q
      ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }] }
      : undefined,
    orderBy: { visits: 'desc' },
    include: { _count: { select: { reservations: true } } },
  })

  return NextResponse.json({ customers })
}
