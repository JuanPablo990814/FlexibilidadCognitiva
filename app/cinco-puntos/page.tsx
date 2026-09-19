'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { saveFivePointResult, type FivePointDesign } from './actions'

const POINTS = [[18, 18], [82, 18], [50, 50], [18, 82], [82, 82]] as const
const TOTAL = 30
const SECONDS = 180
type Step = 'intro' | 'test' | 'done'

function FivePointFigure({ lines, onAdd, disabled, small = false }: { lines: [number, number][], onAdd?: (point: number) => void, disabled?: boolean, small?: boolean }) {
  const [selected, setSelected] = useState<number | null>(null)
  const choose = (point: number) => {
    if (disabled || !onAdd) return
    if (selected === null) setSelected(point)
    else if (selected !== point) { onAdd(point); setSelected(point) }
  }
  const size = small ? 'w-28 h-28' : 'w-full max-w-[300px]'
  return <svg className={size} viewBox="0 0 100 100" aria-label="Figura de cinco puntos">
    {lines.map(([a, b], i) => <line key={`${a}-${b}-${i}`} x1={POINTS[a][0]} y1={POINTS[a][1]} x2={POINTS[b][0]} y2={POINTS[b][1]} stroke="#6c63ff" strokeWidth="4" strokeLinecap="round" />)}
    {POINTS.map(([x, y], index) => <circle key={index} cx={x} cy={y} r={small ? 4 : 5} fill={selected === index ? '#00d4aa' : '#111827'} stroke={selected === index ? '#00d4aa' : 'white'} strokeWidth="1.5" className={onAdd && !disabled ? 'cursor-pointer' : ''} onClick={() => choose(index)} />)}
  </svg>
}

