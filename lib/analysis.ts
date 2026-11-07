export type DataRow = Record<string, unknown>
export const TESTS = ['wcst', 'cinco', 'af5', 'conners', 'car'] as const
export type Test = typeof TESTS[number]
export const LABELS: Record<Test, string> = { wcst: 'Wisconsin', cinco: 'Cinco Puntos', af5: 'AF5', conners: 'Conners docente', car: 'Autorregulación Cognitiva' }
export const METRICS: Record<Test, [string, string][]> = {
  wcst: [['categorias_completadas', 'Categorías'], ['total_aciertos', 'Aciertos'], ['total_errores', 'Errores'], ['errores_perseverativos', 'Errores perseverativos'], ['errores_no_perseverativos', 'Errores no perseverativos'], ['fallos_al_mantener', 'Fallos de mantenimiento'], ['aciertos_pct', 'Aciertos (%)'], ['errores_pct', 'Errores (%)'], ['perseveracion_pct', 'Perseverativos / errores (%)']],
  cinco: [['figuras_completadas', 'Diseños totales'], ['unicos', 'Diseños únicos'], ['repetidos', 'Repeticiones'], ['infracciones', 'Errores de regla'], ['tiempo_segundos', 'Tiempo (s)'], ['diversidad_pct', 'Diseños únicos (%)']],
  af5: [['academico_laboral', 'Académico laboral'], ['social', 'Social'], ['emocional', 'Emocional'], ['familiar', 'Familiar'], ['fisico', 'Físico']],
  conners: [['total', 'Puntuación total (0–30)']],
  car: [['metas', 'Metas'], ['perseverancia', 'Perseverancia'], ['toma_decisiones', 'Toma de decisiones'], ['aprendizaje_errores', 'Aprendizaje de errores']],
}
export type Trial = { rule: string; correct: boolean | null; perseverative: boolean }
export type Observation = { subject: string; group: string; test: Test; date: string; values: Record<string, number | null>; trials: Trial[]; notes: string[] }
export type AnalysisData = { subjects: { code: string; group: string }[]; observations: Observation[]; alerts: { subject: string; group: string; message: string }[] }
export function numeric(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (typeof value === 'string' && !value.trim()) return null
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}
export function statistics(values: (number | null)[]) {
  const sorted = values.filter((n): n is number => n !== null).sort((a, b) => a - b)
  const n = sorted.length
  if (!n) return { n: 0, mean: null, median: null, sd: null, min: null, max: null }
  const mean = sorted.reduce((sum, value) => sum + value, 0) / n
  return { n, mean, median: (sorted[Math.floor((n - 1) / 2)] + sorted[Math.floor(n / 2)]) / 2, sd: n > 1 ? Math.sqrt(sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1)) : null, min: sorted[0], max: sorted[n - 1] }
}
export function groupOf(student: DataRow) {
  const grade = String(student.grado_estudiante ?? '').trim().replace(/°|º/g, '')
  const group = String(student.grupo_estudiante ?? '').trim().replace(',', '.')
  return group.includes('.') ? group : grade && group ? `${grade}.${group}` : 'Sin grupo'
}
const ratio = (a: number | null, b: number | null) => a !== null && b !== null && b > 0 ? a / b * 100 : null
export function buildAnalysis(students: DataRow[], records: Record<Test, DataRow[]>): AnalysisData {
  const output: AnalysisData = { subjects: [], observations: [], alerts: [] }
  const byId = new Map<string, { code: string; group: string }>()
  const byUser = new Map<string, string[]>()
  const counters = new Map<string, number>()
  const identities = new Map<string, string>()
  for (const student of [...students].sort((a, b) => String(a.id_consentimiento).localeCompare(String(b.id_consentimiento)))) {
    const group = groupOf(student)
    const count = (counters.get(group) ?? 0) + 1
    counters.set(group, count)
    const subject = { code: `${group}-S${String(count).padStart(3, '0')}`, group }
    const id = String(student.id_consentimiento)
    byId.set(id, subject)
    output.subjects.push(subject)
    const userId = String(student.id_usuario)
    byUser.set(userId, [...(byUser.get(userId) ?? []), id])
    const identity = String(student.tarjeta_identidad_estudiante ?? '').trim() || [student.nombre_estudiante, group].map(v => String(v ?? '').trim().toLocaleLowerCase()).join('|')
    if (identities.has(identity)) output.alerts.push({ subject: subject.code, group, message: `Posible ficha duplicada con ${identities.get(identity)}. Verificar antes de interpretar.` })
    identities.set(identity, subject.code)
  }
  for (const test of TESTS) {
    const attempts = new Map<string, DataRow[]>()
    for (const record of records[test]) {
      const complete = test === 'wcst'
        ? typeof record.total_ensayos === 'number' && record.total_ensayos > 0 && Array.isArray(record.historial) && record.historial.length === record.total_ensayos
        : test === 'af5'
          ? record.respuestas != null && Object.keys(record.respuestas as object).length === 30
          : test === 'conners'
            ? record.respuestas != null && Object.keys(record.respuestas as object).length === 10
            : test === 'car'
              ? METRICS.car.every(([key]) => numeric(record[key]) !== null)
              : record.figuras_completadas != null && Array.isArray(record.evaluacion) && record.evaluacion.length === Number(record.figuras_completadas) && record.evaluacion.every(v => ['unico', 'repetido', 'infraccion'].includes(String(v)))
      if (!complete) continue
      let id = String(record.id_consentimiento ?? '')
      if (!id && test === 'car') {
        const candidates = byUser.get(String(record.id_usuario)) ?? []
        if (candidates.length === 1) id = candidates[0]
      }
      const subject = byId.get(id)
      if (!subject) {
        output.alerts.push({ subject: 'Sin asignar', group: 'Sin grupo', message: `${LABELS[test]}: registro sin estudiante identificable; excluido del análisis.` })
        continue
      }
      attempts.set(id, [...(attempts.get(id) ?? []), record])
    }
    for (const [id, rows] of Array.from(attempts.entries())) {
      const subject = byId.get(id)!
      const ordered = [...rows].sort((a, b) => {
        const time = (r: DataRow) => Date.parse(String(r.fecha_evaluacion)) || 0
        return time(b) - time(a) || String(a.id_resultado).localeCompare(String(b.id_resultado))
      })
      const record = ordered[0]
      const notes: string[] = []
      if (rows.length > 1) notes.push(`${rows.length} intentos: se usa el más reciente.`)
      if (!Date.parse(String(record.fecha_evaluacion))) notes.push('Fecha de evaluación ausente o inválida; revisar selección del intento.')
      const values: Record<string, number | null> = Object.fromEntries(METRICS[test].map(([key]) => [key, numeric(record[key])]))
      if (test === 'wcst') {
        const total = numeric(record.total_ensayos)
        values.aciertos_pct = ratio(values.total_aciertos, total)
        values.errores_pct = ratio(values.total_errores, total)
        values.perseveracion_pct = ratio(values.errores_perseverativos, values.total_errores)
        if (total !== null && values.total_aciertos !== null && values.total_errores !== null && total !== values.total_aciertos + values.total_errores) notes.push('Aciertos y errores no coinciden con el total de ensayos.')
        if (values.total_errores !== null && values.errores_perseverativos !== null && values.errores_no_perseverativos !== null && values.total_errores !== values.errores_perseverativos + values.errores_no_perseverativos) notes.push('El desglose de errores no coincide con el total.')
        if (values.categorias_completadas !== null && values.categorias_completadas > 6) { notes.push('Categorías fuera del rango esperado de la aplicación (0–6); se excluye el valor.'); values.categorias_completadas = null }
      }
      if (test === 'cinco') {
        const evaluation = Array.isArray(record.evaluacion) ? record.evaluacion : []
        const complete = values.figuras_completadas !== null && evaluation.length === values.figuras_completadas && evaluation.every(v => ['unico', 'repetido', 'infraccion'].includes(String(v)))
        for (const [key, label] of [['unicos', 'unico'], ['repetidos', 'repetido'], ['infracciones', 'infraccion']]) values[key] = complete ? evaluation.filter(v => v === label).length : null
        values.diversidad_pct = ratio(values.unicos, values.figuras_completadas)
        if (!complete) notes.push('Clasificación de diseños pendiente o incompleta; se omiten sus indicadores derivados.')
      }
      if (test === 'conners' && values.total !== null && values.total > 30) { notes.push('Total de Conners fuera de 0–30; se excluye el valor.'); values.total = null }
      for (const key of Object.keys(values).filter(key => key.endsWith('_pct'))) if (values[key] !== null && values[key]! > 100) { notes.push('Porcentaje fuera de 0–100; se excluye el valor.'); values[key] = null }
      if (test === 'af5') for (const [key] of METRICS.af5) if (values[key] !== null && values[key]! > 99) { notes.push('Dimensión AF5 fuera de 0–99; se excluye el valor.'); values[key] = null }
      if (Object.values(values).some(v => v === null)) notes.push('Hay indicadores ausentes, inválidos o no calculables; no se sustituyen por cero.')
      const trials: Trial[] = test === 'wcst' && Array.isArray(record.historial) ? record.historial.map((entry: DataRow) => ({ rule: String(entry.regla ?? 'Sin criterio'), correct: typeof entry.correcto === 'boolean' ? entry.correcto : null, perseverative: entry.esPersonerativo === true })) : []
      if (test === 'wcst' && trials.length !== numeric(record.total_ensayos)) notes.push('El historial no coincide con el número de ensayos.')
      output.observations.push({ subject: subject.code, group: subject.group, test, date: String(record.fecha_evaluacion ?? ''), values, trials, notes })
      for (const message of notes) output.alerts.push({ subject: subject.code, group: subject.group, message: `${LABELS[test]}: ${message}` })
    }
  }
  return output
}
