import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const runtime = 'edge'

export default async function MisResultadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Obtener los tests realizados por el usuario ordenados por fecha
  const [ { data: carData }, { data: wcstData } ] = await Promise.all([
    supabase.from('resultados_autorregulacion').select('*').eq('id_usuario', user.id),
    supabase.from('resultados_wcst').select('*').eq('id_usuario', user.id)
  ])

  const resultados = [
    ...(carData || []).map(r => ({ ...r, testType: 'CAR' })),
    ...(wcstData || []).map(r => ({ ...r, testType: 'WCST' }))
  ].sort((a, b) => new Date(b.fecha_evaluacion).getTime() - new Date(a.fecha_evaluacion).getTime())

  return (
    <div className="min-h-screen py-10 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-[slideUp_0.4s_ease-out]">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Mis Resultados</h1>
            <p className="text-[#64748b]">Historial de tus pruebas de Flexibilidad Cognitiva</p>
          </div>
          <Link href="/" className="btn-ghost border border-[#2a2d3e]">
            ← Volver al inicio
          </Link>
        </div>

        {(!resultados || resultados.length === 0) ? (
          <div className="card text-center py-16 animate-[fadeIn_0.5s_ease-out]">
            <div className="text-4xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-[#e2e8f0] mb-2">Aún no hay resultados</h2>
            <p className="text-[#64748b] mb-6">Realiza tu primer test de evaluación para empezar a guardar tu progreso.</p>
            <div className="flex justify-center gap-4">
              <Link href="/car" className="btn-primary inline-flex gap-2">
                Ir al Test CAR →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 animate-[fadeIn_0.5s_ease-out]">
            {resultados.map((res: any, idx: number) => {
              const fecha = new Date(res.fecha_evaluacion).toLocaleDateString('es-CO', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
              })

              // Renderizado de tarjeta CAR
              if (res.testType === 'CAR') {
                const total = res.metas + res.perseverancia + res.toma_decisiones + res.aprendizaje_errores
                return (
                  <div key={res.id_resultado} className="card relative overflow-hidden group hover:border-[#6c63ff]/50 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#6c63ff] to-[#00d4aa]" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                      <div>
                        <div className="text-xs font-semibold text-[#6c63ff] bg-[#6c63ff]/10 px-3 py-1 rounded-full mb-2 inline-block">Prueba {resultados.length - idx}</div>
                        <h3 className="text-lg font-bold text-[#e2e8f0]">Cuestionario de Autorregulación (CAR)</h3>
                        <p className="text-sm text-[#64748b] capitalize">{fecha}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#6c63ff]">{total} <span className="text-sm font-normal text-[#64748b]">/ 85 ptos</span></div>
                        <p className="text-xs text-[#64748b]">Puntaje global</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[#1a1d2e] border border-[#2a2d3e] p-3 rounded-lg text-center">
                        <p className="text-xs text-[#64748b] mb-1">🎯 Metas</p>
                        <p className="font-bold text-[#e2e8f0]">{res.metas}</p>
                      </div>
                      <div className="bg-[#1a1d2e] border border-[#2a2d3e] p-3 rounded-lg text-center">
                        <p className="text-xs text-[#64748b] mb-1">💪 Perseverancia</p>
                        <p className="font-bold text-[#e2e8f0]">{res.perseverancia}</p>
                      </div>
                      <div className="bg-[#1a1d2e] border border-[#2a2d3e] p-3 rounded-lg text-center">
                        <p className="text-xs text-[#64748b] mb-1">⚖️ Decisiones</p>
                        <p className="font-bold text-[#e2e8f0]">{res.toma_decisiones}</p>
                      </div>
                      <div className="bg-[#1a1d2e] border border-[#2a2d3e] p-3 rounded-lg text-center">
                        <p className="text-xs text-[#64748b] mb-1">🔄 Errores</p>
                        <p className="font-bold text-[#e2e8f0]">{res.aprendizaje_errores}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-[#2a2d3e] flex justify-between items-center text-sm">
                      <span className="text-[#64748b]">Estado del perfil pedagógico:</span>
                      <span className={`px-3 py-1 rounded-full font-semibold ${
                        res.estado_general === 'Alto' ? 'bg-[#00d4aa]/10 text-[#00d4aa]' : 
                        res.estado_general === 'Bajo' ? 'bg-[#ef4444]/10 text-[#ef4444]' : 
                        'bg-[#f59e0b]/10 text-[#f59e0b]'
                      }`}>
                        {res.estado_general || 'Medio'}
                      </span>
                    </div>
                  </div>
                )
              }

              // Renderizado de tarjeta WCST
              if (res.testType === 'WCST') {
                const pctEP = res.total_ensayos > 0 ? Math.round((res.errores_perseverativos / res.total_ensayos) * 100) : 0
                return (
                  <div key={res.id_resultado} className="card relative overflow-hidden group hover:border-[#00d4aa]/50 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00d4aa] to-[#6c63ff]" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                      <div>
                        <div className="text-xs font-semibold text-[#00d4aa] bg-[#00d4aa]/10 px-3 py-1 rounded-full mb-2 inline-block">Prueba {resultados.length - idx}</div>
                        <h3 className="text-lg font-bold text-[#e2e8f0]">Test de Wisconsin (WCST)</h3>
                        <p className="text-sm text-[#64748b] capitalize">{fecha}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#00d4aa]">{res.categorias_completadas} <span className="text-sm font-normal text-[#64748b]">/ 6 cat</span></div>
                        <p className="text-xs text-[#64748b]">Categorías exitosas</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[#1a1d2e] border border-[#2a2d3e] p-3 rounded-lg text-center">
                        <p className="text-xs text-[#64748b] mb-1">🎯 Aciertos</p>
                        <p className="font-bold text-[#22c55e]">{res.total_aciertos}</p>
                      </div>
                      <div className="bg-[#1a1d2e] border border-[#2a2d3e] p-3 rounded-lg text-center">
                        <p className="text-xs text-[#64748b] mb-1">❌ Errores</p>
                        <p className="font-bold text-[#ef4444]">{res.total_errores}</p>
                      </div>
                      <div className="bg-[#1a1d2e] border border-[#2a2d3e] p-3 rounded-lg text-center">
                        <p className="text-xs text-[#64748b] mb-1">🔄 E. Persever.</p>
                        <p className="font-bold text-[#f59e0b]">{res.errores_perseverativos}</p>
                      </div>
                      <div className="bg-[#1a1d2e] border border-[#2a2d3e] p-3 rounded-lg text-center">
                        <p className="text-xs text-[#64748b] mb-1">⚠ Caídas racha</p>
                        <p className="font-bold text-[#a855f7]">{res.fallos_al_mantener}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-[#2a2d3e] flex justify-between items-center text-sm">
                      <span className="text-[#64748b]">Flexibilidad Cognitiva (Menos % Perseveración es mejor):</span>
                      <span className={`px-3 py-1 rounded-full font-semibold ${
                        pctEP <= 20 ? 'bg-[#00d4aa]/10 text-[#00d4aa]' : 
                        'bg-[#f59e0b]/10 text-[#f59e0b]'
                      }`}>
                        {pctEP <= 20 ? 'Óptima' : 'Rígida'} ({pctEP}%)
                      </span>
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