export default function CincoPuntosPage() {
  const [step, setStep] = useState<Step>('intro')
  const [slot, setSlot] = useState(0)
  const [lines, setLines] = useState<[number, number][]>([])
  const [designs, setDesigns] = useState<FivePointDesign[]>([])
  const [secondsLeft, setSecondsLeft] = useState(SECONDS)
  const [isPending, startTransition] = useTransition()
  const [comprendioInstruccion, setComprendioInstruccion] = useState<boolean | null>(null)
  const [repitioInstruccion, setRepitioInstruccion] = useState<boolean | null>(null)

  const elapsed = SECONDS - secondsLeft
  const finish = useCallback((finalDesigns: FivePointDesign[]) => {
    setStep('done')
    startTransition(() => { saveFivePointResult(finalDesigns, elapsed, comprendioInstruccion, repitioInstruccion) })
  }, [elapsed, comprendioInstruccion, repitioInstruccion])

  useEffect(() => {
    if (step !== 'test' || secondsLeft <= 0) return
    const timer = window.setInterval(() => setSecondsLeft(value => value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [step, secondsLeft])
  useEffect(() => { if (step === 'test' && secondsLeft === 0) finish(designs) }, [secondsLeft, step, designs, finish])

  // Keep the point-selection interaction in a child-independent state.
  const [fromPoint, setFromPoint] = useState<number | null>(null)
  const selectPoint = (point: number) => {
    if (fromPoint === null) { setFromPoint(point); return }
    if (fromPoint === point) return
    setLines(current => [...current, [fromPoint, point]])
    setFromPoint(point)
  }

  const saveDesign = () => {
    if (lines.length === 0) return
    const next = [...designs, { lines }]
    setDesigns(next); setLines([]); setFromPoint(null)
    if (next.length === TOTAL) finish(next)
    else setSlot(next.length)
  }
  const time = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
  const example = useMemo(() => [[0, 2], [2, 4]] as [number, number][], [])

  return <main className="min-h-screen px-4 py-6" style={{ background: 'radial-gradient(ellipse at top, #20152e 0%, #0f1117 70%)' }}>
    <div className="max-w-4xl mx-auto">
      {step === 'intro' && <div className="max-w-2xl mx-auto text-center">
        <div className="text-5xl mb-4">✏️</div><h1 className="text-3xl font-bold text-white">El juego de los cinco puntos</h1>
        <p className="text-[#cbd5e1] mt-3 text-lg">Vas a crear dibujos diferentes uniendo los puntos con líneas.</p>
        <div className="card mt-7 text-left border-[#a855f7]/40">
          <h2 className="text-xl font-bold text-white">Mira este ejemplo</h2>
          <div className="flex flex-col sm:flex-row items-center gap-5 mt-4">
            <FivePointFigure lines={example} small />
            <div className="text-[#cbd5e1] space-y-2"><p>1. Toca un punto.</p><p>2. Toca otro punto para unirlos.</p><p>3. Haz un dibujo distinto en cada cuadro.</p><p className="text-[#fbbf24] font-semibold">¡No repitas tus dibujos!</p></div>
          </div>
          <p className="text-sm text-[#94a3b8] mt-4">Tendrás 3 minutos y hasta 30 cuadros. Puedes usar 2, 3, 4 o los 5 puntos.</p>
        </div>
        <div className="mt-6 text-left rounded-xl border border-black/10 bg-white/70 p-4">
          <p className="text-sm font-semibold text-[#20232c]">Antes de iniciar, el docente registra:</p>
          <Question label="¿Comprendió la instrucción?" value={comprendioInstruccion} onChange={setComprendioInstruccion} />
          <Question label="¿Necesitó repetición de instrucciones?" value={repitioInstruccion} onChange={setRepitioInstruccion} />
        </div>
        <button className="btn-primary mt-7 bg-[#a855f7] hover:bg-[#9333ea]" onClick={() => setStep('test')}>¡Entendí, empezar!</button>
      </div>}

      {step === 'test' && <>
        <header className="flex items-center justify-between mb-5"><Link href="/evaluaciones" className="text-sm text-[#94a3b8]">← Salir</Link><span className="text-white font-bold">Dado {slot + 1} de {TOTAL}</span><span className="font-mono font-bold text-[#fbbf24]">⏱ {time}</span></header>
        <div className="card border-[#a855f7]/40 text-center"><h1 className="text-xl font-bold text-white">Haz una figura diferente</h1><p className="text-[#94a3b8] text-sm mt-1">Toca un punto y luego otro para dibujar una línea.</p>
          <div className="flex justify-center my-6"><svg className="w-full max-w-[330px]" viewBox="0 0 100 100">{lines.map(([a,b], i) => <line key={i} x1={POINTS[a][0]} y1={POINTS[a][1]} x2={POINTS[b][0]} y2={POINTS[b][1]} stroke="#a855f7" strokeWidth="4" strokeLinecap="round" />)}{POINTS.map(([x,y], i) => <circle key={i} cx={x} cy={y} r="5" fill={fromPoint === i ? '#00d4aa' : '#111827'} stroke="white" strokeWidth="1.5" className="cursor-pointer" onClick={() => selectPoint(i)} />)}</svg></div>
          <div className="flex justify-center gap-3"><button className="btn-outline" onClick={() => { setLines([]); setFromPoint(null) }}>Borrar</button><button className="btn-primary bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-40" disabled={lines.length === 0} onClick={saveDesign}>Guardar figura</button></div>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mt-5">{Array.from({ length: TOTAL }, (_, i) => <div key={i} className={`aspect-square rounded border text-center text-xs pt-1 ${i < designs.length ? 'border-[#a855f7] text-[#c084fc]' : i === slot ? 'border-[#00d4aa] text-[#00d4aa]' : 'border-[#2a2d3e] text-[#64748b]'}`}>{i + 1}</div>)}</div>
      </>}
      {step === 'done' && <div className="card max-w-xl text-center mx-auto mt-16"><div className="text-5xl">🎉</div><h1 className="text-2xl font-bold text-white mt-4">¡Terminaste!</h1><p className="text-[#cbd5e1] mt-3">Guardaste {designs.length} figura{designs.length === 1 ? '' : 's'}. Tu docente las revisará.</p><p className="text-sm text-[#94a3b8] mt-3">{isPending ? 'Guardando…' : 'Resultado guardado.'}</p><Link href="/evaluaciones" className="btn-primary inline-block mt-6">Volver a las pruebas</Link></div>}
    </div>
  </main>
}

function Question({ label, value, onChange }: { label: string, value: boolean | null, onChange: (value: boolean) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 mt-3"><span className="text-sm text-[#45535a]">{label}</span><div className="flex gap-2"><button type="button" onClick={() => onChange(true)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${value === true ? 'bg-[#dcf5e6] border-[#7acb9a] text-[#17673d]' : 'bg-white border-black/10 text-[#657078]'}`}>Sí</button><button type="button" onClick={() => onChange(false)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${value === false ? 'bg-[#f1e9e7] border-[#d5a29b] text-[#8b2e23]' : 'bg-white border-black/10 text-[#657078]'}`}>No</button></div></div>
}
