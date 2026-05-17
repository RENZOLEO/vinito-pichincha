import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { reservationId, rating, comment } = await req.json()

    if (!reservationId || !rating) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { customer: true },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
    }

    const existing = await prisma.feedback.findUnique({
      where: { reservationId },
    })

    if (existing) {
      return NextResponse.json({ error: 'Ya enviaste tu opinión para esta reserva' }, { status: 409 })
    }

    await prisma.feedback.create({
      data: {
        reservationId,
        customerName: reservation.customer.name,
        reservationDate: reservation.date,
        rating,
        comment: comment ?? null,
      },
    })

    await prisma.reservation.update({
      where: { id: reservationId },
      data: { feedbackSent: true },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Feedback error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
