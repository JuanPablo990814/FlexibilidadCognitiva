import { createClient } from '@/lib/supabase/server'
import { buildAnalysis, DataRow, Test } from '@/lib/analysis'

export async function loadAnalysis(supabase: Awaited<ReturnType<typeof createClient>>) {
  // Supabase limits each response; read every page so group summaries are complete.
  async function all(table: string, key: string) {
    const rows: DataRow[] = []
    for (let start = 0; ;) {
      const { data, error, count } = await supabase.from(table).select('*', { count: 'exact' }).order(key).range(start, start + 999)
      if (error) throw new Error(`No se pudo consultar ${table}. Comprueba la conexión y los permisos de lectura.`)
      rows.push(...(data ?? []))
      if (!data?.length) {
        if (count !== null && start < count) throw new Error(`Lectura incompleta: ${table}`)
        return rows
      }
      start += data.length
      if (count !== null && start >= count) return rows
    }
  }
  const [students, wcst, cinco, af5, conners, car] = await Promise.all([
    all('consentimientos', 'id_consentimiento'), all('resultados_wcst', 'id_resultado'),
    all('resultados_cinco_puntos', 'id_resultado'), all('resultados_af5', 'id_resultado'),
    all('resultados_conners_docente', 'id_resultado'), all('resultados_autorregulacion', 'id_resultado'),
  ])
  const records: Record<Test, DataRow[]> = { wcst, cinco, af5, conners, car }
  return buildAnalysis(students, records)
}
