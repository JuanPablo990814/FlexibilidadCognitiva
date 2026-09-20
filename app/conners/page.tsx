'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { saveConnersTeacherResult } from './actions'

const ITEMS = [
  'Tiene excesiva inquietud motora.', 'Tiene explosiones impredecibles de mal genio.', 'Se distrae fácilmente, tiene escasa atención.', 'Molesta frecuentemente a otros niños.', 'Tiene aspecto enfadado, huraño.', 'Cambia bruscamente sus estados de ánimo.', 'Intranquilo, siempre en movimiento.', 'Es impulsivo e irritable.', 'No termina las tareas que empieza.', 'Sus esfuerzos se frustran fácilmente.',
]
const OPTIONS = [['Nada', 0], ['Poco', 1], ['Bastante', 2], ['Mucho', 3]] as const

export default function ConnersTeacherPage() {
  const [step, setStep] = useState<'intro' | 'form' | 'done'>('intro')
  const [teacher, setTeacher] = useState('')
  const [course, setCourse] = useState('')
  const [notes, setNotes] = useState('')
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const complete = Object.keys(answers).length === ITEMS.length
  const total = Object.values(answers).reduce((sum, value) => sum + value, 0)

  const submit = () => {
    if (!teacher.trim()) { setError('Escribe el nombre del docente que realiza la valoración.'); return }
    if (!complete) { setError('Valora las 10 conductas antes de guardar.'); return }
    startTransition(async () => {
      try {
        const result = await saveConnersTeacherResult({ docente: teacher, curso: course, respuestas: answers, observaciones: notes })
        if (result.error) setError(result.error ?? 'No fue posible guardar el registro docente.')
        else setStep('done')
      } catch {
        setError('No se pudo contactar el servidor. Inténtalo de nuevo.')
      }
    })
  }

  return <main className="site-shell"><section className="site-hero px-6 py-7"><div className="max-w-3xl mx-auto"><header className="site-nav"><Link href="/evaluaciones" className="nav-pill bg-white/70">← Pruebas</Link><div className="brand-lockup"><span className="brand-dot" />Registro docente</div></header>{step === 'intro' && <div className="mt-14 max-w-2xl"><p className="site-eyebrow">Conners abreviado · profesor</p><h1 className="display-title display-title--small mt-4">Observación<br />del aula.</h1><p className="site-copy text-lg mt-6">Responde según la conducta que has observado en el contexto escolar. Este registro apoya la revisión profesional; no establece un diagnóstico por sí solo.</p></div>}</div></section><section className="max-w-3xl mx-auto px-6 py-10">
    {step === 'intro' && <div className="site-card"><div className="grid sm:grid-cols-3 gap-4 text-sm text-[#45535a]"><p><strong className="block text-[#20232c]">10 conductas</strong>de atención e inquietud.</p><p><strong className="block text-[#20232c]">0 a 3</strong>Nada, Poco, Bastante o Mucho.</p><p><strong className="block text-[#20232c]">Docente</strong>quien observa y responde.</p></div><button onClick={() => setStep('form')} className="site-button mt-7">Comenzar registro →</button></div>}
    {step === 'form' && <><div className="site-card mb-5 grid sm:grid-cols-2 gap-4"><label className="text-sm font-semibold text-[#20232c]">Docente que responde<input value={teacher} onChange={e => setTeacher(e.target.value)} className="mt-2 w-full rounded-lg border border-[#c8d1d3] bg-white px-3 py-2 font-normal outline-none focus:border-[#302f4c]" placeholder="Nombre completo" /></label><label className="text-sm font-semibold text-[#20232c]">Curso o grupo <span className="font-normal text-[#657078]">(opcional)</span><input value={course} onChange={e => setCourse(e.target.value)} className="mt-2 w-full rounded-lg border border-[#c8d1d3] bg-white px-3 py-2 font-normal outline-none focus:border-[#302f4c]" placeholder="Ej. 4°A" /></label></div><div className="flex justify-between mb-5 text-sm text-[#657078]"><span>Conductas valoradas</span><strong>{Object.keys(answers).length}/10 · Total {total}/30</strong></div><div className="space-y-4">{ITEMS.map((item, index) => { const number = index + 1; return <fieldset key={number} className="site-card"><legend className="sr-only">Conducta {number}</legend><p className="font-medium text-[#20232c]"><span className="mr-2 text-[#50686c]">{number}.</span>{item}</p><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">{OPTIONS.map(([label, value]) => <button key={value} type="button" onClick={() => { setAnswers(current => ({ ...current, [number]: value })); setError('') }} className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${answers[number] === value ? 'border-[#302f4c] bg-[#302f4c] text-white' : 'border-[#c8d1d3] bg-white text-[#45535a] hover:border-[#302f4c]'}`}>{label}<span className="block text-[10px] opacity-80">{value} puntos</span></button>)}</div></fieldset> })}</div><label className="site-card block mt-5 text-sm font-semibold text-[#20232c]">Observaciones <span className="font-normal text-[#657078]">(opcional)</span><textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-[#c8d1d3] bg-white p-3 font-normal outline-none focus:border-[#302f4c]" placeholder="Contexto relevante de la observación" /></label>{error && <p className="mt-4 text-sm text-[#9b3123]">{error}</p>}<button onClick={submit} disabled={isPending} className="site-button w-full mt-6 py-4 disabled:opacity-60">{isPending ? 'Guardando…' : 'Guardar valoración docente →'}</button></>}
    {step === 'done' && <div className="site-card text-center"><div className="text-5xl">✓</div><h1 className="text-3xl font-semibold mt-4">Registro guardado</h1><p className="site-copy mt-3">La valoración quedó vinculada al estudiante para revisión en el panel investigador.</p><Link href="/evaluaciones" className="site-button mt-7">Volver a las pruebas</Link></div>}
  </section></main>
}
