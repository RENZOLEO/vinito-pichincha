'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MONTHS, formatDateLong, formatDateShort, TIME_SLOTS, TABLE_COMBOS } from '@/lib/reservas/config'

type Customer = {
  id: number; name: string; phone: string; visits: number
  birthDate: string | null; firstVisit: string | null; lastVisit: string | null
}
type Reservation = {
  id: number; date: string; time: string; guests: number
  tables: string; floor: string; returning: boolean
  completed: boolean; feedbackSent: boolean; customer: Customer
}
type TableBlock = {
  id: number; date: string; time: string | null; tables: string; reason: string | null
}
type FeedbackItem = {
  id: number; reservationId: number; customerName: string
  reservationDate: string; rating: number | null; comment: string | null; createdAt: string
}

const RED = '#C54329'
const BLUE = '#6F889A'
const CREAM = '#ECEEE1'
const DARK = '#202020'

const ALL_TABLES = [...new Set(TABLE_COMBOS.flatMap(c => c.tables))].sort((a, b) => a - b)

function localToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function ReservasAdminTable({
  initialReservations,
  initialCustomers,
  initialFeedbackPending,
  initialBlocks,
  currentDate,
}: {
  initialReservations: Reservation[]
  initialCustomers: Customer[]
  initialFeedbackPending: Reservation[]
  initialBlocks: TableBlock[]
  currentDate: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'reservas' | 'clientes' | 'feedback'>('reservas')
  const [reservations, setReservations] = useState(initialReservations)
  const [feedbackPending, setFeedbackPending] = useState(initialFeedbackPending)
  const [blocks, setBlocks] = useState(initialBlocks)
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [feedbacksLoaded, setFeedbacksLoaded] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [loading, setLoading] = useState<number | null>(null)
  const [editingGuests, setEditingGuests] = useState<{ id: number; guests: number } | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  const [showBlockForm, setShowBlockForm] = useState(false)
  const [blockTime, setBlockTime] = useState<string>('all')
  const [blockTables, setBlockTables] = useState<number[]>([])
  const [blockReason, setBlockReason] = useState('')
  const [blockLoading, setBlockLoading] = useState(false)

  const changeDay = (delta: number) => {
    const [y, m, d] = currentDate.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    dt.setDate(dt.getDate() + delta)
    const newDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    router.push(`/admin/reservas?date=${newDate}`)
  }

  const today = localToday()
  const isToday = currentDate === today
  const [y, m, d] = currentDate.split('-').map(Number)
  const dateLabel = isToday
    ? `HOY · ${d} DE ${MONTHS[m - 1].toUpperCase()}`
    : `${d} DE ${MONTHS[m - 1].toUpperCase()} ${y}`

  const totalPax = reservations.reduce((s, r) => s + r.guests, 0)
  const usedTables = new Set(reservations.flatMap(r => JSON.parse(r.tables) as number[])).size
  const freeTables = 18 - usedTables

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

  const deleteReservation = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar la reserva de ${name}? Esta acción no se puede deshacer.`)) return
    setLoading(id)
    await fetch(`/api/admin/reservas?id=${id}`, { method: 'DELETE' })
    setReservations(rs => rs.filter(r => r.id !== id))
    setFeedbackPending(fp => fp.filter(r => r.id !== id))
    setLoading(null)
  }

  const saveEditGuests = async () => {
    if (!editingGuests) return
    setLoading(editingGuests.id)
    setEditError(null)
    const res = await fetch('/api/admin/reservas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingGuests.id, guests: editingGuests.guests }),
    })
    const data = await res.json()
    if (res.ok && data.ok) {
      setReservations(rs => rs.map(r =>
        r.id === editingGuests.id
          ? { ...r, guests: data.reservation.guests, tables: data.reservation.tables, floor: data.reservation.floor }
          : r
      ))
      setEditingGuests(null)
    } else {
      setEditError(data.error ?? 'Error al actualizar')
    }
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

  const loadFeedbacks = async () => {
    if (feedbacksLoaded) return
    const res = await fetch('/api/admin/feedback')
    const data = await res.json()
    setFeedbacks(data.feedbacks ?? [])
    setFeedbacksLoaded(true)
  }

  const toggleBlockTable = (t: number) => {
    setBlockTables(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t])
  }

  const addBlock = async () => {
    if (blockTables.length === 0) return
    setBlockLoading(true)
    const res = await fetch('/api/admin/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: currentDate,
        time: blockTime === 'all' ? null : blockTime,
        tables: blockTables,
        reason: blockReason || null,
      }),
    })
    const data = await res.json()
    if (data.ok) {
      setBlocks(bs => [...bs, data.block])
      setShowBlockForm(false)
      setBlockTables([])
      setBlockReason('')
      setBlockTime('all')
    }
    setBlockLoading(false)
  }

  const removeBlock = async (id: number) => {
    setLoading(id)
    await fetch(`/api/admin/blocks?id=${id}`, { method: 'DELETE' })
    setBlocks(bs => bs.filter(b => b.id !== id))
    setLoading(null)
  }

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

      <div style={{ background: DARK, padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: CREAM, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          RESERVAS · <span style={{ color: RED }}>Admin</span>
        </div>
        <a href="/admin" style={{ fontSize: 11, color: BLUE, textDecoration: 'none' }}>← Panel principal</a>
      </div>

      <div style={{ display: 'flex', borderBottom: '2px solid #D8DAC8', background: '#fff' }}>
        {(['reservas', 'clientes', 'feedback'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); if (t === 'feedback') loadFeedbacks() }}
            style={{
              padding: '11px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              color: tab === t ? RED : '#888',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button onClick={() => changeDay(-1)} style={{ width: 30, height: 30, border: '1.5px solid #D8DAC8', borderRadius: 3, background: 'transparent', cursor: 'pointer', color: RED, fontSize: 14 }}>←</button>
              <div style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: DARK }}>{dateLabel}</div>
              <button onClick={() => changeDay(1)} style={{ width: 30, height: 30, border: '1.5px solid #D8DAC8', borderRadius: 3, background: 'transparent', cursor: 'pointer', color: RED, fontSize: 14 }}>→</button>
            </div>

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

            {reservations.length === 0
              ? <div style={{ textAlign: 'center', padding: 28, color: '#888', fontSize: 14 }}>No hay reservas para este día</div>
              : reservations.map(r => {
                const tables: number[] = JSON.parse(r.tables)
                return (
                  <div key={r.id} style={{ ...card, display: 'grid', gridTemplateColumns: '60px 1fr auto auto auto', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: RED, letterSpacing: 1 }}>{r.time}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{r.customer.name}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                        {r.customer.phone}
                        {r.customer.birthDate ? ` · ${formatDateShort(r.customer.birthDate.split('T')[0])}` : ''}
                      </div>
                      {editingGuests?.id === r.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                          <button onClick={() => setEditingGuests(e => e ? { ...e, guests: Math.max(1, e.guests - 1) } : e)}
                            style={{ width: 22, height: 22, border: '1px solid #D8DAC8', borderRadius: 2, background: 'transparent', cursor: 'pointer', color: RED, fontSize: 14, lineHeight: 1 }}>−</button>
                          <span style={{ fontSize: 13, fontWeight: 700, minWidth: 22, textAlign: 'center' }}>{editingGuests.guests}</span>
                          <button onClick={() => setEditingGuests(e => e ? { ...e, guests: Math.min(12, e.guests + 1) } : e)}
                            style={{ width: 22, height: 22, border: '1px solid #D8DAC8', borderRadius: 2, background: 'transparent', cursor: 'pointer', color: RED, fontSize: 14, lineHeight: 1 }}>+</button>
                          <button onClick={saveEditGuests} disabled={loading === r.id}
                            style={{ padding: '2px 8px', fontSize: 10, fontWeight: 700, border: 'none', borderRadius: 2, background: RED, color: CREAM, cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {loading === r.id ? '...' : 'Guardar'}
                          </button>
                          <button onClick={() => { setEditingGuests(null); setEditError(null) }}
                            style={{ padding: '2px 6px', fontSize: 12, border: '1px solid #D8DAC8', borderRadius: 2, background: 'transparent', color: '#888', cursor: 'pointer' }}>×</button>
                          {editError && <span style={{ fontSize: 11, color: RED }}>{editError}</span>}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                          <span>{r.guests} persona{r.guests !== 1 ? 's' : ''} · Mesa{tables.length > 1 ? 's' : ''} {tables.join(', ')} · Planta {r.floor}</span>
                          <button onClick={() => { setEditingGuests({ id: r.id, guests: r.guests }); setEditError(null) }}
                            style={{ fontSize: 11, border: '1px solid #D8DAC8', borderRadius: 2, padding: '1px 5px', background: 'transparent', color: '#888', cursor: 'pointer' }}>✎</button>
                        </div>
                      )}
                    </div>
                    <span style={badge(r.returning ? '#FAECE7' : '#EAF3DE', r.returning ? '#7A2718' : '#2D6A4F')}>
                      {r.returning ? `${r.customer.visits} visitas` : 'Primera visita'}
                    </span>
                    <button style={smallBtn(r.completed)} disabled={r.completed || loading === r.id}
                      onClick={() => !r.completed && markCompleted(r.id)}>
                      {r.completed ? '✓ Completada' : loading === r.id ? '...' : 'Marcar visitado'}
                    </button>
                    <button style={{ padding: '5px 8px', fontSize: 13, border: '1.5px solid #D8DAC8', borderRadius: 3, background: 'transparent', color: '#999', cursor: 'pointer' }}
                      disabled={loading === r.id}
                      onClick={() => deleteReservation(r.id, r.customer.name)}>🗑</button>
                  </div>
                )
              })
            }

            <div style={{ marginTop: 24, borderTop: '2px solid #D8DAC8', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DARK }}>
                  Mesas bloqueadas
                  {blocks.length > 0 && <span style={{ marginLeft: 8, background: RED, color: CREAM, borderRadius: 2, padding: '2px 7px', fontSize: 10 }}>{blocks.length}</span>}
                </div>
                <button onClick={() => setShowBlockForm(v => !v)}
                  style={{ padding: '5px 12px', fontSize: 10, fontWeight: 700, border: `1.5px solid ${RED}`, borderRadius: 3, background: showBlockForm ? RED : 'transparent', color: showBlockForm ? CREAM : RED, cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {showBlockForm ? 'Cancelar' : '+ Bloquear'}
                </button>
              </div>

              {showBlockForm && (
                <div style={{ background: '#FFF8F6', border: `1.5px solid #F0C8BE`, borderRadius: 4, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Horario</div>
                      <select value={blockTime} onChange={e => setBlockTime(e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #D8DAC8', borderRadius: 3, fontFamily: 'inherit', fontSize: 13, outline: 'none', background: '#fff' }}>
                        <option value="all">Todo el día</option>
                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Motivo (opcional)</div>
                      <input value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="Ej: reserva privada"
                        style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #D8DAC8', borderRadius: 3, fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>Mesas a bloquear</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                    {ALL_TABLES.map(t => (
                      <button key={t} onClick={() => toggleBlockTable(t)}
                        style={{ width: 36, height: 32, fontSize: 11, fontWeight: 700, borderRadius: 3, border: `1.5px solid ${blockTables.includes(t) ? RED : '#D8DAC8'}`, background: blockTables.includes(t) ? RED : '#fff', color: blockTables.includes(t) ? CREAM : DARK, cursor: 'pointer' }}>
                        {t >= 100 ? `B${t - 99}` : t}
                      </button>
                    ))}
                  </div>
                  <button onClick={addBlock} disabled={blockTables.length === 0 || blockLoading}
                    style={{ padding: '8px 20px', fontSize: 11, fontWeight: 700, border: 'none', borderRadius: 3, background: blockTables.length > 0 ? RED : '#ccc', color: CREAM, cursor: blockTables.length > 0 ? 'pointer' : 'default', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {blockLoading ? 'Guardando...' : 'Confirmar bloqueo'}
                  </button>
                </div>
              )}

              {blocks.length === 0
                ? <div style={{ textAlign: 'center', padding: '14px 0', color: '#bbb', fontSize: 13 }}>Sin bloqueos para este día</div>
                : blocks.map(b => {
                  const bTables: number[] = JSON.parse(b.tables)
                  return (
                    <div key={b.id} style={{ ...card, display: 'grid', gridTemplateColumns: '70px 1fr auto', alignItems: 'center', gap: 10, borderLeft: `3px solid ${RED}` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: RED, textTransform: 'uppercase' }}>{b.time ?? 'Todo el día'}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>Mesa{bTables.length > 1 ? 's' : ''} {bTables.map(t => t >= 100 ? `B${t - 99}` : t).join(', ')}</div>
                        {b.reason && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{b.reason}</div>}
                      </div>
                      <button onClick={() => removeBlock(b.id)} disabled={loading === b.id}
                        style={{ padding: '4px 10px', fontSize: 10, fontWeight: 700, border: '1.5px solid #D8DAC8', borderRadius: 3, background: 'transparent', color: '#888', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {loading === b.id ? '...' : 'Quitar'}
                      </button>
                    </div>
                  )
                })
              }
            </div>
          </>
        )}

        {/* ── TAB: Clientes ── */}
        {tab === 'clientes' && (
          <>
            <input style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D8DAC8', borderRadius: 4, marginBottom: 14, fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
              placeholder="Buscar por nombre o teléfono..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            {filteredCustomers.length === 0
              ? <div style={{ textAlign: 'center', padding: 28, color: '#888' }}>Sin resultados</div>
              : filteredCustomers.map(c => {
                const initials = c.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                return (
                  <div key={c.id} style={{ ...card, display: 'grid', gridTemplateColumns: '42px 1fr auto', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 3, background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CREAM, fontWeight: 700, fontSize: 14 }}>{initials}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{c.phone}{c.birthDate ? ` · Nació: ${formatDateShort(c.birthDate.split('T')[0])}` : ''}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>Primera: {c.firstVisit ? formatDateShort(c.firstVisit.split('T')[0]) : '—'} · Última: {c.lastVisit ? formatDateShort(c.lastVisit.split('T')[0]) : '—'}</div>
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
            {/* Pendientes de envío manual */}
            <div style={{ fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Pendientes de envío ({feedbackPending.length})
            </div>

            {feedbackPending.length === 0
              ? <div style={{ textAlign: 'center', padding: '16px 0', color: '#888', fontSize: 13, marginBottom: 24 }}>No hay visitas completadas pendientes.</div>
              : feedbackPending.map(r => (
                <div key={r.id} style={{ ...card, display: 'grid', gridTemplateColumns: '60px 1fr auto', alignItems: 'center', gap: 12, marginBottom: 8 }}>
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

            {/* Feedbacks recibidos */}
            <div style={{ borderTop: '2px solid #D8DAC8', paddingTop: 16, marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Opiniones recibidas ({feedbacks.length})
              </div>

              {!feedbacksLoaded
                ? <div style={{ textAlign: 'center', padding: 20, color: '#888', fontSize: 13 }}>Cargando...</div>
                : feedbacks.length === 0
                  ? <div style={{ textAlign: 'center', padding: 20, color: '#888', fontSize: 13 }}>Todavía no hay opiniones recibidas.</div>
                  : feedbacks.map(f => (
                    <div key={f.id} style={{ ...card, borderLeft: `3px solid ${RED}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{f.customerName}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{f.reservationDate ? formatDateShort(f.reservationDate.split('T')[0]) : '—'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <span key={n} style={{ fontSize: 16, color: f.rating && f.rating >= n ? RED : '#D8DAC8' }}>★</span>
                          ))}
                        </div>
                      </div>
                      {f.comment && (
                        <div style={{ fontSize: 13, color: '#555', fontStyle: 'italic', lineHeight: 1.6, borderTop: '1px solid #EDE5DC', paddingTop: 8, marginTop: 4 }}>
                          "{f.comment}"
                        </div>
                      )}
                    </div>
                  ))
              }
            </div>
          </>
        )}
      </div>
    </div>
  )
}
