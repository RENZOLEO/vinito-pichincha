'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

const RED = '#C54329'
const DARK = '#202020'
const CREAM = '#ECEEE1'
const BLUE = '#6F889A'

export default function FeedbackPage() {
  const { id } = useParams()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!rating) { setError('Por favor seleccioná una puntuación'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: Number(id), rating, comment }),
      })
      if (!res.ok) throw new Error()
      setDone(true)
    } catch {
      setError('Hubo un error. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div style={{ minHeight: '100vh', background: CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ width: 64, height: 64, background: '#EAF3DE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
        <h2 style={{ color: DARK, fontSize: 24, marginBottom: 12 }}>¡Gracias por tu opinión!</h2>
        <p style={{ color: BLUE, fontSize: 14, lineHeight: 1.7 }}>Tu feedback nos ayuda a mejorar. ¡Esperamos verte pronto en Vinito Pichincha!</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: CREAM, fontFamily: 'sans-serif' }}>
      <div style={{ background: DARK, padding: '16px 24px' }}>
        <h1 style={{ color: RED, fontSize: 22, margin: 0, letterSpacing: 3 }}>VINITO</h1>
        <p style={{ color: 'rgba(236,238,225,0.5)', fontSize: 9, margin: '4px 0 0', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Pichincha · Jujuy 2248, Rosario</p>
      </div>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px' }}>
        <h2 style={{ color: DARK, fontSize: 22, marginBottom: 8 }}>¿Cómo estuvo tu visita?</h2>
        <p style={{ color: BLUE, fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>Tu opinión nos ayuda a mejorar. Solo toma un minuto.</p>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Puntuación</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)}
                style={{ width: 48, height: 48, borderRadius: '50%', border: `1.5px solid ${rating >= n ? RED : '#D8DAC8'}`, background: rating >= n ? RED : '#fff', color: rating >= n ? CREAM : DARK, fontSize: 18, cursor: 'pointer', fontWeight: 700 }}>
                ★
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Comentario <span style={{ color: '#aaa', fontWeight: 400 }}>(opcional)</span></div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="¿Qué te pareció? ¿Qué podríamos mejorar?"
            rows={4}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D8DAC8', borderRadius: 6, background: '#fff', fontFamily: 'inherit', fontSize: 14, color: DARK, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        {error && <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '10px 14px', borderRadius: 4, marginBottom: 16, fontSize: 13 }}>{error}</div>}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: 14, background: RED, color: CREAM, border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Enviando...' : 'ENVIAR OPINIÓN'}
        </button>
      </div>
    </div>
  )
}
