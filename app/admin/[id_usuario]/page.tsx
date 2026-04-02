import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DeleteTestButton from '@/components/DeleteTestButton'

export const runtime = 'edge'

export default async function ExpedientePage({ params }: { params: { id_usuario: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const id_usuario = params.id_usuario

  // Consulta 1: Datos Clínicos y Demográficos
  const { data: expediente, error } = await supabase
    .from('consentimientos')
    .select('*')
    .eq('id_usuario', id_usuario)
    .single()

  // Si no hay expediente, o falla el RLS del admin, retorna error
  if (error || !expediente) {
    return (
      <div className="min-h-screen py-10 px-6 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl text-red-500 mb-4">Expediente inaccesible</h1>
        <p className="text-[#64748b] mb-6">No se encontró el alumno o no tienes permisos de nivel maestro.</p>
        <Link href="/admin" className="btn-primary">Volver al Dashboard</Link>
      </div>
    )
  }

  // Consulta 2: Puntuaciones del CAR
  const [ { data: carData }, { data: wcstData } ] = await Promise.all([
    supabase.from('resultados_autorregulacion').select('*').eq('id_usuario', id_usuario),
    supabase.from('resultados_wcst').select('*').eq('id_usuario', id_usuario)
  ])

  // Combinar y organizar de la misma forma que el historial
  const resultados = [
    ...(carData || []).map(r => ({ ...r, testType: 'CAR' })),
    ...(wcstData || []).map(r => ({ ...r, testType: 'WCST' }))
  ].sort((a, b) => new Date(b.fecha_evaluacion).getTime() - new Date(a.fecha_evaluacion).getTime())

  return (
    <div className="min-h-screen py-10 px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Cabecera y Navegación */}
        <div className="flex items-center justify-between mb-8 animate-[slideUp_0.4s_ease-out]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#6c63ff]/20 text-[#6c63ff] px-2 py-1 rounded text-xs font-bold uppercase border border-[#6c63ff]/40">Expediente Clínico</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{expediente.nombre_estudiante}</h1>
            <p className="text-[#64748b]">Ficha Individual de Resultados</p>
          </div>
          <Link href="/admin" className="btn-ghost border border-[#2a2d3e]">
            ← Volver a General
          </Link>
        </div>

        {/* Sección de Datos Personales */}
        <div className="card mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gradient-to-tr from-[#1a1d2e] to-[#252841] border-[#2a2d3e] animate-[fadeIn_0.5s_ease-out]">
          <div>
            <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Acudiente Legal</p>
            <p className="text-[#e2e8f0] font-semibold">{expediente.nombre_padre}</p>
            <p className="text-xs text-[#64748b]">C.C {expediente.cedula_padre} ({expediente.lugar_expedicion_padre})</p>
          </div>
          <div className="border-l border-[#2a2d3e] pl-6">
            <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Datos del Estudiante</p>
            <p className="text-[#e2e8f0] font-semibold">{expediente.nombre_estudiante}</p>
            <p className="text-xs text-[#64748b]">T.I. {expediente.tarjeta_identidad_estudiante}</p>
          </div>
          <div className="border-l border-[#2a2d3e] pl-6">
            <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Cursos Institucionales</p>
            <div className="flex gap-2 mt-1">
              <span className="px-3 py-1 bg-[#2a2d3e] rounded-md text-xs font-mono text-[#00d4aa]">Grado: {expediente.grado_estudiante}</span>
              <span className="px-3 py-1 bg-[#2a2d3e] rounded-md text-xs font-mono text-[#6c63ff]">Grupo: {expediente.grupo_estudiante}</span>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-[#e2e8f0] mb-6 border-b border-[#2a2d3e] pb-2">Historial de Ejecuciones ({resultados.length})</h2>

        {(!resultados || resultados.length === 0) ? (
          <div className="card text-center py-12 bg-[#1a1d2e]/50 border-dashed">
            <p className="text-[#64748b]">El estudiante aún no registra ninguna prueba salvada.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-[slideUp_0.6s_ease-out]">
            {resultados.map((res: any, idx: number) => {
              const fecha = new Date(res.fecha_evaluacion).toLocaleDateString('es-CO', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
              })

              /* ---------- TARJETA CAR ---------- */
              if (res.testType === 'CAR') {
                const total = res.metas + res.perseverancia + res.toma_decisiones + res.aprendizaje_errores
                return (
                  <div key={res.id_resultado} className="card relative overflow-hidden flex flex-col md:flex-row gap-6 hover:border-[#6c63ff]/40 transition-colors pt-10 md:pt-6">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#6c63ff]" />
                    <DeleteTestButton idResultado={res.id_resultado} testType="CAR" />
                    
                    {/* Metadatos */}
                    <div className="md:w-1/4 border-b md:border-b-0 md:border-r border-[#2a2d3e] pb-4 md:pb-0 md:pr-4 flex flex-col justify-center">
                      <span className="text-[10px] font-bold tracking-widest text-[#6c63ff] uppercase mb-1">Autorregulación</span>
                      <h3 className="text-xl font-bold text-white mb-2">Test CAR</h3>
                      <p className="text-xs text-[#64748b] leading-tight mb-4">{fecha}</p>
                      
                      <div className="mt-auto">
                        <p className="text-xs text-[#64748b] mb-1">Global Score</p>
                        <div className="text-3xl font-bold text-[#6c63ff]">{total}<span className="text-sm font-normal text-[#64748b]">/85</span></div>
                      </div>
                    </div>

                    {/* Desglose de Puntos */}
                    <div className="md:w-3/4 grid grid-cols-2 lg:grid-cols-5 gap-3">
                      <div className="bg-[#1a1d2e] p-3 rounded-xl border border-[#2a2d3e]/50 flex flex-col justify-center">
                        <p className="text-[10px] text-[#64748b] uppercase mb-1">Metas</p>
                        <p className="text-lg font-mono text-white">{res.metas}</p>
                      </div>
                      <div className="bg-[#1a1d2e] p-3 rounded-xl border border-[#2a2d3e]/50 flex flex-col justify-center">
                        <p className="text-[10px] text-[#64748b] uppercase mb-1">Persever.</p>
                        <p className="text-lg font-mono text-white">{res.perseverancia}</p>
                      </div>
                      <div className="bg-[#1a1d2e] p-3 rounded-xl border border-[#2a2d3e]/50 flex flex-col justify-center">
                        <p className="text-[10px] text-[#64748b] uppercase mb-1">T. Decisiones</p>
                        <p className="text-lg font-mono text-white">{res.toma_decisiones}</p>
                      </div>
                      <div className="bg-[#1a1d2e] p-3 rounded-xl border border-[#2a2d3e]/50 flex flex-col justify-center">
                        <p className="text-[10px] text-[#64748b] uppercase mb-1">A. Errores</p>
                        <p className="text-lg font-mono text-white">{res.aprendizaje_errores}</p>
                      </div>

                      {/* Nivel Algoritmo */}
                      <div className={`p-3 rounded-xl border flex flex-col justify-center shadow-inner col-span-2 lg:col-span-1 ${
                        res.estado_general === 'Alto' ? 'bg-[#00d4aa]/10 border-[#00d4aa]/30' : 
                        res.estado_general === 'Bajo' ? 'bg-[#ef4444]/10 border-[#ef4444]/30' : 
                        'bg-[#f59e0b]/10 border-[#f59e0b]/30'
                      }`}>
                        <p className="text-[10px] uppercase mb-1 opacity-70" style={{ color: res.estado_general === 'Alto' ? '#00d4aa' : res.estado_general === 'Bajo' ? '#ef4444' : '#f59e0b' }}>
                          Clasificación Perfil
                        </p>
                        <p className="text-xl font-bold" style={{ color: res.estado_general === 'Alto' ? '#00d4aa' : res.estado_general === 'Bajo' ? '#ef4444' : '#f59e0b' }}>
                          {res.estado_general || 'Medio'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }

              /* ---------- TARJETA WCST ---------- */
              if (res.testType === 'WCST') {
                const ep = res.errores_perseverativos
                const pctEP = res.total_ensayos > 0 ? Math.round((ep / res.total_ensayos) * 100) : 0
                return (
                  <div key={res.id_resultado} className="card relative overflow-hidden flex flex-col md:flex-row gap-6 hover:border-[#00d4aa]/40 transition-colors pt-10 md:pt-6">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00d4aa]" />
                    <DeleteTestButton idResultado={res.id_resultado} testType="WCST" />
                    
                    {/* Metadatos */}
                    <div className="md:w-1/4 border-b md:border-b-0 md:border-r border-[#2a2d3e] pb-4 md:pb-0 md:pr-4 flex flex-col justify-center">
                      <span className="text-[10px] font-bold tracking-widest text-[#00d4aa] uppercase mb-1">Flexibilidad Cognitiva</span>
                      <h3 className="text-xl font-bold text-white mb-2">Test WCST</h3>
                      <p className="text-xs text-[#64748b] leading-tight mb-4">{fecha}</p>
                      
                      <div className="mt-auto">
                        <p className="text-xs text-[#64748b] mb-1">Rendimiento Principal</p>
                        <div className="text-3xl font-bold text-[#00d4aa]">{res.categorias_completadas}<span className="text-sm font-normal text-[#64748b]">/6 cat</span></div>
                      </div>
                    </div>

                    {/* Desglose de Puntos */}
                    <div className="md:w-3/4 grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                      <div className="bg-[#1a1d2e] p-3 rounded-xl border border-[#2a2d3e]/50 text-center">
                        <p className="text-[10px] text-[#64748b] uppercase mb-1">Intentos</p>
                        <p className="text-lg font-mono text-white">{res.total_ensayos}</p>
                      </div>
                      <div className="bg-[#1a1d2e] p-3 rounded-xl border border-[#2a2d3e]/50 text-center">
                        <p className="text-[10px] text-[#64748b] uppercase mb-1 text-[#22c55e]">Aciertos</p>
                        <p className="text-lg font-mono text-white">{res.total_aciertos}</p>
                      </div>
                      <div className="bg-[#1a1d2e] p-3 rounded-xl border border-[#2a2d3e]/50 text-center">
                        <p className="text-[10px] text-[#64748b] uppercase mb-1 text-[#ef4444]">Errores Glob.</p>
                        <p className="text-lg font-mono text-white">{res.total_errores}</p>
                      </div>
                      <div className="bg-[#1a1d2e] p-3 rounded-xl border border-[#2a2d3e]/50 text-center">
                        <p className="text-[10px] text-[#64748b] uppercase mb-1 text-[#a855f7]">Caídas (Actitud)</p>
                        <p className="text-lg font-mono text-white">{res.fallos_al_mantener}</p>
                      </div>
                      
                      {/* Analítica Perseverancia Avanzada */}
                      <div className="bg-[#f59e0b]/10 p-3 rounded-xl border border-[#f59e0b]/20 col-span-2">
                        <p className="text-[10px] text-[#f59e0b] uppercase font-bold mb-1">Métricas de Inflexibilidad</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-[#64748b]">Error Perseverativo</p>
                            <p className="text-2xl font-mono text-white">{ep}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[#64748b]">% Incidencia</p>
                            <p className={`text-xl font-bold ${pctEP > 20 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>{pctEP}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

            })}
          </div>
        )}

      </div>
    </div>
  )
}
