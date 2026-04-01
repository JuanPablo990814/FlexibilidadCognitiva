import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  const name = user.user_metadata?.full_name ?? user.email ?? 'Investigador'
  const avatar = user.user_metadata?.avatar_url
  const firstName = name.split(' ')[0]

  const tools = [
    {
      id: 'car',
      href: '/car',
      title: 'Cuestionario CAR',
      subtitle: 'Autorregulación Cognitiva',
      description: 'Evaluación de autorregulación a través de 4 dimensiones: Metas, Perseverancia, Toma de decisiones y Aprendizaje de errores.',
      items: '17 ítems · Escala Likert 1–5',
      duration: '~5 min',
      color: '#6c63ff',
      colorDim: '#6c63ff22',
      icon: (
        <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
          <rect x="8" y="12" width="32" height="4" rx="2" fill="#6c63ff" opacity="0.3"/>
          <rect x="8" y="12" width="20" height="4" rx="2" fill="#6c63ff"/>
          <rect x="8" y="20" width="32" height="4" rx="2" fill="#6c63ff" opacity="0.3"/>
          <rect x="8" y="20" width="26" height="4" rx="2" fill="#6c63ff" opacity="0.6"/>
          <rect x="8" y="28" width="32" height="4" rx="2" fill="#6c63ff" opacity="0.3"/>
          <rect x="8" y="28" width="14" height="4" rx="2" fill="#6c63ff" opacity="0.8"/>
          <circle cx="38" cy="36" r="7" fill="#6c63ff"/>
          <path d="M35 36l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      gradient: 'from-[#6c63ff]/20 to-[#6c63ff]/5',
    },
    {
      id: 'wcst',
      href: '/wcst',
      title: 'Test WCST',
      subtitle: 'Clasificación de Tarjetas de Wisconsin',
      description: 'Evaluación de flexibilidad cognitiva y funciones ejecutivas mediante clasificación de tarjetas con reglas cambiantes.',
      items: '64 cartas · Retroalimentación inmediata',
      duration: '~15 min',
      color: '#00d4aa',
      colorDim: '#00d4aa22',
      icon: (
        <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
          <rect x="6" y="16" width="16" height="22" rx="3" fill="#00d4aa" opacity="0.4" transform="rotate(-8 6 16)"/>
          <rect x="16" y="12" width="16" height="22" rx="3" fill="#00d4aa" opacity="0.7" transform="rotate(0 16 12)"/>
          <rect x="26" y="16" width="16" height="22" rx="3" fill="#00d4aa" transform="rotate(8 26 16)"/>
          <circle cx="34" cy="19" r="4" fill="white" opacity="0.9"/>
          <circle cx="34" cy="19" r="2" fill="#00d4aa"/>
        </svg>
      ),
      gradient: 'from-[#00d4aa]/20 to-[#00d4aa]/5',
    },
  ]

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
          <h1 className="text-4xl font-bold gradient-text mb-3">Evaluaciones disponibles</h1>
          <p className="text-[#64748b] max-w-xl">
            Selecciona una herramienta de evaluación para comenzar. Los resultados quedarán registrados al finalizar cada test.
          </p>
        </div>

        {/* Tools grid */}
        <div className="grid md:grid-cols-2 gap-6 animate-[slideUp_0.6s_ease-out]">
          {tools.map((tool) => (
            <a
              key={tool.id}
              href={tool.href}
              className="group card hover:border-opacity-60 transition-all duration-300 hover:scale-[1.02] hover:glow-primary flex flex-col gap-4"
              style={{ borderColor: `${tool.color}33`, '--hover-border': tool.color } as React.CSSProperties}
            >
              {/* Icon + badge */}
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-xl" style={{ background: tool.colorDim }}>
                  {tool.icon}
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: `${tool.color}22`, color: tool.color }}>
                  {tool.duration}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1">
                <p className="text-xs font-medium mb-0.5" style={{ color: tool.color }}>{tool.subtitle}</p>
                <h2 className="text-xl font-bold text-[#e2e8f0] mb-2">{tool.title}</h2>
                <p className="text-[#64748b] text-sm leading-relaxed">{tool.description}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-[#2a2d3e]">
                <span className="text-xs text-[#64748b]">{tool.items}</span>
                <span className="text-sm font-medium flex items-center gap-1 transition-all duration-200 group-hover:gap-2" style={{ color: tool.color }}>
                  Comenzar
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-[#64748b] text-xs mt-12">
          Herramientas validadas científicamente · Datos tratados con confidencialidad
        </p>
      </main>
    </div>
  )
}
