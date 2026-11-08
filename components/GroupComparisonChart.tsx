import { statistics, Test } from '@/lib/analysis'

type GroupStat = ReturnType<typeof statistics> & { group: string }
const palette = ['#FDDA24', '#F5A6D3', '#82C9F4', '#76D8B3', '#BCA7ED']
const fmt = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 1 })

export default function GroupComparisonChart({ stats, test, metric, label }: { stats: GroupStat[]; test: Test; metric: string; label: string }) {
  const valid = stats.filter(s => s.mean !== null)
  const maximum = metric.endsWith('_pct') ? 100 : metric === 'categorias_completadas' ? 6 : test === 'af5' ? 99 : test === 'conners' ? 30 : Math.max(5, Math.ceil(Math.max(...valid.map(s => s.mean!), 0) / 5) * 5)
  const percent = metric.endsWith('_pct')
  const unit = percent ? '%' : metric === 'tiempo_segundos' ? 's' : ''
  const definition = metric === 'categorias_completadas'
    ? 'En Wisconsin, un criterio es una regla de clasificación que el participante logró completar. Hay un máximo de 6. Este valor no corresponde al grado o al grupo escolar.'
    : percent ? 'Cada barra muestra el promedio de los porcentajes individuales. La escala va de 0 a 100 %.'
      : `Cada barra muestra el promedio de ${label.toLocaleLowerCase()} de los participantes con una evaluación completa.`
  return <figure className="comparison-chart" aria-label={`Promedio de ${label} por grupo escolar`}>
    <figcaption><p className="text-sm font-semibold mb-2">Comparación entre grupos escolares</p><h3 className="text-2xl font-semibold">{label}</h3><p className="site-copy mt-3 max-w-3xl">{definition}</p></figcaption>
    {!valid.length ? <p className="chart-empty">No hay evaluaciones completas con un grupo escolar identificado para comparar este indicador. Consulta las alertas de revisión.</p> : <>
      <div className="chart-axis" aria-hidden="true"><span>0{unit}</span><span>{fmt(maximum / 2)}{unit}</span><span>{fmt(maximum)}{unit}</span></div>
      <div className="space-y-5">{stats.map(s => {
        const index = Math.max(0, Number(s.group.split('.')[1]) - 1) % palette.length
        return <div className="chart-row" key={s.group}><div className="chart-group"><span style={{ background: palette[index] }} aria-hidden="true" />Grupo {s.group}</div><div className="chart-track" aria-hidden="true"><div className="chart-bar" style={{ width: `${(s.mean ?? 0) / maximum * 100}%`, background: palette[index] }} /></div><div className="chart-value">{s.mean === null ? 'Sin datos' : <><strong>{fmt(s.mean)}{unit}</strong><small>{s.n} {s.n === 1 ? 'participante' : 'participantes'}</small></>}</div></div>
      })}</div>
      <p className="site-copy mt-6 text-sm">La barra parte de cero. Una barra más larga representa un promedio mayor; en indicadores de errores esto significa más errores. Los colores identifican grupos, sin indicar niveles de desempeño.</p>
    </>}
  </figure>
}
