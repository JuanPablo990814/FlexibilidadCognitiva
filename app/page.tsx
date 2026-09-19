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
    .order('nombre_estudiante')

  const consentimientos = ObjectQuery.data || []

  if (consentimientos.length === 0) {
    redirect('/consentimiento')
  }

  const name = user.user_metadata?.full_name ?? user.email ?? 'Investigador'
  const avatar = user.user_metadata?.avatar_url
  const firstName = name.split(' ')[0]

  // Tools metadata removed in favor of StudentSelector

  return (
    <div className="site-shell">
      {/* Header */}
      <header className="site-hero px-6 py-5">
        <div className="max-w-5xl mx-auto site-nav">
          <div className="brand-lockup"><span className="brand-dot" />Flexibilidad Cognitiva</div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-[#657078]">
              {avatar ? (
                <img src={avatar} alt={name} className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#20232c] text-xs font-bold">
                  {firstName[0]}
                </div>
              )}
              <span className="hidden sm:block">{firstName}</span>
            </div>
            <form action={signOut}>
              <button type="submit" className="nav-pill bg-white/70 text-xs">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-14">
        {/* Welcome */}
        <div className="mb-12 animate-[fadeIn_0.5s_ease-out]">
          <p className="site-eyebrow mb-3">Hola, {firstName}</p>
            <h1 className="display-title display-title--small mb-5">Evaluación<br />disponible.</h1>
            <p className="site-copy max-w-xl text-lg">
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

          <a href="/admin" className="site-card group cursor-pointer md:col-span-2" style={{ background: '#e5e2f4' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl border border-black/10">🛡️</div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-[#20232c] transition-colors text-lg">Panel Investigador</h3>
                <p className="text-[#657078] text-sm">Métricas de todos los estudiantes.</p>
              </div>
              <span className="site-button">Abrir →</span>
            </div>
          </a>
        </div>

        {/* Footer note */}
        <div className="text-center text-[#657078] text-xs mt-12 space-y-2 border-t border-black/10 pt-6">
          <p>Herramientas validadas científicamente · Datos tratados con confidencialidad para fines investigativos</p>
          <p className="max-w-2xl mx-auto opacity-70">
            Basado en: Garzón Umerenkova, A., de la Fuente, J., Martínez-Vicente, J., Zapata Sevillano, L., Pichardo M. y García-Berbén, A.B. (2017). Validation of the Spanish Short Self-Regulation Questionnaire (SSSRQ) through Rasch Analysis. Frontiers in Psychology, 8: 276. doi: 10.3389/fpsyg.2017.00276
          </p>
        </div>
      </main>
    </div>
  )
}
