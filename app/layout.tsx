import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Flexibilidad Cognitiva — Herramientas de Evaluación',
  description: 'Plataforma de evaluación de flexibilidad cognitiva y autorregulación. Cuestionario CAR y Test WCST.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  )
}
