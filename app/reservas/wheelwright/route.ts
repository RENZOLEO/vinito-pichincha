import { NextRequest, NextResponse } from 'next/server'

const WHEELWRIGHT_BASE = process.env.WHEELWRIGHT_URL ?? 'https://wheelwright.vinitorosario.com'

export async function GET(req: NextRequest) {
  return proxy(req)
}

export async function POST(req: NextRequest) {
  return proxy(req)
}

async function proxy(req: NextRequest) {
  const search = req.nextUrl.search ?? ''
  const targetUrl = `${WHEELWRIGHT_BASE}/reservas/wheelwright${search}`

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

  // Reescribir redirects
  if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
    const location = upstreamRes.headers.get('location') ?? '/'
    const rewritten = location
      .replace(WHEELWRIGHT_BASE, '/reservas/wheelwright')
      .replace(/^\/reservas\/wheelwright\/reservas\/wheelwright/, '/reservas/wheelwright')
    return NextResponse.redirect(new URL(rewritten, req.nextUrl.origin))
  }

  // Reescribir HTML
  const contentType = upstreamRes.headers.get('content-type') ?? ''
  if (contentType.includes('text/html')) {
    let html = await upstreamRes.text()
    html = html
      .replaceAll(WHEELWRIGHT_BASE, '')
      .replaceAll('href="/', 'href="/reservas/wheelwright/')
      .replaceAll('action="/', 'action="/reservas/wheelwright/')
      .replaceAll('src="/', 'src="/reservas/wheelwright/')

    const resHeaders = new Headers(upstreamRes.headers)
    resHeaders.delete('content-encoding')
    return new NextResponse(html, {
      status: upstreamRes.status,
      headers: resHeaders,
    })
  }

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers: upstreamRes.headers,
  })
}