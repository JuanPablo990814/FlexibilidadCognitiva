import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentSelector from '@/components/StudentSelector'
import { setActiveStudentCookie } from './actions'

export const runtime = 'edge'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const ObjectQuery = await supabase
    .from('consentimientos')
    .select('*')
    .eq('id_usuario', user.id)

  const consentimientos = ObjectQuery.data || []

  if (consentimientos.length === 0) {
    redirect('/consentimiento')
  }

  const name = user.user_metadata?.full_name ?? user.email ?? 'Investigador'
  const avatar = user.user_metadata?.avatar_url
  const firstName = name.split(' ')[0]

  // Tools metadata removed in favor of StudentSelector

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at top left, #1a1d2e 0%, #0f1117 50%)' }}>
      {/* Header */}
      <header className="border-b border-[#2a2d3e] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-7 h-7" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="16" r="7" stroke="#6c63ff" strokeWidth="1.5"/>
              <path d="M13 16 Q15 21 20 23 Q25 21 27 16" stroke="#00d4aa" strokeWidth="1.5" fill="none"/>
              <path d="M9 31 Q15 26 20 28 Q25 26 31 31" stroke="#6c63ff" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
            <span className="font-semibold text-[#e2e8f0] text-sm hidden sm:block">Flexibilidad Cognitiva</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-[#64748b]">
              {avatar ? (
                <img src={avatar} alt={name} className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#6c63ff]/20 flex items-center justify-center text-[#6c63ff] text-xs font-bold">
                  {firstName[0]}
                </div>
              )}
              <span className="hidden sm:block">{firstName}</span>
            </div>
            <form action={signOut}>
              <button type="submit" className="btn-ghost text-xs text-[#64748b]">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="mb-12 animate-[fadeIn_0.5s_ease-out]">
          <p className="text-[#64748b] text-sm mb-1">Hola, {firstName} 👋</p>
            <h1 className="text-4xl font-bold gradient-text mb-3">Evaluación disponible</h1>
            <p className="text-[#64748b] max-w-xl">
              Selecciona la herramienta de evaluación para comenzar. Los resultados quedarán registrados al finalizar el test.
            </p>
        </div>

        {/* Selector */}
        <div className="max-w-2xl">
          <StudentSelector estudiantes={consentimientos} onSelectAction={setActiveStudentCookie} />
        </div>

        {/* Dashboards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 animate-[slideUp_0.8s_ease-out]">
          {/* <a href="/mis-resultados" className="group p-5 rounded-2xl border border-[#2a2d3e] bg-[#1a1d2e] hover:bg-[#1e2136] transition-colors shadow-sm cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#6c63ff]/10 flex items-center justify-center text-xl border border-[#6c63ff]/20">📊</div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-[#e2e8f0] group-hover:text-[#6c63ff] transition-colors text-lg">Mis Resultados</h3>
                <p className="text-[#64748b] text-sm">Consulta tu historial y progreso.</p>
              </div>
              <svg className="h-5 w-5 text-[#64748b] group-hover:text-[#6c63ff] transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </a> */}

          <a href="/admin" className="group p-5 rounded-2xl border border-[#2a2d3e] bg-[#1a1d2e] hover:bg-[#1e2136] transition-colors shadow-sm cursor-pointer md:col-span-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#00d4aa]/10 flex items-center justify-center text-xl border border-[#00d4aa]/20">🛡️</div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-[#e2e8f0] group-hover:text-[#00d4aa] transition-colors text-lg">Panel Investigador</h3>
                <p className="text-[#64748b] text-sm">Métricas de todos los estudiantes.</p>
              </div>
              <svg className="h-5 w-5 text-[#64748b] group-hover:text-[#00d4aa] transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </a>
        </div>

        {/* Footer note */}
        <div className="text-center text-[#64748b] text-xs mt-12 space-y-2 border-t border-[#2a2d3e] pt-6">
          <p>Herramientas validadas científicamente · Datos tratados con confidencialidad para fines investigativos</p>
          <p className="max-w-2xl mx-auto opacity-70">
            Basado en: Garzón Umerenkova, A., de la Fuente, J., Martínez-Vicente, J., Zapata Sevillano, L., Pichardo M. y García-Berbén, A.B. (2017). Validation of the Spanish Short Self-Regulation Questionnaire (SSSRQ) through Rasch Analysis. Frontiers in Psychology, 8: 276. doi: 10.3389/fpsyg.2017.00276
          </p>
        </div>
      </main>
    </div>
  )
}
