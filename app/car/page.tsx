'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveCarResult } from './actions'

// ─────────────────────────────────────────────
// Configuración del CAR
// ─────────────────────────────────────────────

const ITEMS_INVERSOS = new Set([2, 3, 7, 10, 11, 12, 13, 14, 15])

const SUBESCALAS = {
  M: {
    label: 'Metas',
    items: [1, 2, 3, 4, 5, 6],
    min: 6,
    max: 30,
    color: '#6c63ff',
    colorDim: '#6c63ff22',
    icon: '🎯',
    description: 'Capacidad de fijarse y monitorear objetivos',
  },
  P: {
    label: 'Perseverancia',
    items: [7, 8, 9],
    min: 3,
    max: 15,
    color: '#00d4aa',
    colorDim: '#00d4aa22',
    icon: '💪',
    description: 'Fuerza de voluntad y resistencia a distracciones',
  },
  TD: {
    label: 'Toma de Decisiones',
    items: [10, 11, 12, 13, 14],
    min: 5,
    max: 25,
    color: '#f59e0b',
    colorDim: '#f59e0b22',
    icon: '⚖️',
    description: 'Capacidad de decidir con claridad y agilidad',
  },
  AR: {
    label: 'Aprendizaje de Errores',
    items: [15, 16, 17],
    min: 3,
    max: 15,
    color: '#ef4444',
    colorDim: '#ef444422',
    icon: '🔄',
    description: 'Aprendizaje y adaptación a partir de errores',
  },
} as const

type SubescalaKey = keyof typeof SUBESCALAS

const ITEMS = [
  'Normalmente, suelo controlar mi progreso en cuanto al logro de mis objetivos en el estudio.',
  'Me cuesta ponerme objetivos.',
  'Me cuesta hacer planes para poder alcanzar mis objetivos.',
  'Me pongo objetivos y controlo mi progreso.',
  'Una vez tengo un objetivo, normalmente, puedo planificar cómo alcanzarlo.',
  'Si tomo la determinación de hacer algo, pongo mucha atención a cómo me va.',
  'Me distraigo de mis planes fácilmente.',
  'Tengo mucha fuerza de voluntad.',
  'Soy capaz de resistir las tentaciones.',
  'Me cuesta decidirme sobre las cosas.',
  'Retraso tomar cualquier decisión.',
  'Tengo tanto proyectos que me es difícil concentrarme en ninguno.',
  'Cuando se trata de decidirme sobre algún cambio, me siento abrumado/a por las decisiones.',
  'Pequeños problemas o distracciones me desorientan.',
  'Parece que no aprendo de mis errores.',
  'Normalmente, con solo una vez que cometa un error, ya aprendo de él.',
  'Aprendo de mis errores.',
]

const LIKERT_LABELS = ['Nada', 'Poco', 'Regular', 'Bastante', 'Mucho']

// ─────────────────────────────────────────────
// Resultados
// ─────────────────────────────────────────────

interface CARResult {
  subescalas: Record<SubescalaKey, number>
  total: number
}

function calcularCAR(respuestas: Record<number, number>): CARResult {
  const puntos: Record<number, number> = {}
  for (let i = 1; i <= 17; i++) {
    const r = respuestas[i]
    puntos[i] = ITEMS_INVERSOS.has(i) ? 6 - r : r
  }

  const subescalas = {} as Record<SubescalaKey, number>
  for (const [key, sub] of Object.entries(SUBESCALAS) as [SubescalaKey, typeof SUBESCALAS[SubescalaKey]][]) {
    subescalas[key] = sub.items.reduce((acc, n) => acc + puntos[n], 0)
  }

  const total = Object.values(subescalas).reduce((a, b) => a + b, 0)
  return { subescalas, total }
}

