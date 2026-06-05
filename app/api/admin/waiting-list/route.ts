import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const list = await prisma.waitingList.findMany({
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json({ list })
}

export async function PATCH(req: Request) {
  const { id, notified } = await req.json()
  const updated = await prisma.waitingList.update({
    where: { id },
    data: { notified },
  })
  return NextResponse.json({ ok: true, entry: updated })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  await prisma.waitingList.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}