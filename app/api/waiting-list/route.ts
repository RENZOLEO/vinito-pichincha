import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { date, guests, nombre, apellido, telefono, birthDate, email } = await req.json()

    if (!date || !guests || !nombre || !apellido || !telefono) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    const entry = await prisma.waitingList.create({
      data: {
        date: new Date(date + 'T00:00:00.000Z'),
        guests,
        nombre,
        apellido,
        telefono,
        birthDate: birthDate ? new Date(birthDate + 'T00:00:00.000Z') : null,
        email: email || null,
      },
    })

    return NextResponse.json({ ok: true, id: entry.id })
  } catch (err) {
    console.error('WaitingList error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
