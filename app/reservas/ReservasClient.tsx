'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { MONTHS, WEEKDAYS, formatDateLong } from '@/lib/reservas/config'

type Step = 1 | 2 | 3 | 4 | 5
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
    const newVal = Math.max(1, Math.min(8, guests + delta))
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
        body: JSON.stringify({
          date: selectedDate,
          time: selectedSlot.time,
          guests,
          ...form,
        }),
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

  const resetAll = () => {
    setStep(1); setSelectedDate(null); setSelectedSlot(null)
    setSlots([]); setGuests(2); setAvailableSlot(null)
    setForm({ nombre: '', apellido: '', telefono: '', birthDate: '', email: '' })
    setConfirmation(null); setError(null)
  }

  const progress = step === 5 ? 100 : (step / 4) * 100

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: `1.5px solid ${CREAM}`,
    borderRadius: 4, background: '#fff', fontFamily: 'inherit',
    fontSize: 14, color: DARK, outline: 'none',
  }

  const btnPrimary: React.CSSProperties = {
    width: '100%', padding: '13px', background: RED, color: CREAM,
    border: 'none', borderRadius: 4, fontFamily: 'inherit',
    fontSize: 13, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', cursor: 'pointer',
  }

  const btnSecondary: React.CSSProperties = {
    padding: '8px 16px', background: 'transparent', color: RED,
    border: `1.5px solid ${CREAM}`, borderRadius: 4, fontFamily: 'inherit',
    fontSize: 13, cursor: 'pointer', marginBottom: 16,
  }

  return (
    <div style={{ minHeight: '100vh', background: CREAM, fontFamily: "'Raleway', sans-serif" }}>

      <div style={{ background: DARK, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Image src="/03.png" alt="VINITO Pichincha" width={100} height={44} style={{ height: 44, width: 'auto' }} priority />
        <span style={{ color: 'rgba(236,238,225,0.5)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase' }}>Jujuy 2248 · Rosario</span>
      </div>

      <div style={{ height: 4, background: '#D8DAC8' }}>
        <div style={{ height: '100%', background: RED, width: `${progress}%`, transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '28px 20px' }}>

        {error && (
          <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '10px 14px', borderRadius: 4, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* ── STEP 1: Date ── */}
        {step === 1 && (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: BLUE, textTransform: 'uppercase', marginBottom: 4 }}>Paso 1 de 4</div>
            <div style={{ fontFamily: 'inherit', fontSize: 28, fontWeight: 900, color: DARK, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Elegí una fecha</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: (isClosed || tuesdayMsg) ? 8 : 20 }}>Seleccioná el día de tu visita</div>

            {tuesdayMsg && (
              <div style={{ background: '#FFF8F0', color: DARK, padding: '10px 14px', borderRadius: 4, marginBottom: 16, fontSize: 13, fontWeight: 600, borderLeft: `3px solid ${RED}` }}>
                Lamentablemente los días martes el local permanece cerrado. Por favor elegí otro día.
              </div>
            )}

            {isClosed && (
              <div style={{ background: '#EEF3F7', color: BLUE, padding: '10px 14px', borderRadius: 4, marginBottom: 20, fontSize: 13, fontWeight: 600, borderLeft: `3px solid ${BLUE}` }}>
                Las reservas para hoy están cerradas. Estás reservando para mañana {formatDateLong(tomorrowStr)}.
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button style={{ ...btnSecondary, marginBottom: 0, padding: '6px 12px' }}
                onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}>←</button>
              <span style={{ fontWeight: 700, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }}>{MONTHS[calMonth]} {calYear}</span>
              <button style={{ ...btnSecondary, marginBottom: 0, padding: '6px 12px' }}
                onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}>→</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 20 }}>
              {WEEKDAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#999', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{d}</div>
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
                      fontSize: 13, borderRadius: 3,
                      cursor: isPast ? 'default' : isTuesday ? 'not-allowed' : 'pointer',
                      border: isSelected ? `1.5px solid ${RED}` : isToday ? `1.5px solid ${BLUE}` : '1.5px solid transparent',
                      background: isSelected ? RED : 'transparent',
                      color: isDisabled ? '#ccc' : isSelected ? CREAM : isToday ? BLUE : DARK,
                      fontWeight: isToday ? 700 : 400,
                    }}>
                    {day}
                  </div>
                )
              })}
            </div>

            <button style={{ ...btnPrimary, opacity: !selectedDate || loading ? 0.4 : 1 }}
              disabled={!selectedDate || loading}
              onClick={handleContinueToTime}>
              {loading ? 'Cargando...' : 'CONTINUAR'}
            </button>
          </>
        )}

        {/* ── STEP 2: Time ── */}
        {step === 2 && (
          <>
            <button style={btnSecondary} onClick={() => goStep(1)}>← Volver</button>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: BLUE, textTransform: 'uppercase', marginBottom: 4 }}>Paso 2 de 4</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: DARK, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Elegí el horario</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>{selectedDate && formatDateLong(selectedDate)}</div>

            {slots.length > 0 && slots.every(s => !s.available) ? (
              <div style={{ background: '#fff', border: '1.5px solid #D8DAC8', borderRadius: 4, padding: '28px 20px', textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🍷</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 8 }}>Sin disponibilidad</div>
                <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>
                  Lo sentimos, no hay mesas disponibles para el horario seleccionado.<br />
                  Podés elegir otro horario o fecha.
                </div>
                <button style={{ ...btnSecondary, marginTop: 20, marginBottom: 0 }} onClick={() => goStep(1)}>← Elegir otra fecha</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {slots.map((slot) => (
                  <div key={slot.time}
                    onClick={() => slot.available && handleContinueToGuests(slot)}
                    style={{
                      padding: '16px', border: `1.5px solid ${selectedSlot?.time === slot.time ? RED : '#D8DAC8'}`,
                      borderRadius: 4, cursor: slot.available ? 'pointer' : 'not-allowed',
                      textAlign: 'center', opacity: slot.available ? 1 : 0.35,
                      background: selectedSlot?.time === slot.time ? RED : '#fff',
                    }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: selectedSlot?.time === slot.time ? CREAM : DARK, letterSpacing: 1 }}>{slot.time}</div>
                    {!slot.available && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Sin disponibilidad</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── STEP 3: Guests ── */}
        {step === 3 && (
          <>
            <button style={btnSecondary} onClick={() => goStep(2)}>← Volver</button>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: BLUE, textTransform: 'uppercase', marginBottom: 4 }}>Paso 3 de 4</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: DARK, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>¿Cuántos son?</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Indicá la cantidad de comensales</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
              <button onClick={() => handleGuestChange(-1)}
                style={{ width: 44, height: 44, borderRadius: '50%', border: `1.5px solid #D8DAC8`, background: 'transparent', fontSize: 22, cursor: 'pointer', color: RED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: DARK, lineHeight: 1 }}>{guests}</div>
                <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>personas</div>
              </div>
              <button onClick={() => handleGuestChange(1)}
                style={{ width: 44, height: 44, borderRadius: '50%', border: `1.5px solid #D8DAC8`, background: 'transparent', fontSize: 22, cursor: 'pointer', color: RED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>

            {availableSlot
              ? <div style={{ background: '#EAF3DE', color: '#2D6A4F', padding: '10px 13px', borderRadius: 4, fontSize: 13, fontWeight: 600, marginBottom: 18 }}>
                  ✓ Hay lugar para {guests} {guests === 1 ? 'persona' : 'personas'} en este horario
                </div>
              : <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '10px 13px', borderRadius: 4, fontSize: 13, fontWeight: 600, marginBottom: 18 }}>
                  Sin disponibilidad para {guests} personas en este horario.
                </div>
            }

            <button style={{ ...btnPrimary, opacity: !availableSlot || loading ? 0.4 : 1 }}
              disabled={!availableSlot || loading}
              onClick={handleContinueToForm}>
              {loading ? 'Verificando...' : 'CONTINUAR'}
            </button>
          </>
        )}

        {/* ── STEP 4: Form ── */}
        {step === 4 && (
          <>
            <button style={btnSecondary} onClick={() => goStep(3)}>← Volver</button>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: BLUE, textTransform: 'uppercase', marginBottom: 4 }}>Paso 4 de 4</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: DARK, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Tus datos</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Completá tu información para confirmar la reserva</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Nombre</label>
                <input style={inputStyle} placeholder="Ana" value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Apellido</label>
                <input style={inputStyle} placeholder="González" value={form.apellido}
                  onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Teléfono / WhatsApp</label>
                <input style={inputStyle} placeholder="+54 341 000-0000" value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Fecha de nacimiento</label>
                <input type="date" style={inputStyle} value={form.birthDate}
                  onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  Email <span style={{ color: '#aaa', fontWeight: 400, textTransform: 'none' }}>(opcional — para confirmación)</span>
                </label>
                <input type="email" style={inputStyle} placeholder="tu@email.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>

            <div style={{ background: '#fff', border: `1.5px solid #D8DAC8`, borderRadius: 4, padding: 16, marginBottom: 18 }}>
              {[
                ['Fecha', selectedDate ? formatDateLong(selectedDate) : '—'],
                ['Horario', selectedSlot ? `${selectedSlot.time} hs` : '—'],
                ['Personas', guests],
              ].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #EDE5DC', fontSize: 13 }}>
                  <span style={{ color: '#888' }}>{k}</span>
                  <span style={{ fontWeight: 700, color: DARK }}>{v}</span>
                </div>
              ))}
            </div>

            <button
              style={{ ...btnPrimary, opacity: (!form.nombre || !form.apellido || !form.telefono || !form.birthDate || loading) ? 0.4 : 1 }}
              disabled={!form.nombre || !form.apellido || !form.telefono || !form.birthDate || loading}
              onClick={handleConfirm}>
              {loading ? 'Confirmando...' : 'CONFIRMAR RESERVA'}
            </button>
          </>
        )}

        {/* ── STEP 5: Confirmation ── */}
        {step === 5 && confirmation && (
          <div style={{ textAlign: 'center', paddingTop: 24 }}>
            <div style={{ width: 64, height: 64, background: '#EAF3DE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 28 }}>✓</div>

            <div style={{ display: 'inline-block', background: confirmation.returning ? BLUE : RED, color: CREAM, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '5px 16px', borderRadius: 2, marginBottom: 14 }}>
              {confirmation.returning ? 'BIENVENIDO DE VUELTA' : 'RESERVA CONFIRMADA'}
            </div>

            <h2 style={{ fontSize: 32, fontWeight: 900, color: DARK, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {confirmation.returning ? '¡Qué bueno volverte a ver!' : '¡Todo listo!'}
            </h2>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
              {confirmation.returning
                ? '¡Ya tenemos tu mesa lista! Siempre es un placer tenerte en Vinito Pichincha.'
                : 'Tu mesa está reservada. ¡Nos vemos pronto en Vinito Pichincha, Jujuy 2248, Rosario!'}
            </p>

            <div style={{ background: '#fff', border: `1.5px solid #D8DAC8`, borderRadius: 4, padding: 16, maxWidth: 360, margin: '0 auto 16px', textAlign: 'left' }}>
              {[
                ['Nombre', confirmation.clientName],
                ['Fecha', selectedDate ? formatDateLong(selectedDate) : '—'],
                ['Horario', selectedSlot ? `${selectedSlot.time} hs` : '—'],
                ['Personas', guests],
              ].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #EDE5DC', fontSize: 13 }}>
                  <span style={{ color: '#888' }}>{k}</span>
                  <span style={{ fontWeight: 700, color: DARK }}>{v}</span>
                </div>
              ))}
            </div>

            {form.email && (
              <div style={{ background: '#EAF3DE', color: '#2D6A4F', borderRadius: 4, padding: '10px 14px', maxWidth: 360, margin: '0 auto 16px', fontSize: 12, fontWeight: 600, textAlign: 'left' }}>
                ✓ Te enviamos un email de confirmación a {form.email}
              </div>
            )}

            <div style={{ background: '#EEF3F7', color: BLUE, borderRadius: 4, padding: '10px 14px', maxWidth: 360, margin: '0 auto 20px', fontSize: 12, fontWeight: 600, textAlign: 'left' }}>
              Recibirás un mensaje de WhatsApp confirmando tu reserva y un recordatorio 1 hora antes.
            </div>

            <button style={{ ...btnSecondary }} onClick={resetAll}>Nueva reserva</button>
          </div>
        )}
      </div>
    </div>
  )
}
