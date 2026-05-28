import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendFeedbackEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Buscar reservas completadas del día anterior con email y sin feedback enviado
  const argNow = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const yesterday = new Date(argNow)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const dayStart = new Date(`${yesterday.toISOString().split('T')[0]}T00:00:00.000Z`)
  const dayEnd = new Date(`${yesterday.toISOString().split('T')[0]}T23:59:59.999Z`)

  const reservations = await prisma.reservation.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd },
      completed: true,
      feedbackSent: false,
      noShow: false,
    },
    include: { customer: true },
  })

  let sent = 0
  for (const r of reservations) {
    if (!r.customer.email) continue
    try {
      await sendFeedbackEmail({
        to: r.customer.email,
        nombre: r.customer.name.split(' ')[0],
        fecha: dayStart.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }),
        reservationId: r.id,
      })
      await prisma.reservation.update({
        where: { id: r.id },
        data: { feedbackSent: true },
      })
      sent++
    } catch (e) {
      console.error(`Error sending feedback email for reservation ${r.id}:`, e)
    }
  }

  return NextResponse.json({ ok: true, sent, total: reservations.length })
}
