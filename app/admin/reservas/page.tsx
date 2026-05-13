// app/admin/reservas/page.tsx
import { prisma } from '@/lib/prisma'
import ReservasAdminTable from './ReservasAdminTable'

export const dynamic = 'force-dynamic'

export default async function AdminReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const sp = await searchParams
  // Argentina is always UTC-3 (no DST since 2008)
  const argNow = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const localToday = `${argNow.getUTCFullYear()}-${String(argNow.getUTCMonth() + 1).padStart(2, '0')}-${String(argNow.getUTCDate()).padStart(2, '0')}`
  const dateStr = sp.date ?? localToday

  const dayStart = new Date(dateStr + 'T00:00:00.000Z')
  const dayEnd = new Date(dateStr + 'T23:59:59.999Z')

  const [reservations, customers, pendingFeedback, blocks] = await Promise.all([
    prisma.reservation.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } },
      include: { customer: true },
      orderBy: { time: 'asc' },
    }),
    prisma.customer.findMany({
      orderBy: { visits: 'desc' },
      take: 50,
    }),
    prisma.reservation.findMany({
      where: { completed: true, feedbackSent: false },
      include: { customer: true },
      orderBy: { date: 'desc' },
    }),
    prisma.tableBlock.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } },
      orderBy: [{ time: 'asc' }, { id: 'asc' }],
    }),
  ])

  return (
    <ReservasAdminTable
      initialReservations={JSON.parse(JSON.stringify(reservations))}
      initialCustomers={JSON.parse(JSON.stringify(customers))}
      initialFeedbackPending={JSON.parse(JSON.stringify(pendingFeedback))}
      initialBlocks={JSON.parse(JSON.stringify(blocks))}
      currentDate={dateStr}
    />
  )
}
