'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import WCSTCard, { type Carta, type Color, type Forma } from '@/components/WCSTCard'

// ─────────────────────────────────────────────
// Configuración del WCST
// ─────────────────────────────────────────────

type Regla = 'color' | 'forma' | 'numero'

// 4 cartas estímulo fijas
const ESTIMULOS: Carta[] = [
  { color: 'rojo',     forma: 'triangulo', numero: 1 },
  { color: 'verde',    forma: 'estrella',  numero: 2 },
  { color: 'amarillo', forma: 'cruz',      numero: 3 },
  { color: 'azul',     forma: 'circulo',   numero: 4 },
]

const REGLAS_CICLO: Regla[] = ['color', 'forma', 'numero']
const ACIERTOS_PARA_CATEGORIA = 10
const MAX_CATEGORIAS = 6
const TOTAL_CARTAS = 64

// Generar baraja de 64 cartas
function generarBaraja(): Carta[] {
  const colores: Color[] = ['rojo', 'verde', 'amarillo', 'azul']
  const formas: Forma[] = ['triangulo', 'estrella', 'cruz', 'circulo']
  const numeros = [1, 2, 3, 4] as const

  const todas: Carta[] = []
  // 4x4x4 = 64 combinaciones únicas
  for (const color of colores) {
    for (const forma of formas) {
      for (const numero of numeros) {
        todas.push({ color, forma, numero })
      }
    }
  }
  // Shuffle Fisher-Yates
  for (let i = todas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [todas[i], todas[j]] = [todas[j], todas[i]]
  }
  return todas.slice(0, TOTAL_CARTAS)
}

function matchRegla(carta: Carta, estimulo: Carta, regla: Regla): boolean {
  return carta[regla] === estimulo[regla]
}

// ─────────────────────────────────────────────
// Tipos de estado
// ─────────────────────────────────────────────

interface Ensayo {
  cartaIdx: number
  estimuloElegidoIdx: number
  correcto: boolean
  regla: Regla
  esPersonerativo: boolean
}

interface Metricas {
  totalEnsayos: number
  totalAciertos: number
  totalErrores: number
  categoriasCompletadas: number
  erroresPersonerativos: number
  erroresNoPersonerativos: number
  fallosAlMantener: number
  ensayosHasta1raCategoria: number | null
  historial: Ensayo[]
}

