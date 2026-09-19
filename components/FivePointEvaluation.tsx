'use client'

import { useState, useTransition } from 'react'
import { updateFivePointEvaluation } from '@/app/admin/actions'

type Design = { lines: [number, number][] }
type Evaluation = 'pendiente' | 'unico' | 'repetido' | 'infraccion'
const POINTS = [[18,18], [82,18], [50,50], [18,82], [82,82]] as const

function MiniDesign({ design }: { design: Design }) {
  return <svg className="w-full" viewBox="0 0 100 100">{design.lines.map(([a,b], i) => <line key={i} x1={POINTS[a][0]} y1={POINTS[a][1]} x2={POINTS[b][0]} y2={POINTS[b][1]} stroke="#a855f7" strokeWidth="4" strokeLinecap="round" />)}{POINTS.map(([x,y], i) => <circle key={i} cx={x} cy={y} r="5" fill="#111827" stroke="white" strokeWidth="1.5" />)}</svg>
}

export default function FivePointEvaluation({ idResultado, designs, initialEvaluation }: { idResultado: string, designs: Design[], initialEvaluation: Evaluation[] }) {
  const [evaluation, setEvaluation] = useState<Evaluation[]>(() => designs.map((_, i) => initialEvaluation[i] ?? 'pendiente'))
  const [isPending, startTransition] = useTransition()
  const counts = evaluation.reduce((acc, value) => ({ ...acc, [value]: acc[value] + 1 }), { pendiente: 0, unico: 0, repetido: 0, infraccion: 0 } as Record<Evaluation, number>)
  const save = () => startTransition(async () => { const result = await updateFivePointEvaluation(idResultado, evaluation); if (result.error) alert(result.error) })

  return <div className="mt-5 border-t border-[#2a2d3e] pt-5">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4"><div><h4 className="font-semibold text-white">Revisión del docente</h4><p className="text-xs text-[#94a3b8]">Clasifica cada figura: única, repetida o con infracción.</p></div><button onClick={save} disabled={isPending} className="btn-primary text-sm py-2 bg-[#a855f7] hover:bg-[#9333ea]">{isPending ? 'Guardando…' : 'Guardar evaluación'}</button></div>
    <div className="flex gap-3 text-xs mb-4"><span className="text-[#22c55e]">Únicas: {counts.unico}</span><span className="text-[#f59e0b]">Repetidas: {counts.repetido}</span><span className="text-[#ef4444]">Infracciones: {counts.infraccion}</span><span className="text-[#94a3b8]">Pendientes: {counts.pendiente}</span></div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">{designs.map((design, index) => <div key={index} className="rounded-xl border border-[#2a2d3e] p-2 bg-[#11131b]"><div className="flex justify-between text-xs text-[#94a3b8]"><span>Figura {index + 1}</span><span>{design.lines.length} líneas</span></div><MiniDesign design={design} /><select value={evaluation[index]} onChange={e => setEvaluation(values => values.map((value, i) => i === index ? e.target.value as Evaluation : value))} className="w-full bg-[#1a1d2e] border border-[#2a2d3e] rounded p-1.5 text-xs text-white"><option value="pendiente">Pendiente</option><option value="unico">Única</option><option value="repetido">Repetida</option><option value="infraccion">Infracción</option></select></div>)}</div>
  </div>
}
