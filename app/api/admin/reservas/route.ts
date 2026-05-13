// app/api/admin/reservas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/reservas?date=2024-12-20
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

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
// Body: { id, completed } or { id, feedbackSent }
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, completed, feedbackSent } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updated = await prisma.reservation.update({
    where: { id },
    data: {
      ...(completed !== undefined && { completed }),
      ...(feedbackSent !== undefined && { feedbackSent }),
    },
  })

  return NextResponse.json({ ok: true, reservation: updated })
}

// GET /api/admin/reservas/customers — lista de clientes
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
