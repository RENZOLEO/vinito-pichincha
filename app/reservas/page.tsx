// app/reservas/page.tsx
import ReservasClient from './ReservasClient'

export const metadata = {
  title: 'Reservas · Vinito Pichincha',
  description: 'Reservá tu mesa en Vinito Pichincha · Jujuy 2248, Rosario',
}

export default function ReservasPage() {
  return <ReservasClient />
}
