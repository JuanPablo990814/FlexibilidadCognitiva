'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { persistEvaluation } from '@/lib/evaluations/client'

const ITEMS = [
  'Hago bien los trabajos escolares.', 'Hago fácilmente amigos.', 'Tengo miedo de algunas cosas.', 'Soy criticado en casa.', 'Me cuido físicamente.', 'Mis profesores me consideran un buen trabajador.', 'Soy una persona amigable.', 'Muchas cosas me ponen nervioso.', 'Me siento feliz en casa.', 'Me buscan para realizar actividades deportivas.', 'Trabajo mucho en clase.', 'Es difícil para mí hacer amigos.', 'Me asusto con facilidad.', 'Mi familia está decepcionada de mí.', 'Me considero elegante.', 'Mis profesores me estiman.', 'Soy una persona alegre.', 'Cuando los mayores me dicen algo me pongo muy nervioso.', 'Mi familia me ayudaría en cualquier tipo de problemas.', 'Me gusta cómo soy físicamente.', 'Soy un buen trabajador.', 'Me cuesta hablar con desconocidos.', 'Me pongo muy nervioso cuando me pregunta el profesor.', 'Mis padres me dan confianza.', 'Soy bueno haciendo deporte.', 'Mis profesores me consideran inteligente y trabajador.', 'Tengo muchos amigos.', 'Me siento nervioso.', 'Me siento querido por mis padres.', 'Soy una persona atractiva.'
]
const DIMENSIONS = {
  academico: { name: 'Académico/laboral', items: [1, 6, 11, 16, 21, 26], inverse: [] },
  social: { name: 'Social', items: [2, 7, 12, 17, 22, 27], inverse: [12, 22] },
  emocional: { name: 'Emocional', items: [3, 8, 13, 18, 23, 28], inverse: [3] },
  familiar: { name: 'Familiar', items: [4, 9, 14, 19, 24, 29], inverse: [4, 14, 19] },
  fisico: { name: 'Físico', items: [5, 10, 15, 20, 25, 30], inverse: [] },
} as const

export default function Af5Page() {
  const [step, setStep] = useState<'intro' | 'form' | 'done'>('intro')
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [error, setError] = useState(false)
  const [isPending, startTransition] = useTransition()
  const completed = Object.keys(answers).length
  const setAnswer = (number: number, value: number) => {
    if (!Number.isInteger(value) || value < 1 || value > 99) return
    setAnswers(prev => ({ ...prev, [number]: value }))
    setError(false)
  }
  const completePendingWithNeutral = () => {
    setAnswers(prev => Object.fromEntries(ITEMS.map((_, index) => [index + 1, prev[index + 1] ?? 50])))
    setError(false)
  }
  const score = (key: keyof typeof DIMENSIONS) => { const dimension = DIMENSIONS[key]; return dimension.items.reduce((sum, item) => sum + (dimension.inverse.includes(item as never) ? 100 - answers[item] : answers[item]), 0) / 6 }
  const submit = () => {
    if (completed !== 30) { setError(true); return }
    const dimensions = Object.fromEntries(Object.keys(DIMENSIONS).map(key => [key, Number(score(key as keyof typeof DIMENSIONS).toFixed(2))]))
    startTransition(async () => { const result = await persistEvaluation('/api/resultados/af5', { respuestas: answers, dimensiones: dimensions }); if (!result.success) alert(result.error ?? 'No fue posible guardar el cuestionario AF5.'); else setStep('done') })
  }
  return <main className="site-shell"><section className="site-hero px-6 py-6"><div className="max-w-3xl mx-auto"><header className="site-nav"><Link href="/evaluaciones" className="nav-pill bg-white/70">← Pruebas</Link><div className="brand-lockup"><span className="brand-dot" />AF5</div></header>{step === 'intro' && <div className="mt-14 max-w-2xl"><p className="site-eyebrow">Cuestionario de autoconcepto</p><h1 className="display-title display-title--small mt-4">Cómo te ves<br />a ti mismo.</h1><p className="site-copy text-lg max-w-xl mt-6">Lee cada frase y mueve la barra hasta el número que mejor diga cuánto estás de acuerdo. No hay respuestas buenas ni malas.</p></div>}</div></section><section className="max-w-3xl mx-auto px-6 py-10">
    {step === 'intro' && <div className="site-card"><div className="grid sm:grid-cols-3 gap-4 text-sm text-[#45535a]"><p><strong className="block text-[#20232c]">30 frases</strong>sobre ti.</p><p><strong className="block text-[#20232c]">1 a 99</strong>1 = nada de acuerdo<br />99 = muy de acuerdo.</p><p><strong className="block text-[#20232c]">10–15 minutos</strong>contesta con sinceridad.</p></div><button onClick={() => setStep('form')} className="site-button mt-7">Empezar →</button></div>}
    {step === 'form' && <><div className="flex justify-between mb-5 text-sm text-[#657078]"><span>Tu progreso</span><strong>{completed}/30</strong></div><div className="h-2 rounded-full bg-[#e5e2f4] mb-8"><div className="h-full rounded-full bg-[#302f4c] transition-all" style={{ width: `${completed / 30 * 100}%` }} /></div><div className="space-y-4">{ITEMS.map((text, index) => { const number = index + 1; const value = answers[number]; return <div key={number} className={`site-card ${value ? 'border-[#a59fca]' : ''}`}><div className="flex gap-3"><span className="w-7 h-7 shrink-0 rounded-full bg-[#e5e2f4] flex items-center justify-center text-xs font-bold">{number}</span><p className="text-[#20232c] leading-relaxed">{text}</p></div><div className="mt-5 grid grid-cols-[1fr_auto] gap-4 items-center"><input aria-label={`Respuesta ${number}`} type="range" min="1" max="99" value={value ?? 50} onChange={e => setAnswer(number, Number(e.target.value))} className="w-full accent-[#302f4c]" /><input aria-label={`Valor de respuesta ${number}`} type="number" min="1" max="99" value={value ?? ''} onChange={e => setAnswer(number, Number(e.target.value))} placeholder="—" className="w-14 py-2 text-center rounded-lg border border-[#c8d1d3] bg-[#f8f7f3] font-bold" /></div><div className="flex justify-between text-[11px] text-[#657078]"><span>Nada de acuerdo · 1</span><span>Muy de acuerdo · 99</span></div>{value == null && <button type="button" onClick={() => setAnswer(number, 50)} className="mt-3 text-xs font-semibold text-[#302f4c] underline">Confirmar 50 (punto medio)</button>}</div> })}</div>{error && <div className="mt-5 rounded-lg bg-[#f9e8e5] p-4 text-sm text-[#9b3123]"><p>Faltan {30 - completed} respuestas. Las casillas con <strong>—</strong> aún no han quedado confirmadas.</p><button type="button" onClick={completePendingWithNeutral} className="mt-2 font-semibold underline">Completar las pendientes con 50</button></div>}<button onClick={submit} disabled={isPending} className="site-button w-full mt-7 py-4 disabled:opacity-60">{isPending ? 'Guardando…' : 'Guardar mis respuestas →'}</button></>}
    {step === 'done' && <div className="site-card text-center"><div className="text-5xl">✓</div><h1 className="text-3xl font-semibold mt-4">¡Gracias!</h1><p className="site-copy mt-3">Tus respuestas se guardaron. Tu docente podrá revisar los resultados.</p><Link href="/evaluaciones" className="site-button mt-7">Volver a las pruebas</Link></div>}
  </section></main>
}