type FeedbackState = 'correct' | 'incorrect' | null
type Step = 'intro' | 'test' | 'done' | 'results'

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function WCSTPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('intro')
  const [baraja, setBaraja] = useState<Carta[]>([])
  const [ensayoActual, setEnsayoActual] = useState(0)
  const [reglaActual, setReglaActual] = useState<Regla>('color')
  const [reglaAnterior, setReglaAnterior] = useState<Regla | null>(null)
  const [aciertosEnRacha, setAciertosEnRacha] = useState(0)
  const [rachaCategoriaActual, setRachaCategoriaActual] = useState(0)
  const [categoriasCompletadas, setCategorias] = useState(0)
  const [metricas, setMetricas] = useState<Metricas>({
    totalEnsayos: 0, totalAciertos: 0, totalErrores: 0,
    categoriasCompletadas: 0, erroresPersonerativos: 0,
    erroresNoPersonerativos: 0, fallosAlMantener: 0,
    ensayosHasta1raCategoria: null, historial: [],
  })
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [feedbackIdx, setFeedbackIdx] = useState<number | null>(null)
  const [bloqueado, setBloqueado] = useState(false)

  // Ref que guarda los valores de juego mutables para que el setTimeout
  // siempre lea los valores más recientes (evita stale closure)
  const juegoRef = useRef({
    aciertosEnRacha: 0,
    rachaCategoriaActual: 0,
    categoriasCompletadas: 0,
    reglaActual: 'color' as Regla,
    reglaAnterior: null as Regla | null,
    ensayoActual: 0,
    totalEnsayos: 0,
  })

  const cartaActual = baraja[ensayoActual]

  const iniciarTest = useCallback(() => {
    const b = generarBaraja()
    juegoRef.current = {
      aciertosEnRacha: 0,
      rachaCategoriaActual: 0,
      categoriasCompletadas: 0,
      reglaActual: 'color',
      reglaAnterior: null,
      ensayoActual: 0,
      totalEnsayos: 0,
    }
    setBaraja(b)
    setEnsayoActual(0)
    setReglaActual('color')
    setReglaAnterior(null)
    setAciertosEnRacha(0)
    setRachaCategoriaActual(0)
    setCategorias(0)
    setMetricas({
      totalEnsayos: 0, totalAciertos: 0, totalErrores: 0,
      categoriasCompletadas: 0, erroresPersonerativos: 0,
      erroresNoPersonerativos: 0, fallosAlMantener: 0,
      ensayosHasta1raCategoria: null, historial: [],
    })
    setFeedback(null)
    setFeedbackIdx(null)
    setBloqueado(false)
    setStep('test')
  }, [])

  const handleEleccion = useCallback((estimuloIdx: number) => {
    if (bloqueado || !cartaActual) return
    setBloqueado(true)

    // Leemos siempre desde el ref para evitar stale closures en el setTimeout
    const j = juegoRef.current
    const estimulo = ESTIMULOS[estimuloIdx]
    const correcto = matchRegla(cartaActual, estimulo, j.reglaActual)

    // Detectar error perseverativo (responde según regla anterior)
    let esPersonerativo = false
    if (!correcto && j.reglaAnterior) {
      esPersonerativo = matchRegla(cartaActual, estimulo, j.reglaAnterior)
    }

    setFeedback(correcto ? 'correct' : 'incorrect')
    setFeedbackIdx(estimuloIdx)

    // ── Calcular nuevos valores de racha/categoría en base al ref ──
    let nuevaRacha = correcto ? j.aciertosEnRacha + 1 : 0
    let nuevaRachaCat = correcto ? j.rachaCategoriaActual + 1 : j.rachaCategoriaActual
    let nuevasCategorias = j.categoriasCompletadas
    let nuevaRegla = j.reglaActual
    let nuevaReglaAnterior = j.reglaAnterior
    let falloMantenimiento = false

    if (correcto) {
      if (nuevaRacha === ACIERTOS_PARA_CATEGORIA) {
        nuevasCategorias = j.categoriasCompletadas + 1
        const sigReglaIdx = REGLAS_CICLO.indexOf(j.reglaActual) + 1
        nuevaReglaAnterior = j.reglaActual
        nuevaRegla = REGLAS_CICLO[sigReglaIdx % REGLAS_CICLO.length]
        nuevaRacha = 0
        nuevaRachaCat = 0
      }
    } else {
      if (j.rachaCategoriaActual >= 5) falloMantenimiento = true
      nuevaRacha = 0
      nuevaRachaCat = 0
    }

    // Actualizar ref inmediatamente (síncrono)
    juegoRef.current = {
      ...j,
      aciertosEnRacha: nuevaRacha,
      rachaCategoriaActual: nuevaRachaCat,
      categoriasCompletadas: nuevasCategorias,
      reglaActual: nuevaRegla,
      reglaAnterior: nuevaReglaAnterior,
      ensayoActual: j.ensayoActual + 1,
      totalEnsayos: j.totalEnsayos + 1,
    }

    // Actualizar todo el estado de React en un solo bloque
    setAciertosEnRacha(nuevaRacha)
    setRachaCategoriaActual(nuevaRachaCat)
    setCategorias(nuevasCategorias)
    setReglaActual(nuevaRegla)
    setReglaAnterior(nuevaReglaAnterior)

    setMetricas(prev => {
      const nuevoHistorial = [...prev.historial, {
        cartaIdx: j.ensayoActual,
        estimuloElegidoIdx: estimuloIdx,
        correcto,
        regla: j.reglaActual,
        esPersonerativo,
      }]
      return {
        ...prev,
        totalEnsayos: prev.totalEnsayos + 1,
        totalAciertos: correcto ? prev.totalAciertos + 1 : prev.totalAciertos,
        totalErrores: !correcto ? prev.totalErrores + 1 : prev.totalErrores,
        erroresPersonerativos: esPersonerativo ? prev.erroresPersonerativos + 1 : prev.erroresPersonerativos,
        erroresNoPersonerativos: (!correcto && !esPersonerativo) ? prev.erroresNoPersonerativos + 1 : prev.erroresNoPersonerativos,
        fallosAlMantener: falloMantenimiento ? prev.fallosAlMantener + 1 : prev.fallosAlMantener,
        categoriasCompletadas: nuevasCategorias,
        ensayosHasta1raCategoria: (nuevasCategorias > j.categoriasCompletadas)
          ? (prev.ensayosHasta1raCategoria ?? prev.totalEnsayos + 1)
          : prev.ensayosHasta1raCategoria,
        historial: nuevoHistorial,
      }
    })

    // El setTimeout lee del ref, nunca del closure → valores siempre frescos
    setTimeout(() => {
      setFeedback(null)
      setFeedbackIdx(null)
      setBloqueado(false)

      const nextEnsayo = juegoRef.current.ensayoActual
      const cats = juegoRef.current.categoriasCompletadas
      if (nextEnsayo >= TOTAL_CARTAS || cats >= MAX_CATEGORIAS) {
        setStep('done')
        setTimeout(() => setStep('results'), 1200)
      } else {
        setEnsayoActual(nextEnsayo)
      }
    }, 900)
  }, [bloqueado, cartaActual])

  const progreso = baraja.length > 0 ? (ensayoActual / TOTAL_CARTAS) * 100 : 0
  const pctAciertos = metricas.totalEnsayos > 0 ? Math.round((metricas.totalAciertos / metricas.totalEnsayos) * 100) : 0
  const pctEP = metricas.totalEnsayos > 0 ? Math.round((metricas.erroresPersonerativos / metricas.totalEnsayos) * 100) : 0

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at top, #1a1d2e 0%, #0f1117 70%)' }}>
      {/* Nav */}
      <nav className="border-b border-[#2a2d3e] px-6 py-4 sticky top-0 bg-[#0f1117]/80 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-[#64748b] hover:text-[#e2e8f0] transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Inicio
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: '#00d4aa22', color: '#00d4aa' }}>
              WCST
            </span>
            <span className="text-[#64748b] text-sm hidden sm:block">Test de Clasificación de Wisconsin</span>
          </div>
          {step === 'test' && (
            <span className="text-xs text-[#64748b]">
              {ensayoActual + 1}/{TOTAL_CARTAS}
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* ── INTRO ── */}
        {step === 'intro' && (
          <div className="max-w-2xl mx-auto animate-[slideUp_0.4s_ease-out]">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
                style={{ background: '#00d4aa22', border: '1px solid #00d4aa44' }}>
                <span className="text-3xl">🃏</span>
              </div>
              <h1 className="text-3xl font-bold mb-2" style={{ background: 'linear-gradient(135deg, #00d4aa, #6c63ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Test de Clasificación de Wisconsin
              </h1>
              <p className="text-[#64748b] text-sm">WCST — Evaluación de flexibilidad cognitiva</p>
            </div>

            <div className="card mb-6">
              <h2 className="font-semibold text-[#e2e8f0] mb-3">¿Cómo funciona?</h2>
              <div className="bg-[#00d4aa]/5 border border-[#00d4aa]/20 rounded-xl p-4 mb-4">
                <p className="text-[#e2e8f0] text-sm leading-relaxed">
                  Verás <strong>4 cartas en la parte superior</strong> y una carta debajo. Tu tarea es 
                  seleccionar <strong>cuál de las 4 cartas de arriba se parece más</strong> a la carta de abajo. 
                  Después de cada elección se te dirá si fue <span className="text-green-400 font-medium">Correcto</span> o <span className="text-red-400 font-medium">Incorrecto</span>.
                </p>
              </div>
              <div className="space-y-2 text-sm text-[#64748b]">
                <div className="flex items-start gap-2">
                  <span className="text-[#00d4aa] mt-0.5">•</span>
                  <p>Existe <strong className="text-[#e2e8f0]">una regla de clasificación</strong> que debes descubrir tú mismo/a a través del feedback.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#00d4aa] mt-0.5">•</span>
                  <p>La regla <strong className="text-[#e2e8f0]">puede cambiar</strong> sin previo aviso — debes adaptarte.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#00d4aa] mt-0.5">•</span>
                  <p>Las cartas pueden clasificarse por <strong className="text-[#e2e8f0]">color, forma o número</strong> de figuras.</p>
                </div>
              </div>
            </div>

            {/* Preview de cartas estímulo */}
            <div className="card mb-6">
              <p className="text-[#64748b] text-xs mb-4 text-center">Las 4 cartas de referencia (siempre visibles)</p>
              <div className="flex justify-center gap-3">
                {ESTIMULOS.map((carta, i) => (
                  <WCSTCard key={i} carta={carta} size="sm" />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1d2e] border border-[#2a2d3e] mb-8 text-sm text-[#64748b]">
              <span>⏱️</span>
              <span>Tiempo estimado: <strong className="text-[#e2e8f0]">~15 min</strong></span>
              <span className="mx-2">·</span>
              <span>🃏</span>
              <span><strong className="text-[#e2e8f0]">{TOTAL_CARTAS}</strong> cartas</span>
            </div>

            <button onClick={iniciarTest} className="w-full py-4 rounded-xl font-semibold text-lg text-white transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6c63ff, #00d4aa)' }}>
              Comenzar test →
            </button>
          </div>
        )}

        {/* ── TEST ── */}
        {step === 'test' && cartaActual && (
          <div className="animate-[fadeIn_0.2s_ease-out]">
            {/* Barra progreso */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-[#64748b] mb-2">
                <span>Ensayo {ensayoActual + 1} de {TOTAL_CARTAS}</span>
                <span>Categorías: {categoriasCompletadas}/{MAX_CATEGORIAS}</span>
              </div>
              <div className="w-full h-2 bg-[#2a2d3e] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progreso}%`, background: 'linear-gradient(90deg, #6c63ff, #00d4aa)' }} />
              </div>
              {/* Aciertos en racha */}
              <div className="mt-2 flex gap-1">
                {Array.from({ length: ACIERTOS_PARA_CATEGORIA }).map((_, i) => (
                  <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-200"
                    style={{ background: i < aciertosEnRacha ? '#00d4aa' : '#2a2d3e' }} />
                ))}
              </div>
              <p className="text-[#64748b] text-xs mt-1 text-right">{aciertosEnRacha}/{ACIERTOS_PARA_CATEGORIA} en racha</p>
            </div>

            {/* Cartas estímulo */}
            <div className="mb-8">
              <p className="text-[#64748b] text-xs text-center mb-3">Selecciona la carta más similar</p>
              <div className="flex justify-center gap-3 sm:gap-4">
                {ESTIMULOS.map((est, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleEleccion(idx)}
                    disabled={bloqueado}
                    className="disabled:cursor-not-allowed"
                  >
                    <WCSTCard
                      carta={est}
                      size="md"
                      selected={feedbackIdx === idx && feedback === null}
                      highlight={feedbackIdx === idx ? feedback ?? undefined : undefined}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback global */}
            {feedback && (
              <div className={`text-center mb-6 text-2xl font-bold pop-in transition-all ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                {feedback === 'correct' ? '✓ Correcto' : '✗ Incorrecto'}
              </div>
            )}

            {/* Carta respuesta */}
            <div>
              <p className="text-[#64748b] text-xs text-center mb-3">Carta a clasificar</p>
              <div className="flex justify-center">
                <WCSTCard carta={cartaActual} size="lg" />
              </div>
            </div>

            {/* Mini stats */}
            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Aciertos', value: metricas.totalAciertos, color: '#22c55e' },
                { label: 'Errores', value: metricas.totalErrores, color: '#ef4444' },
                { label: 'Categorías', value: metricas.categoriasCompletadas, color: '#00d4aa' },
              ].map(stat => (
                <div key={stat.label} className="card py-3">
                  <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs text-[#64748b]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DONE (transición) ── */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-[fadeIn_0.5s_ease-out]">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">Test completado</h2>
            <p className="text-[#64748b]">Calculando resultados...</p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {step === 'results' && (
          <div className="max-w-3xl mx-auto animate-[slideUp_0.4s_ease-out]">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{ background: '#00d4aa22', border: '1px solid #00d4aa44' }}>
                <span className="text-3xl">📊</span>
              </div>
              <h1 className="text-3xl font-bold mb-2" style={{ background: 'linear-gradient(135deg, #00d4aa, #6c63ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Resultados WCST
              </h1>
              <p className="text-[#64748b] text-sm">Test de Clasificación de Tarjetas de Wisconsin</p>
            </div>

            {/* Resumen rápido */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Categorías completadas', value: metricas.categoriasCompletadas, max: MAX_CATEGORIAS, color: '#00d4aa' },
                { label: 'Total de aciertos', value: metricas.totalAciertos, max: TOTAL_CARTAS, color: '#22c55e' },
                { label: '% Respuestas correctas', value: `${pctAciertos}%`, max: null, color: '#6c63ff' },
              ].map(s => (
                <div key={s.label} className="card text-center">
                  <div className="text-3xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                  {s.max && <div className="text-xs text-[#64748b] mb-1">de {s.max}</div>}
                  <div className="text-xs text-[#64748b]">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tabla de métricas */}
            <div className="card mb-6">
              <h2 className="font-semibold text-[#e2e8f0] mb-4">Métricas detalladas</h2>
              <div className="space-y-3">
                {[
                  { label: 'Total de ensayos', value: metricas.totalEnsayos, desc: 'Cartas clasificadas en total' },
                  { label: 'Total de errores', value: metricas.totalErrores, desc: 'Respuestas incorrectas', color: '#ef4444' },
                  { label: 'Errores perseverativos', value: metricas.erroresPersonerativos, desc: 'Errores por mantener regla anterior', color: '#f59e0b' },
                  { label: '% Errores perseverativos', value: `${pctEP}%`, desc: 'Indicador de inflexibilidad cognitiva', color: '#f59e0b' },
                  { label: 'Errores no perseverativos', value: metricas.erroresNoPersonerativos, desc: 'Otros tipos de error', color: '#ef4444' },
                  { label: 'Fallos al mantener actitud', value: metricas.fallosAlMantener, desc: 'Rachas ≥5 aciertos interrumpidas', color: '#a855f7' },
                  { label: 'Ensayos hasta 1ª categoría', value: metricas.ensayosHasta1raCategoria ?? 'N/A', desc: 'Cartas hasta el primer éxito' },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between py-2 border-b border-[#2a2d3e] last:border-0">
                    <div>
                      <p className="text-sm text-[#e2e8f0]">{m.label}</p>
                      <p className="text-xs text-[#64748b]">{m.desc}</p>
                    </div>
                    <span className="text-lg font-bold" style={{ color: m.color ?? '#e2e8f0' }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interpretación */}
            <div className="card mb-8">
              <h2 className="font-semibold text-[#e2e8f0] mb-3">Interpretación orientativa</h2>
              <div className="space-y-2 text-sm">
                {metricas.categoriasCompletadas >= 5 && (
                  <div className="flex items-start gap-2 text-green-400">
                    <span>✓</span>
                    <p><strong>Buena flexibilidad cognitiva:</strong> Se completaron {metricas.categoriasCompletadas} categorías.</p>
                  </div>
                )}
                {metricas.categoriasCompletadas < 4 && (
                  <div className="flex items-start gap-2 text-amber-400">
                    <span>⚠</span>
                    <p><strong>Dificultad en set-shifting:</strong> Menos de 4 categorías completadas.</p>
                  </div>
                )}
                {pctEP > 20 && (
                  <div className="flex items-start gap-2 text-amber-400">
                    <span>⚠</span>
                    <p><strong>Perseveración elevada ({pctEP}%):</strong> Dificultad para abandonar reglas previas.</p>
                  </div>
                )}
                {pctEP <= 20 && metricas.totalEnsayos > 0 && (
                  <div className="flex items-start gap-2 text-green-400">
                    <span>✓</span>
                    <p><strong>Perseveración adecuada ({pctEP}%):</strong> Buena adaptación a reglas cambiantes.</p>
                  </div>
                )}
                {metricas.fallosAlMantener > 2 && (
                  <div className="flex items-start gap-2 text-purple-400">
                    <span>⚠</span>
                    <p><strong>Fallos al mantener actitud ({metricas.fallosAlMantener}):</strong> Dificultad en la consistencia de estrategias.</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#64748b] mt-3 pt-3 border-t border-[#2a2d3e]">
                Interpretación orientativa únicamente. Para diagnóstico clínico consultar a un profesional y comparar con baremos normativos.
              </p>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={iniciarTest} className="btn-outline flex-1">
                🔄 Repetir test
              </button>
              <button onClick={() => router.push('/')} className="flex-1 py-3 px-6 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #6c63ff, #00d4aa)' }}>
                ← Volver al inicio
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
