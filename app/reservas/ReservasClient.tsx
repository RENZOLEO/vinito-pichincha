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
