import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ExportExcelButton from '@/components/ExportExcelButton'
import { interpretarPuntuacion } from '@/lib/normativasWCST'
import { isAdmin } from '@/lib/authUtils'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')
  
  if (!isAdmin(user.email)) {
    redirect('/')
  }

  // Obtener datos
  const { data: estudiantes } = await supabase.from('consentimientos').select('*')
  const { data: resultadosWCST } = await supabase.from('resultados_wcst').select('*').order('fecha_evaluacion', { ascending: false })

  const esAdmin = estudiantes !== null

  // Preparar datos para exportación masiva con detalle de los 64 ensayos
  const dataForExcel = (estudiantes || []).map(est => {
    const res = resultadosWCST?.find(r => r.id_consentimiento === est.id_consentimiento)
    
    // Objeto base con datos generales
    const row: any = {
      Estudiante: est.nombre_estudiante,
      Grado: `${est.grado_estudiante} - ${est.grupo_estudiante}`,
      Categorias: res?.categorias_completadas || 0,
      Total_Aciertos: res?.total_aciertos || 0,
      Errores_Perseverativos: res?.errores_perseverativos || 0,
      Errores_No_Perseverativos: res?.errores_no_perseverativos || 0,
      Fallos_Mantenimiento: res?.fallos_al_mantener || 0,
      Sello_Fecha: res ? new Date(res.fecha_evaluacion).toLocaleString() : 'Pendiente'
    }

    if (res && est.edad_estudiante) {
      const interpCat = interpretarPuntuacion(res.categorias_completadas, est.edad_estudiante, 'categorias')
      const interpErr = interpretarPuntuacion(res.errores_perseverativos, est.edad_estudiante, 'errores_perseverativos')
      
      row['Edad'] = est.edad_estudiante
      row['Interp_Categorías'] = interpCat.interpretacion
      row['Conclusión_Categorías'] = interpCat.conclusion
      row['Explicación_Categorías'] = interpCat.explicacionSimple
      row['Rango_Normal_Categorías'] = interpCat.rangoNormal
      
      row['Interp_Errores'] = interpErr.interpretacion
      row['Conclusión_Errores'] = interpErr.conclusion
      row['Explicación_Errores'] = interpErr.explicacionSimple
      row['Rango_Normal_Errores'] = interpErr.rangoNormal
    }

    // Añadir 64 columnas para los 64 ensayos (E1, E2, ... E64)
    if (res?.historial && Array.isArray(res.historial)) {
      res.historial.forEach((h: any, i: number) => {
        let status = 'Error'
        if (h.correcto) status = 'Acierto'
        if (h.esPersonerativo) status = 'E. Perseverativo'
        
        row[`Ensayo_${i + 1}_Regla_${h.regla}`] = status
      })
    } else if (res) {
       // Si el test se hizo antes de activar el historial, llenar con '-'
       for(let i=1; i<=64; i++) row[`Ensayo_${i}`] = 'Sin historial (Test Antiguo)'
    }

    return row
  })

  return (
    <div className="min-h-screen py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6 animate-[slideUp_0.4s_ease-out]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#00d4aa]/20 text-[#00d4aa] px-2 py-1 rounded text-[10px] font-bold uppercase border border-[#00d4aa]/40">Módulo Administrativo</span>
              <span className="text-[#64748b] text-xs">Análisis de Flexibilidad y Funciones Ejecutivas</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Ranking de Participantes</h1>
            <p className="text-[#64748b] mt-1 text-sm">Control sintonizado de la batería neuropsicológica WCST.</p>
          </div>
          <div className="flex items-center gap-3">
             <ExportExcelButton data={dataForExcel} />
             <Link href="/" className="btn-ghost border border-[#2a2d3e] text-xs px-4">
               Cerrar Panel
             </Link>
          </div>
        </div>

        {!esAdmin ? (
          <div className="card text-center py-20 border-red-500/20 bg-red-500/5">
             <h2 className="text-xl font-bold text-red-400">Acceso Denegado</h2>
          </div>
        ) : (
          <div className="animate-[fadeIn_0.5s_ease-out]">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
               <div className="card bg-[#1a1d2e] border-[#2a2d3e]">
                  <p className="text-[10px] text-[#64748b] uppercase font-bold">Población</p>
                  <p className="text-2xl font-bold text-[#e2e8f0]">{estudiantes?.length}</p>
               </div>
               <div className="card bg-[#1a1d2e] border-[#2a2d3e]">
                  <p className="text-[10px] text-[#00d4aa] uppercase font-bold">Total Pruebas</p>
                  <p className="text-2xl font-bold text-[#e2e8f0]">{resultadosWCST?.length}</p>
               </div>
               <div className="card bg-[#1a1d2e] border-[#2a2d3e]">
                  <p className="text-[10px] text-[#6c63ff] uppercase font-bold">Promedio Categorías</p>
                  <p className="text-2xl font-bold text-[#e2e8f0]">
                    {(resultadosWCST?.reduce((a, b) => a + b.categorias_completadas, 0) || 0) / (resultadosWCST?.length || 1) | 0}
                  </p>
               </div>
               <div className="card bg-[#1a1d2e] border-[#2a2d3e]">
                  <p className="text-[10px] text-[#f59e0b] uppercase font-bold">Incidencia Perseverativa</p>
                  <p className="text-2xl font-bold text-[#e2e8f0]">
                    {Math.round((resultadosWCST?.reduce((a, b) => a + b.errores_perseverativos, 0) || 0) / (resultadosWCST?.reduce((a, b) => a + b.total_ensayos, 0) || 1) * 100)}%
                  </p>
               </div>
            </div>

            {/* Main Analytical Table */}
            <div className="card overflow-hidden !p-0 border-[#2a2d3e] shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#e2e8f0] border-collapse">
                  <thead className="bg-[#1e2136] text-[#64748b] uppercase font-black border-b border-[#2a2d3e]">
                    <tr>
                      <th className="px-6 py-5">Identificación alumno</th>
                      <th className="px-6 py-5 text-center">Progreso de Categorías</th>
                      <th className="px-6 py-5 text-center">Aciertos / Eficacia</th>
                      <th className="px-6 py-5 text-center">Errores Pers.</th>
                      <th className="px-6 py-5 text-center">Clasificación Clin.</th>
                      <th className="px-6 py-5 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2d3e]">
                    {estudiantes?.map((est: any) => {
                      const tests = resultadosWCST?.filter(r => r.id_consentimiento === est.id_consentimiento) || []
                      const res = tests[0]
                      
                      const pctAciertos = res ? Math.round((res.total_aciertos / res.total_ensayos) * 100) : 0
                      const pctEP = res ? Math.round((res.errores_perseverativos / res.total_ensayos) * 100) : 0

                      // Nivel de Flexibilidad Normativo
                      let nivel = 'Sin Pruebas / Sin Edad'
                      let color = 'bg-[#2a2d3e] text-[#64748b]'
                      if (res) {
                        if (est.edad_estudiante) {
                          const interp = interpretarPuntuacion(res.categorias_completadas, est.edad_estudiante, 'categorias')
                          nivel = interp.interpretacion
                          if (nivel === 'Normal') {
                            color = 'bg-[#00d4aa]/10 text-[#00d4aa] border-[#00d4aa]/30'
                          } else if (nivel === 'Límite') {
                            color = 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30'
                          } else {
                            // "Fuera de lo normal"
                            color = 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30'
                          }
                        } else {
                          // Fallback para datos antiguos sin edad
                          if (res.categorias_completadas >= 5 && pctEP <= 15) { nivel = 'Altamente Flexible'; color = 'bg-[#00d4aa]/10 text-[#00d4aa] border-[#00d4aa]/30' }
                          else if (res.categorias_completadas >= 3) { nivel = 'Flexibilidad Promedio'; color = 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30' }
                          else { nivel = 'Inflexibilidad Cognitiva'; color = 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30' }
                        }
                      }

                      return (
                        <tr key={est.id_consentimiento} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white group-hover:text-[#00d4aa] transition-colors uppercase tracking-tight">{est.nombre_estudiante}</div>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[9px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded">GRADO {est.grado_estudiante}</span>
                              <span className="text-[9px] text-[#6c63ff] font-bold">GRUPO {est.grupo_estudiante}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {res ? (
                              <div className="flex flex-col gap-1.5 max-w-[100px] mx-auto">
                                <div className="flex justify-between text-[9px] font-bold">
                                  <span className="text-white">{res.categorias_completadas}/6</span>
                                  <span className="text-[#64748b]">{Math.round(res.categorias_completadas/6*100)}%</span>
                                </div>
                                <div className="h-1 bg-[#2a2d3e] rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-[#6c63ff] to-[#00d4aa]" style={{ width: `${(res.categorias_completadas/6)*100}%` }} />
                                </div>
                              </div>
                            ) : <div className="text-center">-</div>}
                          </td>
                          <td className="px-6 py-4 text-center">
                             {res ? (
                               <div>
                                  <div className="text-[13px] font-black text-white">{res.total_aciertos}</div>
                                  <div className="text-[9px] text-[#6c63ff] font-bold">{pctAciertos}% EFICACIA</div>
                               </div>
                             ) : '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {res ? (
                              <div className={`text-[13px] font-black ${pctEP > 20 ? 'text-red-500' : 'text-amber-500'}`}>
                                {res.errores_perseverativos}
                                <span className="text-[9px] block font-normal text-[#64748b]">{pctEP}% Incidencia</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase border ${color}`}>
                              {nivel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link href={`/admin/${est.id_consentimiento}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#2a2d3e] hover:bg-[#6c63ff] text-white transition-all shadow-md active:scale-95">
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                               </svg>
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
