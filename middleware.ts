import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  // deja pasar todo, el route handler se encarga
  return NextResponse.next()
}

export const config = {
  matcher: '/reservas/wheelwright/:path*',
}