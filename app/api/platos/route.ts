import { NextRequest, NextResponse } from 'next/server'
const WHEELWRIGHT_BASE = process.env.WHEELWRIGHT_URL ?? 'https://wheelwright.vinitorosario.com'
export async function GET(req: NextRequest) {
  const res = await fetch(`${WHEELWRIGHT_BASE}/api/platos${req.nextUrl.search}`)
  return new NextResponse(res.body, { status: res.status, headers: res.headers })
}