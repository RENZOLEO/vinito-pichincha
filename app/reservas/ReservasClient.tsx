'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { MONTHS, WEEKDAYS, formatDateLong } from '@/lib/reservas/config'

type Step = 1 | 2 | 3 | 4 | 5 | 'waiting' | 'waiting-done'
type Slot = { time: string; available: boolean; tables: number[]; floor: string | null }

const RED = '#C54329'
const BLUE = '#6F889A'
const CREAM = '#ECEEE1'
const DARK = '#202020'

export default function ReservasClient() {
  const [step, setStep] = useState<Step>(1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [guests, setGuests] = useState(2)
  const [availableSlot, setAvailableSlot] = useState<Slot | null>(null)
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', birthDate: '', email: '' })
  const [waitingForm, setWaitingForm] = useState({ nombre: '', apellido: '', telefono: '', birthDate: '', email: '', guests: 2 })
  const [loading, setLoading] = useState(false)
  const [confirmation, setConfirmation] = useState<null | { returning: boolean; tables: number[]; floor: string; clientName: string }>(null)
  const [error, setError] = useState<string | null>(null)
  const [isClosed, setIsClosed] = useState(false)
  const [tuesdayMsg, setTuesdayMsg] = useState(false)

  useEffect(() => {
    const now = new Date()
    if (now.getHours() < 20) return
    let daysAhead = 1
    while (new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead).getDay() === 2) {
      daysAhead++
    }
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead)
    const ts = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`
    setIsClosed(true)
    setSelectedDate(ts)
    setCalYear(target.getFullYear())
    setCalMonth(target.getMonth())
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrowDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`
  const minDate = isClosed ? tomorrowDate : today

  const goStep = (n: Step) => { setError(null); setStep(n) }

  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr)
    setSelectedSlot(null)
    setSlots([])
  }

  const handleContinueToTime = async () => {
    if (!selectedDate) return
    setLoading(true)
    try {
      const res = await fetch(`/api/reservas?date=${selectedDate}&guests=${guests}`)
      const data = await res.json()
      setSlots(data.slots ?? [])
      goStep(2)
    } catch {
      setError('Error al cargar horarios. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestChange = async (delta: number) => {
    const newVal = Math.max(1, Math.min(10, guests + delta))
    setGuests(newVal)
    if (selectedDate && selectedSlot) {
      const res = await fetch(`/api/reservas?date=${selectedDate}&guests=${newVal}`)
      const data = await res.json()
      const updated = (data.slots ?? []).find((s: Slot) => s.time === selectedSlot.time)
      setAvailableSlot(updated?.available ? updated : null)
    }
  }

  const handleContinueToGuests = (slot: Slot) => {
    setSelectedSlot(slot)
    setAvailableSlot(slot)
    goStep(3)
  }

  const handleContinueToForm = async () => {
    if (!selectedDate || !selectedSlot) return
    setLoading(true)
    try {
      const res = await fetch(`/api/reservas?date=${selectedDate}&guests=${guests}`)
      const data = await res.json()
      const slot = (data.slots ?? []).find((s: Slot) => s.time === selectedSlot.time)
      if (!slot?.available) { setError('Sin disponibilidad para esta selección.'); return }
      setAvailableSlot(slot)
      goStep(4)
    } catch {
      setError('Error al verificar disponibilidad.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot || !availableSlot) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, time: selectedSlot.time, guests, ...form }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al confirmar'); return }
      setConfirmation(data.reservation)
      goStep(5)
    } catch {
      setError('Error de red. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleWaitingSubmit = async () => {
    if (!selectedDate || !waitingForm.nombre || !waitingForm.apellido || !waitingForm.telefono || !waitingForm.birthDate) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          guests: waitingForm.guests,
          nombre: waitingForm.nombre,
          apellido: waitingForm.apellido,
          telefono: waitingForm.telefono,
          birthDate: waitingForm.birthDate,
          email: waitingForm.email || null,
        }),
      })
      if (!res.ok) { setError('Error al registrarse. Intentá de nuevo.'); return }
      goStep('waiting-done')
    } catch {
      setError('Error de red. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const resetAll = () => {
    setStep(1); setSelectedDate(null); setSelectedSlot(null)
    setSlots([]); setGuests(2); setAvailableSlot(null)
    setForm({ nombre: '', apellido: '', telefono: '', birthDate: '', email: '' })
    setWaitingForm({ nombre: '', apellido: '', telefono: '', birthDate: '', email: '', guests: 2 })
    setConfirmation(null); setError(null)
  }

  const progress = step === 5 || step === 'waiting-done' ? 100 : step === 'waiting' ? 75 : (typeof step === 'number' ? (step / 4) * 100 : 50)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid #D8DAC8', borderRadius: 8,
    background: '#fff', fontFamily: 'inherit',
    fontSize: 14, color: DARK, outline: 'none',
  }

  const btnPrimary: React.CSSProperties = {
    width: '100%', padding: '14px', background: RED, color: CREAM,
    border: 'none', borderRadius: 8, fontFamily: 'inherit',
    fontSize: 13, fontWeight: 600, letterSpacing: '0.12em',
    textTransform: 'uppercase', cursor: 'pointer',
  }

  const btnOutline: React.CSSProperties = {
    width: '100%', padding: '13px', background: 'transparent', color: DARK,
    border: '1.5px solid #D8DAC8', borderRadius: 8, fontFamily: 'inherit',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
    display: 'block', textAlign: 'center',
  }

  const btnBack: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 12, color: '#aaa', background: 'none', border: 'none',
    cursor: 'pointer', marginBottom: 18, fontFamily: 'inherit', padding: 0,
  }

  const stepLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, letterSpacing: '0.2em',
    color: BLUE, textTransform: 'uppercase', marginBottom: 6,
  }

  const stepTitle: React.CSSProperties = {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28, color: DARK, marginBottom: 6,
  }

  const stepSub: React.CSSProperties = {
    fontSize: 13, color: '#999', marginBottom: 24,
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Barlow:wght@400;500;600&display=swap');
      `}</style>
      <div style={{ minHeight: '100vh', background: CREAM, fontFamily: "'Barlow', sans-serif" }}>

        {/* Header */}
        <div style={{ background: DARK, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Image src="/03.png" alt="VINITO Pichincha" width={100} height={44} style={{ height: 44, width: 'auto' }} priority />
          <span style={{ color: 'rgba(236,238,225,0.4)', fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase' }}>Jujuy 2248 · Rosario</span>
        </div>

        {/* Progress */}
        <div style={{ height: 3, background: '#D8DAC8' }}>
          <div style={{ height: '100%', background: RED, width: `${progress}%`, transition: 'width 0.4s ease' }} />
        </div>

        <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 24px' }}>

          {error && (
            <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          {/* ── STEP 1: Date ── */}
          {step === 1 && (
            <>
              <div style={stepLabel}>Paso 1 de 4</div>
              <div style={stepTitle}>Elegí una fecha</div>
              <div style={stepSub}>Seleccioná el día de tu visita</div>

              {tuesdayMsg && (
                <div style={{ background: '#FFF8F0', color: DARK, padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600, borderLeft: `3px solid ${RED}` }}>
                  Los martes el local permanece cerrado. Por favor elegí otro día.
                </div>
              )}

              {isClosed && (
                <div style={{ background: '#EEF3F7', color: BLUE, padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600, borderLeft: `3px solid ${BLUE}` }}>
                  Las reservas para hoy están cerradas. Estás reservando para mañana {formatDateLong(tomorrowStr)}.
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <button style={{ width: 32, height: 32, border: '1.5px solid #D8DAC8', borderRadius: 6, background: '#fff', color: RED, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}>←</button>
                <span style={{ fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, color: DARK }}>{MONTHS[calMonth]} {calYear}</span>
                <button style={{ width: 32, height: 32, border: '1.5px solid #D8DAC8', borderRadius: 6, background: '#fff', color: RED, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}>→</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 20 }}>
                {WEEKDAYS.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 600, color: '#bbb', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
                ))}
                {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dt = new Date(calYear, calMonth, day)
                  const isPast = dt < minDate
                  const isTuesday = dt.getDay() === 2
                  const isDisabled = isPast || isTuesday
                  const isSelected = dateStr === selectedDate
                  const isToday = dt.toDateString() === new Date().toDateString()
                  return (
                    <div key={day}
                      onClick={() => {
                        if (isPast) return
                        if (isTuesday) { setTuesdayMsg(true); return }
                        setTuesdayMsg(false)
                        handleSelectDate(dateStr)
                      }}
                      style={{
                        aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, borderRadius: 6,
                        cursor: isPast ? 'default' : isTuesday ? 'not-allowed' : 'pointer',
                        border: isSelected ? `1.5px solid ${RED}` : isToday ? `1.5px solid ${BLUE}` : '1.5px solid transparent',
                        background: isSelected ? RED : 'transparent',
                        color: isDisabled ? '#ddd' : isSelected ? CREAM : isToday ? BLUE : DARK,
                        fontWeight: isToday ? 600 : 400,
                      }}>
                      {day}
                    </div>
                  )
                })}
              </div>

              <button style={{ ...btnPrimary, opacity: !selectedDate || loading ? 0.4 : 1 }}
                disabled={!selectedDate || loading}
                onClick={handleContinueToTime}>
                {loading ? 'Cargando...' : 'Continuar'}
              </button>
            </>
          )}

          {/* ── STEP 2: Time ── */}
          {step === 2 && (
            <>
              <button style={btnBack} onClick={() => goStep(1)}>← Volver</button>
              <div style={stepLabel}>Paso 2 de 4</div>
              <div style={stepTitle}>Elegí el horario</div>
              <div style={stepSub}>{selectedDate && formatDateLong(selectedDate)}</div>

              {slots.length > 0 && slots.every(s => !s.available) ? (
                <div style={{ background: '#fff', border: '1.5px solid #D8DAC8', borderRadius: 12, padding: '28px 24px', marginBottom: 20 }}>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🍷</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: DARK, marginBottom: 8 }}>Sin disponibilidad</div>
                    <div style={{ fontSize: 13, color: '#888', lineHeight: 1.7 }}>
                      No hay mesas disponibles para esta fecha.<br />
                      Podés elegir otra fecha o anotarte en la lista de espera.
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button style={btnPrimary} onClick={() => goStep(1)}>
                      ← Elegir otra fecha
                    </button>
                    <button style={{ ...btnOutline, color: RED, borderColor: RED }}
                      onClick={() => {
                        setWaitingForm(f => ({ ...f, guests }))
                        goStep('waiting')
                      }}>
                      📋 Anotarme en lista de espera
                    </button>
                    <a href="https://vinitocopascafe.meitre.com/" target="_blank" rel="noopener noreferrer"
                      style={{ ...btnOutline, color: BLUE, borderColor: '#D8DAC8' }}>
                      🔗 Reservar en Vinito Wheelwright
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                  {slots.map((slot) => (
                    <div key={slot.time}
                      onClick={() => slot.available && handleContinueToGuests(slot)}
                      style={{
                        padding: '20px 16px', border: `1.5px solid ${selectedSlot?.time === slot.time ? RED : '#D8DAC8'}`,
                        borderRadius: 10, cursor: slot.available ? 'pointer' : 'not-allowed',
                        textAlign: 'center', opacity: slot.available ? 1 : 0.3,
                        background: selectedSlot?.time === slot.time ? RED : '#fff',
                      }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: selectedSlot?.time === slot.time ? CREAM : DARK, letterSpacing: 1 }}>{slot.time}</div>
                      {!slot.available && <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>Sin disponibilidad</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── STEP 3: Guests ── */}
          {step === 3 && (
            <>
              <button style={btnBack} onClick={() => goStep(2)}>← Volver</button>
              <div style={stepLabel}>Paso 3 de 4</div>
              <div style={stepTitle}>¿Cuántos son?</div>
              <div style={stepSub}>Indicá la cantidad de comensales</div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, marginBottom: 20 }}>
                <button onClick={() => handleGuestChange(-1)}
                  style={{ width: 48, height: 48, borderRadius: '50%', border: '1.5px solid #D8DAC8', background: '#fff', fontSize: 22, cursor: 'pointer', color: RED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 64, color: DARK, lineHeight: 1 }}>{guests}</div>
                  <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>personas</div>
                </div>
                <button onClick={() => handleGuestChange(1)}
                  style={{ width: 48, height: 48, borderRadius: '50%', border: '1.5px solid #D8DAC8', background: '#fff', fontSize: 22, cursor: 'pointer', color: RED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>

              {availableSlot
                ? <div style={{ background: '#EAF3DE', color: '#2D6A4F', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 18 }}>
                    ✓ Hay lugar para {guests} {guests === 1 ? 'persona' : 'personas'} en este horario
                  </div>
                : <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 18 }}>
                    Sin disponibilidad para {guests} personas en este horario.
                  </div>
              }

              <button style={{ ...btnPrimary, opacity: !availableSlot || loading ? 0.4 : 1 }}
                disabled={!availableSlot || loading}
                onClick={handleContinueToForm}>
                {loading ? 'Verificando...' : 'Continuar'}
              </button>
            </>
          )}

          {/* ── STEP 4: Form ── */}
          {step === 4 && (
            <>
              <button style={btnBack} onClick={() => goStep(3)}>← Volver</button>
              <div style={stepLabel}>Paso 4 de 4</div>
              <div style={stepTitle}>Tus datos</div>
              <div style={stepSub}>Completá tu información para confirmar</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Nombre</label>
                  <input style={inputStyle} placeholder="Ana" value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Apellido</label>
                  <input style={inputStyle} placeholder="González" value={form.apellido}
                    onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Teléfono / WhatsApp</label>
                  <input style={inputStyle} placeholder="+54 341 000-0000" value={form.telefono}
                    onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Fecha de nacimiento</label>
                  <input type="date" style={inputStyle} value={form.birthDate}
                    onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Email <span style={{ color: '#ccc', fontWeight: 400, textTransform: 'none' }}>(opcional — para confirmación)</span>
                  </label>
                  <input type="email" style={inputStyle} placeholder="tu@email.com" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>

              <div style={{ background: '#fff', border: '1.5px solid #D8DAC8', borderRadius: 10, padding: 16, marginBottom: 18 }}>
                {[
                  ['Fecha', selectedDate ? formatDateLong(selectedDate) : '—'],
                  ['Horario', selectedSlot ? `${selectedSlot.time} hs` : '—'],
                  ['Personas', guests],
                ].map(([k, v]) => (
                  <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F0EDE8', fontSize: 13 }}>
                    <span style={{ color: '#aaa' }}>{k}</span>
                    <span style={{ fontWeight: 600, color: DARK }}>{v}</span>
                  </div>
                ))}
              </div>

              <button
                style={{ ...btnPrimary, opacity: (!form.nombre || !form.apellido || !form.telefono || !form.birthDate || loading) ? 0.4 : 1 }}
                disabled={!form.nombre || !form.apellido || !form.telefono || !form.birthDate || loading}
                onClick={handleConfirm}>
                {loading ? 'Confirmando...' : 'Confirmar reserva'}
              </button>
            </>
          )}

          {/* ── STEP 5: Confirmation ── */}
          {step === 5 && confirmation && (
            <div style={{ textAlign: 'center', paddingTop: 16 }}>
              <div style={{ width: 68, height: 68, background: '#EAF3DE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28, color: '#2D6A4F' }}>✓</div>

              <div style={{ display: 'inline-block', background: confirmation.returning ? BLUE : RED, color: CREAM, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '5px 18px', borderRadius: 20, marginBottom: 16 }}>
                {confirmation.returning ? 'Bienvenido de vuelta' : 'Reserva confirmada'}
              </div>

              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: DARK, marginBottom: 10 }}>
                {confirmation.returning ? '¡Qué bueno volverte a ver!' : '¡Todo listo!'}
              </div>
              <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 20 }}>
                {confirmation.returning
                  ? 'Siempre es un placer tenerte en Vinito Pichincha.'
                  : 'Tu mesa está reservada. ¡Nos vemos pronto en Jujuy 2248, Rosario!'}
              </p>

              <div style={{ background: '#fff', border: '1.5px solid #D8DAC8', borderRadius: 10, padding: 16, maxWidth: 360, margin: '0 auto 14px', textAlign: 'left' }}>
                {[
                  ['Nombre', confirmation.clientName],
                  ['Fecha', selectedDate ? formatDateLong(selectedDate) : '—'],
                  ['Horario', selectedSlot ? `${selectedSlot.time} hs` : '—'],
                  ['Personas', guests],
                ].map(([k, v]) => (
                  <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F0EDE8', fontSize: 13 }}>
                    <span style={{ color: '#aaa' }}>{k}</span>
                    <span style={{ fontWeight: 600, color: DARK }}>{v}</span>
                  </div>
                ))}
              </div>

              {form.email && (
                <div style={{ background: '#EAF3DE', color: '#2D6A4F', borderRadius: 8, padding: '10px 14px', maxWidth: 360, margin: '0 auto 20px', fontSize: 12, fontWeight: 600, textAlign: 'left' }}>
                  ✓ Te enviamos confirmación a {form.email}
                </div>
              )}

              <button onClick={resetAll}
                style={{ padding: '10px 24px', background: 'transparent', color: RED, border: '1.5px solid #D8DAC8', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>
                Nueva reserva
              </button>
            </div>
          )}

          {/* ── WAITING LIST FORM ── */}
          {step === 'waiting' && (
            <>
              <button style={btnBack} onClick={() => goStep(2)}>← Volver</button>
              <div style={stepLabel}>Lista de espera</div>
              <div style={stepTitle}>Anotate</div>
              <div style={stepSub}>{selectedDate && formatDateLong(selectedDate)}</div>

              <div style={{ background: '#FFF8F0', border: `1.5px solid #F0C8BE`, borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#7A4A30', lineHeight: 1.6 }}>
                ⚠️ <strong>Anotarte no garantiza disponibilidad.</strong> Si se libera una mesa para esta fecha, el local te va a contactar por WhatsApp para ofrecerte el lugar.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Nombre</label>
                  <input style={inputStyle} placeholder="Ana" value={waitingForm.nombre}
                    onChange={e => setWaitingForm(f => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Apellido</label>
                  <input style={inputStyle} placeholder="González" value={waitingForm.apellido}
                    onChange={e => setWaitingForm(f => ({ ...f, apellido: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Teléfono / WhatsApp</label>
                  <input style={inputStyle} placeholder="+54 341 000-0000" value={waitingForm.telefono}
                    onChange={e => setWaitingForm(f => ({ ...f, telefono: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Fecha de nacimiento</label>
                  <input type="date" style={inputStyle} value={waitingForm.birthDate}
                    onChange={e => setWaitingForm(f => ({ ...f, birthDate: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Email <span style={{ color: '#ccc', fontWeight: 400, textTransform: 'none' }}>(opcional)</span>
                  </label>
                  <input type="email" style={inputStyle} placeholder="tu@email.com" value={waitingForm.email}
                    onChange={e => setWaitingForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Cantidad de personas</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => setWaitingForm(f => ({ ...f, guests: Math.max(1, f.guests - 1) }))}
                      style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #D8DAC8', background: '#fff', fontSize: 20, cursor: 'pointer', color: RED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, color: DARK, lineHeight: 1 }}>{waitingForm.guests}</div>
                      <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>personas</div>
                    </div>
                    <button onClick={() => setWaitingForm(f => ({ ...f, guests: Math.min(10, f.guests + 1) }))}
                      style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #D8DAC8', background: '#fff', fontSize: 20, cursor: 'pointer', color: RED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>
              </div>

              <button
                style={{ ...btnPrimary, opacity: (!waitingForm.nombre || !waitingForm.apellido || !waitingForm.telefono || !waitingForm.birthDate || loading) ? 0.4 : 1 }}
                disabled={!waitingForm.nombre || !waitingForm.apellido || !waitingForm.telefono || !waitingForm.birthDate || loading}
                onClick={handleWaitingSubmit}>
                {loading ? 'Guardando...' : 'Anotarme en lista de espera'}
              </button>
            </>
          )}

          {/* ── WAITING DONE ── */}
          {step === 'waiting-done' && (
            <div style={{ textAlign: 'center', paddingTop: 16 }}>
              <div style={{ width: 68, height: 68, background: '#FFF8F0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>📋</div>

              <div style={{ display: 'inline-block', background: BLUE, color: CREAM, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '5px 18px', borderRadius: 20, marginBottom: 16 }}>
                En lista de espera
              </div>

              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: DARK, marginBottom: 10 }}>
                ¡Listo, te anotamos!
              </div>
              <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7, marginBottom: 20 }}>
                Quedaste en la lista de espera para el {selectedDate ? formatDateLong(selectedDate) : ''}.<br />
                <strong style={{ color: DARK }}>Recordá que esto no garantiza disponibilidad.</strong><br />
                Si se libera una mesa, te vamos a contactar por WhatsApp.
              </p>

              <div style={{ background: '#EEF3F7', color: BLUE, borderRadius: 8, padding: '12px 16px', maxWidth: 360, margin: '0 auto 20px', fontSize: 13, fontWeight: 600, textAlign: 'left', lineHeight: 1.6 }}>
                También podés intentar reservar en Vinito Wheelwright:<br />
                <a href="https://vinitocopascafe.meitre.com/" target="_blank" rel="noopener noreferrer"
                  style={{ color: RED, textDecoration: 'none', fontWeight: 700 }}>
                  vinitocopascafe.meitre.com →
                </a>
              </div>

              <button onClick={resetAll}
                style={{ padding: '10px 24px', background: 'transparent', color: RED, border: '1.5px solid #D8DAC8', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>
                Volver al inicio
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
