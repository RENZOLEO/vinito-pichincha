import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VINITO · Bar de Vinos · Rosario',
}

const RED = '#C54329'
const BLUE = '#6F889A'
const CREAM = '#ECEEE1'
const DARK = '#202020'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: CREAM, fontFamily: "'Raleway', sans-serif" }}>

      {/* Header */}
      <div style={{ background: DARK, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Image src="/03.png" alt="VINITO Pichincha" width={100} height={44} style={{ height: 44, width: 'auto' }} priority />
        <span style={{ color: 'rgba(236,238,225,0.5)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase' }}>Bar de Vinos · Rosario</span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '64px 20px', textAlign: 'center' }}>

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: BLUE, textTransform: 'uppercase', marginBottom: 14 }}>
          Reservas
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: DARK, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Bienvenido a Vinito<br />Bar de Vinos
        </h1>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 40, lineHeight: 1.6 }}>
          ¿En qué sucursal querés hacer tu reserva?
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

          {/* Vinito Centro */}
          <a
            href="https://vinitocopascafe.meitre.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', padding: '32px 16px', textDecoration: 'none',
              background: '#fff', border: '1.5px solid #D8DAC8', borderRadius: 4,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 900, color: DARK, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Vinito Centro
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>Wheelwright 1487</div>
          </a>

          {/* Vinito Pichincha */}
          <Link
            href="/reservas"
            style={{
              display: 'block', padding: '32px 16px', textDecoration: 'none',
              background: RED, border: `1.5px solid ${RED}`, borderRadius: 4,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 900, color: CREAM, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Vinito Pichincha
            </div>
            <div style={{ fontSize: 12, color: 'rgba(236,238,225,0.7)' }}>Jujuy 2248</div>
          </Link>

        </div>
      </div>
    </div>
  )
}