function getInterpretacion(score: number, min: number, max: number): { nivel: string; desc: string; pct: number } {
  const pct = ((score - min) / (max - min)) * 100
  if (pct >= 70) return { nivel: 'Alto', desc: 'Fortaleza en esta área', pct }
  if (pct >= 40) return { nivel: 'Medio', desc: 'Área en desarrollo', pct }
  return { nivel: 'Bajo', desc: 'Área a reforzar', pct }
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

type Step = 'intro' | 'form' | 'results'

export default function CARPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('intro')
  const [respuestas, setRespuestas] = useState<Record<number, number>>({})
  const [resultado, setResultado] = useState<CARResult | null>(null)
  const [showError, setShowError] = useState(false)

  const respuestasPendientes = ITEMS.length - Object.keys(respuestas).length

  const handleResponder = (itemNum: number, valor: number) => {
    setRespuestas(prev => ({ ...prev, [itemNum]: valor }))
    setShowError(false)
  }

  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (Object.keys(respuestas).length < 17) {
      setShowError(true)
      // Scroll to first unanswered
      const firstUnanswered = ITEMS.findIndex((_, i) => !respuestas[i + 1])
      const el = document.getElementById(`item-${firstUnanswered + 1}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const r = calcularCAR(respuestas)
    setResultado(r)

    startTransition(async () => {
      const dbResponse = await saveCarResult(r)
      if (dbResponse?.error) {
        alert(dbResponse.error)
      } else {
        setStep('results')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  const handleReiniciar = () => {
    setRespuestas({})
    setResultado(null)
    setShowError(false)
    setStep('intro')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Determinar a qué subescala pertenece cada ítem
  const getSubescalaItem = (itemNum: number): SubescalaKey => {
    for (const [key, sub] of Object.entries(SUBESCALAS) as [SubescalaKey, typeof SUBESCALAS[SubescalaKey]][]) {
      if ((sub.items as readonly number[]).includes(itemNum)) return key
    }
    return 'M'
  }

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at top, #1a1d2e 0%, #0f1117 70%)' }}>
      {/* Nav */}
      <nav className="border-b border-[#2a2d3e] px-6 py-4 sticky top-0 bg-[#0f1117]/80 backdrop-blur-sm z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-[#64748b] hover:text-[#e2e8f0] transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Inicio
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: '#6c63ff22', color: '#6c63ff' }}>
              CAR
            </span>
            <span className="text-[#64748b] text-sm hidden sm:block">Cuestionario de Autorregulación</span>
          </div>
          {step === 'form' && (
            <span className="text-xs text-[#64748b]">
              {17 - respuestasPendientes}/17 respondidas
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">

        {/* ── STEP: INTRO ── */}
        {step === 'intro' && (
          <div className="animate-[slideUp_0.4s_ease-out]">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
                style={{ background: '#6c63ff22', border: '1px solid #6c63ff44' }}>
                <span className="text-3xl">📋</span>
              </div>
              <h1 className="text-3xl font-bold gradient-text mb-3">Cuestionario de Autorregulación</h1>
              <p className="text-[#64748b] text-sm">CAR — Versión abreviada en español</p>
            </div>

            <div className="card mb-6">
              <h2 className="font-semibold text-[#e2e8f0] mb-3">Instrucciones</h2>
              <div className="bg-[#6c63ff]/5 border border-[#6c63ff]/20 rounded-xl p-4 mb-4">
                <p className="text-[#e2e8f0] text-sm leading-relaxed italic">
                  "Por favor, responde las siguientes preguntas marcando la respuesta que mejor describe cómo eres tú. 
                  Marca el número que mejor represente tu nivel de acuerdo con las afirmaciones."
                </p>
              </div>
              <p className="text-[#64748b] text-sm mb-4">
                No hay respuestas correctas ni incorrectas. Sigue un buen ritmo al contestar las preguntas 
                y no pienses demasiado sobre ninguna de tus respuestas.
              </p>
              <div className="grid grid-cols-5 gap-2">
                {LIKERT_LABELS.map((label, i) => (
                  <div key={i} className="text-center">
                    <div className="w-10 h-10 rounded-xl border border-[#2a2d3e] flex items-center justify-center text-sm font-bold text-[#6c63ff] mx-auto mb-1">
                      {i + 1}
                    </div>
                    <p className="text-[#64748b] text-xs">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {(Object.entries(SUBESCALAS) as [SubescalaKey, typeof SUBESCALAS[SubescalaKey]][]).map(([key, sub]) => (
                <div key={key} className="p-3 rounded-xl text-center" style={{ background: sub.colorDim, border: `1px solid ${sub.color}33` }}>
                  <div className="text-xl mb-1">{sub.icon}</div>
                  <p className="text-xs font-semibold" style={{ color: sub.color }}>{sub.label}</p>
                  <p className="text-[#64748b] text-xs">{sub.items.length} ítems</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1d2e] border border-[#2a2d3e] mb-8 text-sm text-[#64748b]">
              <span>⏱️</span>
              <span>Tiempo estimado: <strong className="text-[#e2e8f0]">~5 minutos</strong></span>
              <span className="mx-2">·</span>
              <span>📝</span>
              <span><strong className="text-[#e2e8f0]">17</strong> ítems</span>
            </div>

            <button onClick={() => setStep('form')} className="btn-primary w-full text-lg py-4">
              Comenzar cuestionario →
            </button>
          </div>
        )}

        {/* ── STEP: FORM ── */}
        {step === 'form' && (
          <div className="animate-[fadeIn_0.3s_ease-out]">
            <div className="mb-8">
              <div className="flex justify-between text-xs text-[#64748b] mb-2">
                <span>Progreso</span>
                <span>{17 - respuestasPendientes} de 17</span>
              </div>
              <div className="w-full h-2 bg-[#2a2d3e] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 progress-fill"
                  style={{ width: `${((17 - respuestasPendientes) / 17) * 100}%`, background: 'linear-gradient(90deg, #6c63ff, #00d4aa)' }}
                />
              </div>
            </div>

            <div className="space-y-4">
              {ITEMS.map((texto, idx) => {
                const itemNum = idx + 1
                const sub = SUBESCALAS[getSubescalaItem(itemNum)]
                const respondido = respuestas[itemNum] !== undefined
                const esInverso = ITEMS_INVERSOS.has(itemNum)

                return (
                  <div
                    key={itemNum}
                    id={`item-${itemNum}`}
                    className={`card transition-all duration-200 ${respondido ? 'opacity-90' : ''} ${showError && !respondido ? 'border-red-500/50 bg-red-500/5' : ''}`}
                    style={respondido ? { borderColor: `${sub.color}44` } : {}}
                  >
                    {/* Header del ítem */}
                    <div className="flex items-start gap-3 mb-4">
                      <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: sub.colorDim, color: sub.color }}>
                        {itemNum}
                      </span>
                      <div className="flex-1">
                        <p className="text-[#e2e8f0] text-sm leading-relaxed">{texto}</p>
                        {esInverso && (
                          <span className="text-xs mt-1 inline-block" style={{ color: sub.color }}>↩ ítem inverso</span>
                        )}
                      </div>
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full" style={{ background: sub.colorDim, color: sub.color }}>
                        {sub.label}
                      </span>
                    </div>

                    {/* Likert */}
                    <div className="flex justify-between gap-1 sm:gap-2">
                      {[1, 2, 3, 4, 5].map((valor) => {
                        const isSelected = respuestas[itemNum] === valor
                        return (
                          <button
                            key={valor}
                            onClick={() => handleResponder(itemNum, valor)}
                            className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all duration-150 ${
                              isSelected ? 'scale-105' : 'border-[#2a2d3e] hover:border-[#6c63ff] hover:bg-[#6c63ff]/5'
                            }`}
                            style={isSelected ? {
                              background: sub.colorDim,
                              borderColor: sub.color,
                              boxShadow: `0 0 12px ${sub.color}40`,
                            } : {}}
                          >
                            <span className="text-sm font-bold" style={isSelected ? { color: sub.color } : { color: '#64748b' }}>
                              {valor}
                            </span>
                            <span className="text-[10px] hidden sm:block" style={isSelected ? { color: sub.color } : { color: '#475569' }}>
                              {LIKERT_LABELS[valor - 1]}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Submit */}
            <div className="mt-8 sticky bottom-6">
              {showError && (
                <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center pop-in">
                  ⚠️ Por favor responde todos los ítems antes de continuar. Faltan {respuestasPendientes} pregunta{respuestasPendientes !== 1 ? 's' : ''}.
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="btn-primary w-full text-base py-4 shadow-2xl shadow-[#6c63ff]/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isPending ? 'Guardando en la base de datos...' : 'Ver mis resultados →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: RESULTS ── */}
        {step === 'results' && resultado && (
          <div className="animate-[slideUp_0.4s_ease-out]">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{ background: '#6c63ff22', border: '1px solid #6c63ff44' }}>
                <span className="text-3xl">📊</span>
              </div>
              <h1 className="text-3xl font-bold gradient-text mb-2">Tus Resultados</h1>
              <p className="text-[#64748b] text-sm">Cuestionario de Autorregulación (CAR)</p>
            </div>

            {/* Puntuación total */}
            <div className="card text-center mb-6 glow-primary">
              <p className="text-[#64748b] text-sm mb-1">Puntuación Total CAR</p>
              <div className="text-6xl font-bold gradient-text mb-1">{resultado.total}</div>
              <p className="text-[#64748b] text-sm">de 85 puntos máximos</p>
              <div className="mt-4 w-full h-3 bg-[#2a2d3e] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full progress-fill"
                  style={{ width: `${((resultado.total - 17) / (85 - 17)) * 100}%`, background: 'linear-gradient(90deg, #6c63ff, #00d4aa)' }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#64748b] mt-1">
                <span>Mínimo: 17</span>
                <span>Máximo: 85</span>
              </div>
            </div>

            {/* Subescalas */}
            <div className="space-y-4 mb-8">
              {(Object.entries(SUBESCALAS) as [SubescalaKey, typeof SUBESCALAS[SubescalaKey]][]).map(([key, sub]) => {
                const score = resultado.subescalas[key]
                const interp = getInterpretacion(score, sub.min, sub.max)
                return (
                  <div key={key} className="card" style={{ borderColor: `${sub.color}33` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{sub.icon}</span>
                        <div>
                          <h3 className="font-semibold text-[#e2e8f0] text-sm">{sub.label}</h3>
                          <p className="text-[#64748b] text-xs">{sub.description}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-bold" style={{ color: sub.color }}>{score}</div>
                        <p className="text-[#64748b] text-xs">/{sub.max}</p>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-[#2a2d3e] rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full progress-fill"
                        style={{ width: `${interp.pct}%`, background: sub.color }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: sub.colorDim, color: sub.color }}>
                        {interp.nivel}
                      </span>
                      <span className="text-xs text-[#64748b]">{interp.desc}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Nota interpretativa */}
            <div className="p-4 rounded-xl bg-[#1a1d2e] border border-[#2a2d3e] mb-8 text-xs text-[#64748b]">
              <strong className="text-[#e2e8f0]">Nota:</strong> Puntuaciones más altas indican mayor autorregulación. 
              Para interpretaciones normativas se recomienda comparar con medias de una muestra de referencia. 
              <br/><span className="italic mt-2 inline-block">Cuestionario basado en: Garzón Umerenkova, A., de la Fuente, J., Martínez-Vicente, J., Zapata Sevillano, L., Pichardo M. y García-Berbén, A.B. (2017). Validation of the Spanish Short Self-Regulation Questionnaire (SSSRQ) through Rasch Analysis. Frontiers in Psychology, 8: 276. doi: 10.3389/fpsyg.2017.00276</span>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleReiniciar} className="btn-outline flex-1">
                🔄 Repetir cuestionario
              </button>
              <button onClick={() => router.push('/')} className="btn-primary flex-1">
                ← Volver al inicio
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
