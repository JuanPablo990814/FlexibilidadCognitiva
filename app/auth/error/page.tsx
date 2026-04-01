export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-[#e2e8f0] mb-2">Error de autenticación</h1>
        <p className="text-[#64748b] mb-6">Hubo un problema al iniciar sesión. Por favor intenta de nuevo.</p>
        <a href="/auth/login" className="btn-primary inline-block">
          Volver al inicio
        </a>
      </div>
    </div>
  )
}
