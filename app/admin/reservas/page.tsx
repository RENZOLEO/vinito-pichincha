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
  const dateStr = sp.date ?? new Date().toISOString().split('T')[0]

  const dayStart = new Date(dateStr + 'T00:00:00.000Z')
  const dayEnd = new Date(dateStr + 'T23:59:59.999Z')

  const [reservations, customers, pendingFeedback] = await Promise.all([
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
  ])

  return (
    <ReservasAdminTable
      initialReservations={JSON.parse(JSON.stringify(reservations))}
      initialCustomers={JSON.parse(JSON.stringify(customers))}
      initialFeedbackPending={JSON.parse(JSON.stringify(pendingFeedback))}
      currentDate={dateStr}
    />
  )
}
