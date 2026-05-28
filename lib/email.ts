import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://vinitorosario.com'

const LOGO_HEADER = `
  <div style="background: #ECEEE1; padding: 28px 24px; text-align: center; border-bottom: 1.5px solid #D8DAC8;">
    <div style="font-size: 42px; font-weight: 900; color: #C54329; letter-spacing: 6px; line-height: 1; font-family: sans-serif;">VINITO</div>
    <div style="font-size: 20px; color: #6F889A; letter-spacing: 4px; margin-top: 2px; font-style: italic; font-family: sans-serif;">Pichincha</div>
    <div style="font-size: 10px; color: #888; letter-spacing: 3px; text-transform: uppercase; margin-top: 10px; font-family: sans-serif;">Jujuy 2248 · Pichincha · Rosario</div>
  </div>
`

export async function sendConfirmationEmail({
  to,
  nombre,
  fecha,
  hora,
  personas,
  cancelToken,
}: {
  to: string
  nombre: string
  fecha: string
  hora: string
  personas: number
  cancelToken: string
}) {
  const cancelUrl = `${BASE_URL}/api/reservas/cancel?token=${cancelToken}`

  await resend.emails.send({
    from: 'Vinito Pichincha <reservas@vinitorosario.com>',
    to,
    subject: '¡Tu reserva está confirmada! · Vinito Pichincha',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #ECEEE1; padding: 0;">
        ${LOGO_HEADER}
        <div style="padding: 32px 24px;">
          <h2 style="color: #202020; font-size: 22px; margin: 0 0 8px;">¡Reserva confirmada, ${nombre}!</h2>
          <p style="color: #666; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">Te esperamos con todo listo. Aquí están los detalles:</p>
          <div style="background: #fff; border: 1.5px solid #D8DAC8; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #EDE5DC; font-size: 13px;">
              <span style="color: #888;">Fecha</span><span style="font-weight: 700; color: #202020;">${fecha}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #EDE5DC; font-size: 13px;">
              <span style="color: #888;">Horario</span><span style="font-weight: 700; color: #202020;">${hora} hs</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #EDE5DC; font-size: 13px;">
              <span style="color: #888;">Personas</span><span style="font-weight: 700; color: #202020;">${personas}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px;">
              <span style="color: #888;">Dirección</span><span style="font-weight: 700; color: #202020;">Jujuy 2248, Rosario</span>
            </div>
          </div>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${cancelUrl}" style="display: inline-block; padding: 12px 24px; background: transparent; border: 1.5px solid #C54329; color: #C54329; border-radius: 6px; font-size: 13px; text-decoration: none; font-weight: 600;">
              Cancelar mi reserva
            </a>
          </div>
          <p style="color: #aaa; font-size: 11px; line-height: 1.6; margin: 0; text-align: center;">
            Si cancelás, tu lugar quedará disponible para otros.<br/>¡Nos vemos pronto en Vinito Pichincha!
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendFeedbackEmail({
  to,
  nombre,
  fecha,
  reservationId,
}: {
  to: string
  nombre: string
  fecha: string
  reservationId: number
}) {
  const feedbackUrl = `${BASE_URL}/feedback/${reservationId}`

  await resend.emails.send({
    from: 'Vinito Pichincha <reservas@vinitorosario.com>',
    to,
    subject: '¿Cómo estuvo tu noche en Vinito? 🍷',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #ECEEE1; padding: 0;">
        ${LOGO_HEADER}
        <div style="padding: 32px 24px;">
          <h2 style="color: #202020; font-size: 22px; margin: 0 0 8px;">¡Hola, ${nombre}!</h2>
          <p style="color: #666; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
            Ayer te tuvimos en Vinito Pichincha (${fecha}) y nos encantaría saber cómo fue tu experiencia. Tu opinión nos ayuda a mejorar.
          </p>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${feedbackUrl}" style="display: inline-block; padding: 14px 32px; background: #C54329; color: #ECEEE1; border-radius: 6px; font-size: 14px; text-decoration: none; font-weight: 700; letter-spacing: 1px;">
              Dejar mi opinión
            </a>
          </div>
          <p style="color: #aaa; font-size: 11px; line-height: 1.6; margin: 0; text-align: center;">
            Solo toma 1 minuto. ¡Gracias por elegirnos!
          </p>
        </div>
      </div>
    `,
  })
}
