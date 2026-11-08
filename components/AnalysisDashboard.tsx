'use client'

import { useMemo, useState } from 'react'
import GroupComparisonChart from './GroupComparisonChart'
import { REVIEW_GROUP } from '@/lib/school-group'
import { AnalysisData, LABELS, METRICS, Observation, statistics, TESTS, Test } from '@/lib/analysis'

const format = (n: number | null) => n === null ? '—' : n.toLocaleString('es-CO', { maximumFractionDigits: 2 })
const date = (value: string) => Number.isNaN(Date.parse(value)) ? 'Sin fecha' : new Date(value).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })

export default function AnalysisDashboard({ data }: { data: AnalysisData }) {
  const [group, setGroup] = useState('todos')
  const [test, setTest] = useState<Test>('wcst')
  const [metric, setMetric] = useState(METRICS.wcst[0][0])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const groups = ['4.1', '4.2', '4.3', '4.4', '4.5']
  const subjects = data.subjects.filter(s => group === 'todos' || s.group === group || (group === REVIEW_GROUP && s.group === REVIEW_GROUP))
  const observations = data.observations.filter(r => group === 'todos' || r.group === group || (group === REVIEW_GROUP && r.group === REVIEW_GROUP))
  const current = observations.filter(r => r.test === test)
  const filtered = current.filter(r => r.subject.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  const pages = Math.max(1, Math.ceil(filtered.length / 25))
  const currentPage = Math.min(page, pages - 1)
  const visible = filtered.slice(currentPage * 25, (currentPage + 1) * 25)
  const displayedGroups = group === 'todos' || group === REVIEW_GROUP ? groups : [group]
  const alerts = data.alerts.filter(a => group === 'todos' || a.group === group || a.subject === 'Sin asignar')
  const complete = subjects.filter(s => TESTS.every(t => observations.some(r => r.subject === s.code && r.test === t))).length
  const metricLabel = METRICS[test].find(([key]) => key === metric)?.[1] ?? ''
  const groupStats = displayedGroups.map(g => ({ group: g, ...statistics(current.filter(r => r.group === g).map(r => r.values[metric])) }))
  const ungrouped = data.subjects.filter(s => !groups.includes(s.group)).length

  function exportCsv() {
    const rows: (string | number | null)[][] = [
      ['Prueba', 'Grupo', 'Sujeto', 'Fecha', 'Indicador', 'Valor', 'Observaciones'],
      ...observations.flatMap(r => METRICS[r.test].map(([key, label]) => [LABELS[r.test], r.group, r.subject, r.date, label, r.values[key], r.notes.join(' ')])),
    ]
    const cell = (value: string | number | null) => {
      const text = String(value ?? '')
      const safe = /^[=+\-@\t\r\n]/.test(text) ? `'${text}` : text
      return `"${safe.replace(/"/g, '""')}"`
    }
    const url = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }))
    const anchor = document.createElement('a')
    anchor.href = url; anchor.download = 'Analisis_anonimo.csv'; anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <section className="max-w-7xl mx-auto px-6 py-10 space-y-8 analysis-dashboard">
    <div className="flex flex-wrap items-end justify-between gap-4"><label className="grid gap-2 font-semibold">Grupo<select aria-label="Grupo" className="analysis-input" value={group} onChange={e => { setGroup(e.target.value); setPage(0) }}><option value="todos">Todos (comparación de cuarto)</option><option value={REVIEW_GROUP}>Por revisar</option>{groups.map(g => <option key={g}>{g}</option>)}</select></label><div className="flex flex-wrap gap-3"><a href="/api/informe-analisis" className="site-button">Descargar informe completo en PDF</a><button className="site-button site-button--light" onClick={exportCsv}>Descargar análisis anónimo (CSV)</button></div></div>
    <p className="site-copy text-sm">Se incluye el intento completo más reciente de cada prueba. Cada participante conserva el mismo código en todas las pruebas de este análisis. Las evaluaciones incompletas o pendientes de calificación se excluyen de las tablas, gráficas y descarga. El PDF incluye a todos los participantes accesibles con esta sesión, conserva los campos sin completar y reúne el análisis cuantitativo y la interpretación; no depende del filtro de esta pantalla.</p>
    <div className="grid sm:grid-cols-3 gap-4" aria-live="polite"><Summary label="Participantes registrados" value={subjects.length} /><Summary label="Evaluaciones completas" value={observations.length} /><Summary label="Con las cinco pruebas" value={complete} /></div>

    {ungrouped > 0 && <p className="group-review-note" role="status">{ungrouped} participantes tienen un grupo por revisar o pertenecen a otros grados. Sus evaluaciones completas aparecen en el resumen general; se excluyen de las comparaciones entre grupos para evitar categorías incorrectas.</p>}<section aria-labelledby="coverage-title"><h2 id="coverage-title" className="text-2xl font-semibold mb-4">Resumen de todos los exámenes</h2><p className="site-copy text-sm mb-4">Cobertura y resultados principales en sus unidades originales. No se calcula una puntuación global entre pruebas.</p><Table caption="Cobertura y resultado principal por examen" headers={['Prueba', 'Evaluados / registrados', 'Cobertura', 'Indicador principal', 'N válido', 'Media']} rows={TESTS.map(t => { const records = observations.filter(r => r.test === t); const [key, label] = METRICS[t][0]; const stats = statistics(records.map(r => r.values[key])); return [LABELS[t], `${records.length} / ${subjects.length}`, subjects.length ? `${format(records.length / subjects.length * 100)} %` : '—', label, stats.n, format(stats.mean)] })} /></section>

    <section aria-labelledby="detail-title"><h2 id="detail-title" className="text-2xl font-semibold mb-4">Explorar resultados por prueba</h2><div className="flex flex-wrap gap-2" role="group" aria-label="Prueba a analizar">{TESTS.map(t => <button key={t} aria-pressed={test === t} onClick={() => { setTest(t); setMetric(METRICS[t][0][0]); setPage(0); setSearch('') }} className={`site-button ${test === t ? '' : 'site-button--light'}`}>{LABELS[t]}</button>)}</div><p className="site-copy mt-4 text-sm">{test === 'wcst' ? 'Porcentajes de aciertos y errores sobre los ensayos; proporción perseverativa sobre el total de errores. Un denominador cero se muestra como dato no calculable.' : test === 'cinco' ? 'Los diseños únicos, repetidos y errores de regla solo se calculan cuando la clasificación de todas las figuras está completa. Diversidad = diseños únicos / diseños totales × 100.' : test === 'af5' ? 'Se conservan las cinco dimensiones almacenadas de AF5, en la escala 0–99 de esta aplicación. No se suman ni se convierten en percentiles.' : test === 'conners' ? 'La aplicación utiliza un cuestionario docente de 10 ítems y un total de 0–30. No almacena subescalas; no se infieren dimensiones ni niveles clínicos.' : 'Se presentan las cuatro subescalas guardadas. Los registros históricos ligados solo a una cuenta se asignan únicamente si tiene un estudiante.'}</p></section>

    <div className="site-card space-y-5"><label className="grid gap-2 font-semibold max-w-md">¿Qué resultado quieres comparar?<select aria-label="¿Qué resultado quieres comparar?" className="analysis-input" value={metric} onChange={e => setMetric(e.target.value)}>{METRICS[test].map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><GroupComparisonChart stats={groupStats} test={test} metric={metric} label={metricLabel} /><details className="chart-details"><summary>Ver tabla de promedios y dispersión</summary><Table caption={`Estadísticos de ${metricLabel} por grupo`} headers={['Grupo', 'N válido', 'Media', 'Mediana', 'DE muestral', 'Mínimo', 'Máximo']} rows={groupStats.map(s => [s.group, s.n, format(s.mean), format(s.median), format(s.sd), format(s.min), format(s.max)])} /></details></div>

    <section><h2 className="text-2xl font-semibold mb-4">Comparación de indicadores entre grupos</h2><Table caption={`${LABELS[test]}: medias y cantidad de valores válidos por indicador`} headers={['Indicador', ...displayedGroups]} rows={METRICS[test].map(([key, label]) => [label, ...displayedGroups.map(g => { const s = statistics(current.filter(r => r.group === g).map(r => r.values[key])); return s.n ? `${format(s.mean)} (n=${s.n})` : 'Sin datos' })])} /></section>

    <section><div className="flex flex-wrap gap-4 items-end justify-between mb-4"><h2 className="text-2xl font-semibold">Resultados individuales · {LABELS[test]}</h2><label className="grid gap-2 text-sm font-semibold">Buscar código de sujeto<input aria-label="Buscar código de sujeto" type="search" className="analysis-input" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} /></label></div><Table caption="Resultados individuales del intento más reciente; — indica valor no disponible" headers={['Sujeto', 'Grupo', 'Fecha', ...METRICS[test].map(([, label]) => label), 'Observaciones']} rows={visible.map(r => [r.subject, r.group, date(r.date), ...METRICS[test].map(([key]) => format(r.values[key])), r.notes.join(' ') || 'Sin alertas'])} /><div className="flex flex-wrap gap-4 items-center justify-end mt-4"><span aria-live="polite">{filtered.length} sujetos · Página {currentPage + 1} de {pages}</span><button className="site-button site-button--light disabled:opacity-40" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Anterior</button><button className="site-button site-button--light disabled:opacity-40" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Siguiente</button></div></section>

    {test === 'wcst' && <section><h2 className="text-2xl font-semibold mb-4">Seguimiento de ensayos y cambios de criterio</h2><p className="site-copy text-sm mb-4">Consulta el criterio activo y la respuesta de cada ensayo. La secuencia permite revisar los cambios de criterio sin asignar un nivel de flexibilidad.</p><details><summary className="cursor-pointer font-semibold min-h-11">Consultar ensayos de los sujetos de esta página</summary>{visible.map(r => <Trials key={r.subject} result={r} />)}</details></section>}

    <section><h2 className="text-2xl font-semibold mb-4">Alertas de revisión ({alerts.length})</h2><p className="site-copy text-sm mb-4">Los posibles duplicados se conservan hasta su revisión. Los registros sin estudiante identificable se excluyen de las medias. Las alertas no constituyen diagnósticos.</p><details className="site-card"><summary className="cursor-pointer font-semibold min-h-11">Consultar alertas del grupo seleccionado</summary><Table caption="Registros que requieren revisión" headers={['Sujeto', 'Grupo', 'Motivo']} rows={alerts.map(a => [a.subject, a.group, a.message])} /></details></section>
    <p className="site-copy text-sm">Lectura de las tablas: N válido cuenta los valores disponibles de cada indicador; DE es la desviación estándar muestral y requiere al menos dos valores. «—» significa ausente o no calculable. Este análisis es descriptivo: la interpretación requiere la versión del instrumento, edad, condiciones de aplicación y baremos correspondientes. No se asignan niveles clínicos ni se realizan pruebas inferenciales automáticas.</p>
  </section>
}

