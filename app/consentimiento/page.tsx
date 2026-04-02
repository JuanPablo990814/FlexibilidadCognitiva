import { submitConsent, checkConsent } from './actions'
import { redirect } from 'next/navigation'

export const runtime = 'edge'

export default async function ConsentimientoPage() {
  const { hasConsented, user } = await checkConsent()
  
  if (!user) {
    redirect('/auth/login')
  }

  if (hasConsented) {
    redirect('/')
  }

  return (
    <div className="min-h-screen grid place-items-center p-6" style={{ background: 'radial-gradient(ellipse at top left, #1a1d2e 0%, #0f1117 50%)' }}>
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8 animate-[fadeIn_0.5s_ease-out]">
          <div className="w-16 h-16 rounded-full bg-[#6c63ff]/20 flex items-center justify-center mx-auto mb-4 border border-[#6c63ff]/30">
            <svg className="w-8 h-8 text-[#6c63ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#e2e8f0] mb-2">Carta de Consentimiento</h1>
          <p className="text-[#64748b]">Autorización para investigación pedagógica</p>
        </div>

        {/* Form Card */}
        <form action={submitConsent} className="card p-8 animate-[slideUp_0.6s_ease-out] relative overflow-hidden flex flex-col gap-8 shadow-2xl border-[#2a2d3e]">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#6c63ff] opacity-5 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="bg-[#1e2136]/50 p-6 rounded-xl border border-[#2a2d3e]/50 text-[#94a3b8] leading-relaxed text-sm md:text-base text-justify shadow-inner">
            <p className="mb-4 text-center italic text-[#00d4aa]">Lea detenidamente y complete los campos para brindar su autorización.</p>
            <p>
              Yo <input type="text" name="nombre_padre" required placeholder="Nombre del padre/madre" className="input-field inline-block w-64 mx-2 text-[#e2e8f0]" />, 
              padre de familia, con cédula de ciudadanía <input type="text" name="cedula_padre" required placeholder="N° de Cédula" className="input-field inline-block w-40 mx-2 text-[#e2e8f0]" /> 
              de <input type="text" name="lugar_expedicion_padre" required placeholder="Lugar de expedición" className="input-field inline-block w-48 mx-2 text-[#e2e8f0]" />.
            </p>
            
            <p className="mt-4">
              Autorizo a la Maestra <strong>Sonia María Bedoya Marulanda</strong> con cédula de ciudadanía 43.109.401 del municipio de Bello, 
              aspirante a doctorado en Neuro pedagogía de la Universidad Cesuma de México y docente de aula de la Institución Educativa 
              Berrando Arango Macias del municipio de La Estrella, para almacenar datos sobre la flexibilidad cognitiva del estudiante 
              <input type="text" name="nombre_estudiante" required placeholder="Nombre del estudiante" className="input-field inline-block w-64 mx-2 mt-2 text-[#e2e8f0]" /> 
              con tarjeta de identidad <input type="text" name="tarjeta_identidad_estudiante" required placeholder="T.I." className="input-field inline-block w-40 mx-2 mt-2 text-[#e2e8f0]" /> 
              del municipio <input type="text" name="municipio_estudiante" required placeholder="Municipio" className="input-field inline-block w-48 mx-2 mt-2 text-[#e2e8f0]" /> 
              y del grado <input type="text" name="grado_estudiante" required placeholder="Grado ej. 5°" className="input-field inline-block w-32 mx-2 mt-2 text-[#e2e8f0]" /> 
              del grupo <input type="text" name="grupo_estudiante" required placeholder="Grupo ej. A" className="input-field inline-block w-32 mx-2 mt-2 text-[#e2e8f0]" />, 
              con fines pedagógicos para su investigación en neuro pedagogía y para el mejoramiento de la calidad educativa en su país Colombia, departamento de 
              Antioquia y municipio de La Estrella, ubicación de la institución.
            </p>

            <div className="mt-6 p-4 bg-[#6c63ff]/10 rounded-lg border border-[#6c63ff]/20 flex items-center gap-3">
              <input type="checkbox" id="accept" required className="w-5 h-5 rounded border-[#6c63ff] bg-transparent text-[#6c63ff] cursor-pointer" />
              <label htmlFor="accept" className="font-semibold text-white/90 cursor-pointer">Autorizo la administración de datos personales y pedagógicos.</label>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#2a2d3e]">
            <button type="submit" className="px-8 py-3 bg-[#6c63ff] hover:bg-[#5a52d5] text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-[#6c63ff]/30 flex items-center gap-2">
              Firmar Electrónicamente
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
