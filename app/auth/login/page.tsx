'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse at top, #1a1d2e 0%, #0f1117 60%)' }}>
      <div className="w-full max-w-md animate-[slideUp_0.5s_ease-out]">
        {/* Logo / Icono */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #6c63ff22, #00d4aa22)', border: '1px solid #6c63ff44' }}>
            <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="16" r="8" stroke="#6c63ff" strokeWidth="2" />
              <path d="M12 16 Q14 22 20 24 Q26 22 28 16" stroke="#00d4aa" strokeWidth="2" fill="none" />
              <path d="M8 32 Q14 26 20 28 Q26 26 32 32" stroke="#6c63ff" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Flexibilidad Cognitiva</h1>
          <p className="text-[#64748b] text-sm">Plataforma de evaluación neuropsicológica</p>
        </div>

        {/* Card */}
        <div className="card glow-primary">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-[#e2e8f0] mb-1">Bienvenido</h2>
            <p className="text-[#64748b] text-sm">Inicia sesión para acceder a las evaluaciones</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl border border-[#2a2d3e] hover:border-[#6c63ff]/50 hover:bg-[#6c63ff]/5 transition-all duration-200 font-medium text-[#e2e8f0] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin w-5 h-5 text-[#6c63ff]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {loading ? 'Redirigiendo...' : 'Continuar con Google'}
          </button>

          <p className="text-center text-[#64748b] text-xs mt-4">
            Al iniciar sesión, aceptas el tratamiento de tus datos con fines de evaluación académica.
          </p>
        </div>

        <p className="text-center text-[#64748b] text-xs mt-6">
          CAR · WCST — Herramientas de evaluación neuropsicológica
        </p>
      </div>
    </div>
  )
}