function Summary({ label, value }: { label: string; value: number }) { return <div className="site-card"><p className="site-eyebrow">{label}</p><p className="text-4xl font-semibold mt-3">{value}</p></div> }
function Table({ caption, headers, rows }: { caption: string; headers: string[]; rows: (string | number)[][] }) {
  return <div className="overflow-x-auto rounded-xl border border-[var(--line)]" tabIndex={0} role="region" aria-label={caption}><table className="w-full text-sm text-left"><caption className="sr-only">{caption}</caption><thead className="bg-[var(--mist)]"><tr>{headers.map(h => <th scope="col" className="p-4 whitespace-nowrap" key={h}>{h}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, i) => <tr key={i} className="border-t border-[var(--line)] odd:bg-white even:bg-[var(--paper)]">{row.map((cell, j) => j === 0 ? <th scope="row" key={j} className="p-4 font-semibold whitespace-nowrap">{cell}</th> : <td key={j} className="p-4">{cell}</td>)}</tr>) : <tr><td className="p-6 text-center" colSpan={headers.length}>No hay registros disponibles para esta selección.</td></tr>}</tbody></table></div>
}
function Trials({ result }: { result: Observation }) {
  return <details className="site-card mb-3"><summary className="cursor-pointer font-semibold min-h-11">{result.subject} · {result.trials.length} ensayos</summary>{result.trials.length ? <Table caption={`Ensayos de ${result.subject}`} headers={['Ensayo', 'Criterio', 'Cambio de criterio', 'Respuesta', 'Perseverativo']} rows={result.trials.map((t, i) => [i + 1, t.rule, i > 0 && t.rule !== result.trials[i - 1].rule ? 'Sí' : '—', t.correct === null ? 'Sin dato' : t.correct ? 'Acierto' : 'Error', t.perseverative ? 'Sí' : 'No'])} /> : <p>No se guardó el historial de esta evaluación.</p>}</details>
}
