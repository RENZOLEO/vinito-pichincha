'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MONTHS, formatDateLong, formatDateShort } from '@/lib/reservas/config'

type Customer = {
  id: number; name: string; phone: string; visits: number
  birthDate: string | null; firstVisit: string | null; lastVisit: string | null
}
type Reservation = {
  id: number; date: string; time: string; guests: number
  tables: string; floor: string; returning: boolean
  completed: boolean; feedbackSent: boolean; customer: Customer
}

const RED = '#C54329'
const BLUE = '#6F889A'
const CREAM = '#ECEEE1'
const DARK = '#202020'

export default function ReservasAdminTable({
  initialReservations,
  initialCustomers,
  initialFeedbackPending,
  currentDate,
}: {
  initialReservations: Reservation[]
  initialCustomers: Customer[]
  initialFeedbackPending: Reservation[]
  currentDate: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'reservas' | 'clientes' | 'feedback'>('reservas')
  const [reservations, setReservations] = useState(initialReservations)
  const [feedbackPending, setFeedbackPending] = useState(initialFeedbackPending)
  const [searchQ, setSearchQ] = useState('')
  const [loading, setLoading] = useState<number | null>(null)

  // ── Date navigation ───────────────────────────────────────────────────────
  const changeDay = (delta: number) => {
    const [y, m, d] = currentDate.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    dt.setDate(dt.getDate() + delta)
    const newDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    router.push(`/admin/reservas?date=${newDate}`)
  }

  const today = new Date().toISOString().split('T')[0]
  const isToday = currentDate === today
  const [y, m, d] = currentDate.split('-').map(Number)
  const dateLabel = isToday
    ? `HOY · ${d} DE ${MONTHS[m - 1].toUpperCase()}`
    : `${d} DE ${MONTHS[m - 1].toUpperCase()} ${y}`

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalPax = reservations.reduce((s, r) => s + r.guests, 0)
  const usedTables = new Set(reservations.flatMap(r => JSON.parse(r.tables) as number[])).size
  const freeTables = 18 - usedTables

  // ── Mark completed ────────────────────────────────────────────────────────
  const markCompleted = async (id: number) => {
    setLoading(id)
    await fetch('/api/admin/reservas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed: true }),
    })
    setReservations(rs => rs.map(r => r.id === id ? { ...r, completed: true } : r))
    const completed = reservations.find(r => r.id === id)
    if (completed) setFeedbackPending(fp => [...fp, { ...completed, completed: true }])
    setLoading(null)
  }

  const markFeedbackSent = async (id: number) => {
    setLoading(id)
    await fetch('/api/admin/reservas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, feedbackSent: true }),
    })
    setFeedbackPending(fp => fp.filter(r => r.id !== id))
    setLoading(null)
  }

  // ── Shared styles ─────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: '#fff', border: '1.5px solid #D8DAC8', borderRadius: 4,
    padding: '12px 14px', marginBottom: 8,
  }
  const badge = (bg: string, color: string): React.CSSProperties => ({
    fontSize: 10, padding: '3px 9px', borderRadius: 2, fontWeight: 700,
    whiteSpace: 'nowrap', letterSpacing: '0.05em', textTransform: 'uppercase',
    background: bg, color,
  })
  const smallBtn = (active = false): React.CSSProperties => ({
    padding: '5px 10px', fontSize: 10, fontWeight: 700, border: '1.5px solid #D8DAC8',
    borderRadius: 3, background: active ? '#EAF3DE' : 'transparent',
    color: active ? '#2D6A4F' : RED, cursor: active ? 'default' : 'pointer',
    letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap',
  })

  const filteredCustomers = initialCustomers.filter(c =>
    !searchQ || c.name.toLowerCase().includes(searchQ.toLowerCase()) || c.phone.includes(searchQ)
  )

  return (
    <div style={{ fontFamily: "'Raleway', sans-serif", color: DARK }}>

      {/* Admin header */}
      <div style={{ background: DARK, padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: CREAM, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          RESERVAS · <span style={{ color: RED }}>Admin</span>
        </div>
        <a href="/admin" style={{ fontSize: 11, color: BLUE, textDecoration: 'none' }}>← Panel principal</a>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #D8DAC8', background: '#fff' }}>
        {(['reservas', 'clientes', 'feedback'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '11px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              color: tab === t ? RED : '#888', borderBottom: `3px solid ${tab === t ? RED : 'transparent'}`,
              background: 'none', border: 'none', borderBottomWidth: 3,
              borderBottomStyle: 'solid', borderBottomColor: tab === t ? RED : 'transparent',
              letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: -2,
            }}>
            {t === 'feedback' && feedbackPending.length > 0 ? `${t} (${feedbackPending.length})` : t}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 22px', maxWidth: 800, margin: '0 auto' }}>

        {/* ── TAB: Reservas ── */}
        {tab === 'reservas' && (
          <>
            {/* Date nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button onClick={() => changeDay(-1)} style={{ width: 30, height: 30, border: '1.5px solid #D8DAC8', borderRadius: 3, background: 'transparent', cursor: 'pointer', color: RED, fontSize: 14 }}>←</button>
              <div style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: DARK }}>{dateLabel}</div>
              <button onClick={() => changeDay(1)} style={{ width: 30, height: 30, border: '1.5px solid #D8DAC8', borderRadius: 3, background: 'transparent', cursor: 'pointer', color: RED, fontSize: 14 }}>→</button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              {[
                [reservations.length, 'Reservas'],
                [totalPax, 'Personas'],
                [usedTables, 'Mesas ocup.'],
                [freeTables, 'Mesas libres'],
              ].map(([n, l]) => (
                <div key={l as string} style={{ background: CREAM, borderRadius: 3, padding: '11px 13px', textAlign: 'center', borderLeft: `3px solid ${RED}` }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: RED, lineHeight: 1 }}>{n}</div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Reservation list */}
            {reservations.length === 0
              ? <div style={{ textAlign: 'center', padding: 28, color: '#888', fontSize: 14 }}>No hay reservas para este día</div>
              : reservations.map(r => {
                const tables: number[] = JSON.parse(r.tables)
                return (
                  <div key={r.id} style={{ ...card, display: 'grid', gridTemplateColumns: '60px 1fr auto auto', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: RED, letterSpacing: 1 }}>{r.time}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{r.customer.name}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                        {r.customer.phone}
                        {r.customer.birthDate ? ` · ${formatDateShort(r.customer.birthDate.split('T')[0])}` : ''}
                      </div>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        {r.guests} persona{r.guests !== 1 ? 's' : ''} · Mesa{tables.length > 1 ? 's' : ''} {tables.join(', ')} · Planta {r.floor}
                      </div>
                    </div>
                    <span style={badge(r.returning ? '#FAECE7' : '#EAF3DE', r.returning ? '#7A2718' : '#2D6A4F')}>
                      {r.returning ? `${r.customer.visits} visitas` : 'Primera visita'}
                    </span>
                    <button
                      style={smallBtn(r.completed)}
                      disabled={r.completed || loading === r.id}
                      onClick={() => !r.completed && markCompleted(r.id)}>
                      {r.completed ? '✓ Completada' : loading === r.id ? '...' : 'Marcar visitado'}
                    </button>
                  </div>
                )
              })
            }
          </>
        )}

        {/* ── TAB: Clientes ── */}
        {tab === 'clientes' && (
          <>
            <input
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D8DAC8', borderRadius: 4, marginBottom: 14, fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
              placeholder="Buscar por nombre o teléfono..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            {filteredCustomers.length === 0
              ? <div style={{ textAlign: 'center', padding: 28, color: '#888' }}>Sin resultados</div>
              : filteredCustomers.map(c => {
                const initials = c.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                return (
                  <div key={c.id} style={{ ...card, display: 'grid', gridTemplateColumns: '42px 1fr auto', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 3, background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CREAM, fontWeight: 700, fontSize: 14 }}>{initials}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        {c.phone}{c.birthDate ? ` · Nació: ${formatDateShort(c.birthDate.split('T')[0])}` : ''}
                      </div>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        Primera: {c.firstVisit ? formatDateShort(c.firstVisit.split('T')[0]) : '—'} · Última: {c.lastVisit ? formatDateShort(c.lastVisit.split('T')[0]) : '—'}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, padding: '4px 11px', borderRadius: 2, background: CREAM, color: RED, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {c.visits} visita{c.visits !== 1 ? 's' : ''}
                    </span>
                  </div>
                )
              })
            }
          </>
        )}

        {/* ── TAB: Feedback ── */}
        {tab === 'feedback' && (
          <>
            <div style={{ background: CREAM, borderRadius: 4, padding: '13px 15px', marginBottom: 16, borderLeft: `4px solid ${RED}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Mensaje WhatsApp · día siguiente</div>
              <p style={{ fontSize: 13, color: DARK, lineHeight: 1.65, fontStyle: 'italic' }}>
                Hola [Nombre], ¿cómo estás? Ayer te tuvimos en Vinito Pichincha y queremos saber cómo fue tu experiencia 🍷 ¿Qué te pareció? Tu opinión nos ayuda a mejorar. ¡Gracias y esperamos verte pronto en Jujuy 2248, Rosario!
              </p>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Pendientes de envío ({feedbackPending.length})
            </div>

            {feedbackPending.length === 0
              ? <div style={{ textAlign: 'center', padding: 28, color: '#888', fontSize: 14 }}>No hay visitas completadas pendientes de feedback.</div>
              : feedbackPending.map(r => (
                <div key={r.id} style={{ ...card, display: 'grid', gridTemplateColumns: '60px 1fr auto', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: RED }}>{r.time}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{r.customer.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{r.customer.phone} · {r.date ? formatDateShort(r.date.split('T')[0]) : '—'}</div>
                  </div>
                  <button style={smallBtn(false)} onClick={() => markFeedbackSent(r.id)} disabled={loading === r.id}>
                    {loading === r.id ? '...' : '✓ Marcar enviado'}
                  </button>
                </div>
              ))
            }
          </>
        )}
      </div>
    </div>
  )
}
