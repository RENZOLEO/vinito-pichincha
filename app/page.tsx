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
    <>
      <style>{`
        @font-face {
          font-family: 'TTRicks';
          src: url('/TTRicksTrial-Bold.ttf') format('truetype');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'TTRicks';
          src: url('/TTRicksTrial-Medium.ttf') format('truetype');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'TTRicks';
          src: url('/TTRicksTrial-Regular.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
      `}</style>
      <div style={{ minHeight: '100vh', background: CREAM, fontFamily: "'TTRicks', serif" }}>
        <div style={{ background: DARK, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Image src="/03.png" alt="VINITO Pichincha" width={100} height={44} style={{ height: 44, width: 'auto' }} priority />
          <span style={{ color: 'rgba(236,238,225,0.45)', fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: "'TTRicks', serif", fontWeight: 400 }}>
            Bar de Vinos · Rosario
          </span>
        </div>
        <div style={{ maxWidth: 440, margin: '0 auto', padding: '56px 24px 48px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'TTRicks', serif", fontSize: 11, fontWeight: 500, letterSpacing: '0.25em', color: BLUE, textTransform: 'uppercase', marginBottom: 16 }}>
            Reservas online
          </div>
          <h1 style={{ fontFamily: "'TTRicks', serif", fontSize: 48, fontWeight: 700, color: DARK, lineHeight: 1.1, marginBottom: 14 }}>
            Elegí tu<br />
            <em style={{ color: RED, fontStyle: 'italic' }}>sucursal</em>
          </h1>
          <p style={{ fontFamily: "'TTRicks', serif", fontSize: 14, color: BLUE, marginBottom: 36, lineHeight: 1.7, fontWeight: 400 }}>
            ¿En qué Vinito querés hacer tu reserva?
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(32,32,32,0.12)' }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: RED }} />
            <div style={{ flex: 1, height: 1, background: 'rgba(32,32,32,0.12)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <a href="https://vinitocopascafe.meitre.com/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '30px 16px 26px', textDecoration: 'none', background: '#fff', border: '1.5px solid #D8DAC8', borderRadius: 8 }}>
              <div style={{ fontFamily: "'TTRicks', serif", fontSize: 17, fontWeight: 700, color: DARK, marginBottom: 6 }}>Vinito Centro</div>
              <div style={{ fontFamily: "'TTRicks', serif", fontSize: 12, color: '#888', fontWeight: 400 }}>Wheelwright 1487</div>
            </a>
            <Link href="/reservas" style={{ display: 'block', padding: '30px 16px 26px', textDecoration: 'none', background: RED, border: `1.5px solid ${RED}`, borderRadius: 8 }}>
              <div style={{ fontFamily: "'TTRicks', serif", fontSize: 17, fontWeight: 700, color: CREAM, marginBottom: 6 }}>Vinito Pichincha</div>
              <div style={{ fontFamily: "'TTRicks', serif", fontSize: 12, color: 'rgba(236,238,225,0.65)', fontWeight: 400 }}>Jujuy 2248</div>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
