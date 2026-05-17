import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const feedbacks = await prisma.feedback.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ feedbacks })
}
