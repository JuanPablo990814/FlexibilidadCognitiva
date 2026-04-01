'use client'

type Color = 'rojo' | 'verde' | 'amarillo' | 'azul'
type Forma = 'triangulo' | 'estrella' | 'cruz' | 'circulo'

interface Carta {
  color: Color
  forma: Forma
  numero: 1 | 2 | 3 | 4
}

interface WCSTCardProps {
  carta: Carta
  selected?: boolean
  highlight?: 'correct' | 'incorrect'
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}

const COLOR_MAP: Record<Color, string> = {
  rojo: '#ef4444',
  verde: '#22c55e',
  amarillo: '#eab308',
  azul: '#3b82f6',
}

function Triangle({ color }: { color: string }) {
  return <polygon points="12,2 22,20 2,20" fill={color} />
}

function Star({ color }: { color: string }) {
  return (
    <polygon
      points="12,1 14.9,8.9 22.5,9.1 16.6,14.1 18.7,21.9 12,17.4 5.3,21.9 7.4,14.1 1.5,9.1 9.1,8.9"
      fill={color}
    />
  )
}

function Cross({ color }: { color: string }) {
  return (
    <g fill={color}>
      <rect x="9" y="2" width="6" height="20" rx="1" />
      <rect x="2" y="9" width="20" height="6" rx="1" />
    </g>
  )
}

function Circle({ color }: { color: string }) {
  return <circle cx="12" cy="12" r="10" fill={color} />
}

function FormaIcon({ forma, color }: { forma: Forma; color: string }) {
  const c = COLOR_MAP[color as Color] ?? color
  switch (forma) {
    case 'triangulo': return <Triangle color={c} />
    case 'estrella': return <Star color={c} />
    case 'cruz': return <Cross color={c} />
    case 'circulo': return <Circle color={c} />
  }
}

function renderFiguras(carta: Carta) {
  const count = carta.numero
  const positions: Record<number, { x: number; y: number }[]> = {
    1: [{ x: 50, y: 50 }],
    2: [{ x: 50, y: 25 }, { x: 50, y: 70 }],
    3: [{ x: 50, y: 15 }, { x: 50, y: 50 }, { x: 50, y: 82 }],
    4: [{ x: 28, y: 28 }, { x: 72, y: 28 }, { x: 28, y: 72 }, { x: 72, y: 72 }],
  }

  return positions[count].map((pos, i) => (
    <g key={i} transform={`translate(${pos.x - 12}, ${pos.y - 12})`}>
      <svg width="24" height="24" viewBox="0 0 24 24">
        <FormaIcon forma={carta.forma} color={carta.color} />
      </svg>
    </g>
  ))
}

const SIZE_MAP = {
  sm: { w: 80, h: 110, class: 'w-20 h-28' },
  md: { w: 110, h: 150, class: 'w-28 h-40' },
  lg: { w: 140, h: 190, class: 'w-36 h-48' },
}

export type { Carta, Color, Forma }
export default function WCSTCard({ carta, selected, highlight, onClick, size = 'md' }: WCSTCardProps) {
  const s = SIZE_MAP[size]

  let borderStyle = '2px solid #2a2d3e'
  let shadow = ''
  let bgStyle = '#ffffff'

  if (selected) {
    borderStyle = '2px solid #6c63ff'
    shadow = '0 0 16px rgba(108,99,255,0.4)'
  }
  if (highlight === 'correct') {
    borderStyle = '3px solid #22c55e'
    shadow = '0 0 20px rgba(34,197,94,0.5)'
    bgStyle = '#f0fdf4'
  }
  if (highlight === 'incorrect') {
    borderStyle = '3px solid #ef4444'
    shadow = '0 0 20px rgba(239,68,68,0.5)'
    bgStyle = '#fef2f2'
  }

  return (
    <div
      onClick={onClick}
      className={`${s.class} rounded-xl flex items-center justify-center transition-all duration-200 ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} ${highlight === 'incorrect' ? 'animate-[shake_0.4s_ease-out]' : ''} ${highlight === 'correct' ? 'animate-[pop_0.3s_ease-out]' : ''}`}
      style={{ border: borderStyle, boxShadow: shadow, background: bgStyle }}
    >
      <svg width={s.w - 20} height={s.h - 20} viewBox="0 0 100 100">
        {renderFiguras(carta)}
      </svg>
    </div>
  )
}
