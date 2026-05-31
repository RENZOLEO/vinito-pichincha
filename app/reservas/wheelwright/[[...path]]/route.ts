// app/reservas/wheelwright/[[...path]]/route.ts
import { NextRequest, NextResponse } from 'next/server'

const WHEELWRIGHT_BASE = process.env.WHEELWRIGHT_URL ?? 'https://wheelwright.vinitorosario.com'

export async function GET(
  req: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  return proxy(req, params.path)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  return proxy(req, params.path)
}

async function proxy(req: NextRequest, pathSegments?: string[]) {
  const subpath = pathSegments?.length ? '/' + pathSegments.join('/') : ''
  const search = req.nextUrl.search ?? ''
  const targetUrl = `${WHEELWRIGHT_BASE}${subpath}${search}`

  const headers = new Headers(req.headers)
  headers.set('x-forwarded-host', req.nextUrl.host)
  headers.delete('host')

  const upstreamRes = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    // @ts-ignore — necesario para streaming en Node
    duplex: 'half',
    redirect: 'manual',
  })
// Reescribir redirects para mantener la URL en vinitorosario.com
if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
  const location = upstreamRes.headers.get('location') ?? '/'
  const rewritten = location
    .replace(WHEELWRIGHT_BASE, '/reservas/wheelwright')
    .replace(/^\//, '/reservas/wheelwright/')
  return NextResponse.redirect(new URL(rewritten, req.nextUrl.origin))
}

  // Reescribir URLs absolutas en el HTML para que apunten a /reservas/wheelwright
  const contentType = upstreamRes.headers.get('content-type') ?? ''
  if (contentType.includes('text/html')) {
    let html = await upstreamRes.text()
    html = html
      .replaceAll(WHEELWRIGHT_BASE, '/reservas/wheelwright')
      .replaceAll('href="/', 'href="/reservas/wheelwright/')
      .replaceAll('action="/', 'action="/reservas/wheelwright/')
      .replaceAll('src="/', 'src="/reservas/wheelwright/')

    const resHeaders = new Headers(upstreamRes.headers)
    resHeaders.delete('content-encoding') // evita error de gzip doble
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