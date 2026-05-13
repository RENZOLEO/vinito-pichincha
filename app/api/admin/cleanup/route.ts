// app/api/admin/cleanup/route.ts
// One-time cleanup: deletes reservations >= 2026-05-14 except customer "Maggiolo".
// GET  → dry-run, returns list of what would be deleted (no changes)
// POST → executes the deletion
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CUTOFF = new Date('2026-05-14T00:00:00.000Z')

async function getCandidates() {
  const all = await prisma.reservation.findMany({
    where: { date: { gte: CUTOFF } },
    include: { customer: true },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  })
  const toDelete = all.filter(r => !r.customer.name.toLowerCase().includes('maggiolo'))
  const toKeep   = all.filter(r =>  r.customer.name.toLowerCase().includes('maggiolo'))
  return { toDelete, toKeep }
}

// GET /api/admin/cleanup — preview, no changes
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { toDelete, toKeep } = await getCandidates()

  return NextResponse.json({
    dryRun: true,
    toDelete: toDelete.map(r => ({ id: r.id, date: r.date.toISOString().split('T')[0], time: r.time, customer: r.customer.name, phone: r.customer.phone })),
    toKeep:  toKeep.map(r  => ({ id: r.id, date: r.date.toISOString().split('T')[0], time: r.time, customer: r.customer.name, phone: r.customer.phone })),
  })
}

// POST /api/admin/cleanup — executes deletion
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { toDelete, toKeep } = await getCandidates()

  const ids = toDelete.map(r => r.id)
  const deleted = ids.length > 0
    ? await prisma.reservation.deleteMany({ where: { id: { in: ids } } })
    : { count: 0 }

  return NextResponse.json({
    deleted: deleted.count,
    kept: toKeep.map(r => ({ id: r.id, date: r.date.toISOString().split('T')[0], time: r.time, customer: r.customer.name })),
  })
}
