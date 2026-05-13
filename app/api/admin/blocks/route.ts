// app/api/admin/blocks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/blocks?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date')
  if (!dateStr) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const dayStart = new Date(dateStr + 'T00:00:00.000Z')
  const dayEnd = new Date(dateStr + 'T23:59:59.999Z')

  const blocks = await prisma.tableBlock.findMany({
    where: { date: { gte: dayStart, lte: dayEnd } },
    orderBy: [{ time: 'asc' }, { id: 'asc' }],
  })

  return NextResponse.json({ blocks })
}

// POST /api/admin/blocks
// Body: { date, time?, tables, reason? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, time, tables, reason } = await req.json()
  if (!date || !tables || !Array.isArray(tables) || tables.length === 0) {
    return NextResponse.json({ error: 'date y tables son requeridos' }, { status: 400 })
  }

  const block = await prisma.tableBlock.create({
    data: {
      date: new Date(date),
      time: time ?? null,
      tables: JSON.stringify(tables),
      reason: reason ?? null,
    },
  })

  return NextResponse.json({ ok: true, block })
}

// DELETE /api/admin/blocks?id=N
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') ?? '')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await prisma.tableBlock.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
