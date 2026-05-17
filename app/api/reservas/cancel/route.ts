import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return new NextResponse('<h2>Token inválido</h2>', { headers: { 'Content-Type': 'text/html' } })
  }

  const reservation = await prisma.reservation.findUnique({
    where: { cancelToken: token },
    include: { customer: true },
  })

  if (!reservation) {
    return new NextResponse(`
      <html><body style="font-family:sans-serif;max-width:480px;margin:40px auto;padding:24px;background:#ECEEE1;">
        <h2 style="color:#202020;">Reserva no encontrada</h2>
        <p style="color:#666;">Es posible que ya haya sido cancelada o el enlace sea inválido.</p>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } })
  }

  if (reservation.completed) {
    return new NextResponse(`
      <html><body style="font-family:sans-serif;max-width:480px;margin:40px auto;padding:24px;background:#ECEEE1;">
        <h2 style="color:#202020;">No se puede cancelar</h2>
        <p style="color:#666;">Esta reserva ya fue completada.</p>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } })
  }

  await prisma.reservation.delete({ where: { cancelToken: token } })

  return new NextResponse(`
    <html><body style="font-family:sans-serif;max-width:480px;margin:40px auto;padding:24px;background:#ECEEE1;text-align:center;">
      <div style="background:#202020;padding:20px 24px;margin-bottom:32px;">
        <h1 style="color:#C54329;font-size:26px;margin:0;letter-spacing:3px;">VINITO</h1>
      </div>
      <h2 style="color:#202020;">Reserva cancelada</h2>
      <p style="color:#666;line-height:1.6;">Tu reserva del <strong>${reservation.date.toLocaleDateString('es-AR')}</strong> a las <strong>${reservation.time} hs</strong> fue cancelada correctamente.</p>
      <p style="color:#666;line-height:1.6;">¡Esperamos verte pronto en Vinito Pichincha!</p>
      <a href="https://vinitorosario.com" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#C54329;color:#ECEEE1;border-radius:6px;text-decoration:none;font-weight:700;">Hacer nueva reserva</a>
    </body></html>
  `, { headers: { 'Content-Type': 'text/html' } })
}
