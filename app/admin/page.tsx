import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const runtime = 'edge'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Nota: Si el usuario ve esta página vacía o lanza un error de Row Level Security, 
  // es porque NO se ha corrido el script SQL setup_admin_db.sql que autoriza su email
  // o su correo no es el correo de administador.
  
  // Buscar a los estudiantes en "consentimientos" (ya que ahí están sus nombres reales)
  const { data: estudiantes, error: errorConsent } = await supabase
    .from('consentimientos')
    .select('*')

  // Buscar todos los resultados CAR
  const { data: resultadosCAR, error: errorResult } = await supabase
    .from('resultados_autorregulacion')
    .select('*')
    .order('fecha_evaluacion', { ascending: false })

  // Buscar todos los resultados WCST
  const { data: resultadosWCST, error: errorWcst } = await supabase
    .from('resultados_wcst')
    .select('*')
    .order('fecha_evaluacion', { ascending: false })

  const esAdmin = !errorConsent && !errorResult && !errorWcst && estudiantes !== null

  return (
    <div className="min-h-screen py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 animate-[slideUp_0.4s_ease-out]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#ef4444]/20 text-[#ef4444] px-2 py-1 rounded text-xs font-bold uppercase border border-[#ef4444]/40">Acceso Restringido</span>
              <span className="text-[#64748b] text-sm">Panel de Investigador</span>
            </div>
            <h1 className="text-3xl font-bold gradient-text">Dashboard Analítico</h1>
            <p className="text-[#64748b]">Visualización general de expedientes y pruebas CAR.</p>
          </div>
          <Link href="/" className="btn-ghost border border-[#2a2d3e] mt-4 md:mt-0 self-start md:self-auto">
            ← Volver al inicio
          </Link>
        </div>

        {!esAdmin ? (
          <div className="card text-center py-16 border-red-500/20 bg-red-500/5 animate-[fadeIn_0.5s_ease-out]">
            <div className="text-4xl mb-4">⛔</div>
            <h2 className="text-xl font-semibold text-[#e2e8f0] mb-2">Acceso Denegado</h2>
            <p className="text-[#64748b] mb-4">Tu cuenta actual ({user?.email}) no tiene permisos V.I.P. de investigador.</p>
            <p className="text-xs text-[#64748b] max-w-md mx-auto p-4 bg-[#1a1d2e] rounded-lg border border-[#2a2d3e]">Si eres la Maestra, asegúrate de haber ejecutado el archivo `setup_admin_db.sql` en Supabase con tu correo exacto.</p>
          </div>
        ) : (
          <div className="animate-[fadeIn_0.5s_ease-out]">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="card bg-gradient-to-br from-[#1a1d2e] to-[#6c63ff]/10">
                <p className="text-[#64748b] text-sm font-medium">Total Estudiantes</p>
                <div className="text-4xl font-bold text-[#e2e8f0] mt-2">{estudiantes?.length || 0}</div>
              </div>
              <div className="card bg-gradient-to-br from-[#1a1d2e] to-[#00d4aa]/10">
                <p className="text-[#64748b] text-sm font-medium">Tests Realizados (Global)</p>
                <div className="text-4xl font-bold text-[#e2e8f0] mt-2">{(resultadosCAR?.length || 0) + (resultadosWCST?.length || 0)}</div>
              </div>
              <div className="card bg-gradient-to-br from-[#1a1d2e] to-[#f59e0b]/10">
                <p className="text-[#64748b] text-sm font-medium">Promedio Participación</p>
                <div className="text-4xl font-bold text-[#e2e8f0] mt-2">
                  {estudiantes?.length > 0 ? (((resultadosCAR?.length || 0) + (resultadosWCST?.length || 0)) / estudiantes.length).toFixed(1) : 0} <span className="text-sm font-normal">tests/ud.</span>
                </div>
              </div>
            </div>

            {/* Tabla Analítica */}
            <div className="card overflow-hidden !p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#e2e8f0]">
                  <thead className="bg-[#1e2136] text-[#64748b] uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-6 py-4 rounded-tl-xl text-[#00d4aa]">Familiar / Estudiante</th>
                      <th className="px-6 py-4">Grado y Grupo</th>
                      <th className="px-6 py-4">Último CAR Global</th>
                      <th className="px-6 py-4">Último WCST</th>
                      <th className="px-6 py-4 text-[#6c63ff]">Perfil CAR</th>
                      <th className="px-6 py-4 text-center rounded-tr-xl">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2d3e]">
                    {estudiantes?.map((est: any) => {
                      const testsCAR = resultadosCAR?.filter((r: any) => r.id_usuario === est.id_usuario) || []
                      const testsWCST = resultadosWCST?.filter((r: any) => r.id_usuario === est.id_usuario) || []
                      
                      const ultimoCAR = testsCAR[0]
                      const ultimoWCST = testsWCST[0]
                      
                      const totalUltimoCAR = ultimoCAR ? (ultimoCAR.metas + ultimoCAR.perseverancia + ultimoCAR.toma_decisiones + ultimoCAR.aprendizaje_errores) : '-'
                      
                      let pctEP_WCST = '-'
                      if (ultimoWCST && ultimoWCST.total_ensayos > 0) {
                        pctEP_WCST = Math.round((ultimoWCST.errores_perseverativos / ultimoWCST.total_ensayos) * 100) + '%'
                      }

                      return (
                        <tr key={est.id_consentimiento} className="hover:bg-[#6c63ff]/5 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white group-hover:text-[#00d4aa] transition-colors">{est.nombre_estudiante}</div>
                            <div className="text-xs text-[#64748b]">Acudiente: {est.nombre_padre}</div>
                          </td>
                          <td className="px-6 py-4">
                            Grado {est.grado_estudiante} - {est.grupo_estudiante}
                          </td>
                          <td className="px-6 py-4">
                            {ultimoCAR ? (
                              <span className="font-bold text-[#6c63ff]">{totalUltimoCAR} <span className="text-xs font-normal text-[#64748b]">ptos</span></span>
                            ) : (
                              <span className="text-[#64748b] italic text-xs">Sin presentar</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {ultimoWCST ? (
                              <div>
                                <span className="font-bold text-[#00d4aa]">{ultimoWCST.categorias_completadas} <span className="text-xs font-normal text-[#64748b]">Cat</span></span>
                                <div className="text-xs text-[#f59e0b] mt-0.5">{pctEP_WCST} E.P.</div>
                              </div>
                            ) : (
                              <span className="text-[#64748b] italic text-xs">Sin presentar</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {ultimoCAR ? (
                              <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                ultimoCAR.estado_general === 'Alto' ? 'bg-[#00d4aa]/10 text-[#00d4aa]' : 
                                ultimoCAR.estado_general === 'Bajo' ? 'bg-[#ef4444]/10 text-[#ef4444]' : 
                                'bg-[#f59e0b]/10 text-[#f59e0b]'
                              }`}>
                                {ultimoCAR.estado_general || 'Medio'}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link href={`/admin/${est.id_usuario}`} className="btn-ghost text-xs px-3 py-1 border border-[#2a2d3e] text-[#e2e8f0] hover:text-[#6c63ff] hover:border-[#6c63ff] transition-all">
                              Expediente →
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {(!estudiantes || estudiantes.length === 0) && (
                  <div className="text-center py-8 text-[#64748b]">No hay expedientes firmados aún.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
