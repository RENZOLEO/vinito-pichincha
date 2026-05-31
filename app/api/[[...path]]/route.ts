import { NextRequest, NextResponse } from 'next/server'

const WHEELWRIGHT_BASE = process.env.WHEELWRIGHT_URL ?? 'https://wheelwright.vinitorosario.com'

type Context = { params: Promise<{ path?: string[] }> }

export async function GET(req: NextRequest, ctx: Context) {
  const { path } = await ctx.params
  return proxy(req, path)
}

export async function POST(req: NextRequest, ctx: Context) {
  const { path } = await ctx.params
  return proxy(req, path)
}

async function proxy(req: NextRequest, pathSegments?: string[]) {
  const subpath = pathSegments?.length ? '/' + pathSegments.join('/') : ''
  const search = req.nextUrl.search ?? ''
  const targetUrl = `${WHEELWRIGHT_BASE}/api${subpath}${search}`

  const headers = new Headers(req.headers)
  headers.set('x-forwarded-host', req.nextUrl.host)
  headers.delete('host')

  const upstreamRes = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    // @ts-ignore
    duplex: 'half',
    redirect: 'manual',
  })

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers: upstreamRes.headers,
  })
}