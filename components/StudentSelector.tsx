'use client'

import { useState } from 'react'

export default function StudentSelector({ estudiantes, onSelectAction }: { estudiantes: any[], onSelectAction: (id: string) => void }) {
  const [selectedId, setSelectedId] = useState<string>('')

  return (
    <div className="card p-6 bg-[#1e2136]/50 border-[#2a2d3e]/50 animate-[fadeIn_0.6s_ease-out]">
      <h3 className="text-lg font-bold text-[#e2e8f0] mb-4">Seleccionar Estudiante Activo</h3>
      <p className="text-sm text-[#64748b] mb-4">Elige qué estudiante va a realizar la prueba en este momento.</p>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <select 
          className="flex-1 bg-[#1a1d2e] border border-[#2a2d3e] text-white text-sm rounded-lg focus:ring-[#6c63ff] focus:border-[#6c63ff] block p-3 outline-none transition-colors"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="" disabled>-- Selecciona un estudiante --</option>
          {estudiantes.map((est) => (
            <option key={est.id_consentimiento} value={est.id_consentimiento}>
              {est.nombre_estudiante} ({est.grado_estudiante}-{est.grupo_estudiante})
            </option>
          ))}
        </select>
        
        <button 
          onClick={() => {
            if (selectedId) onSelectAction(selectedId)
          }}
          disabled={!selectedId}
          className="bg-[#00d4aa] text-[#1a1d2e] disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3 px-6 rounded-lg shadow hover:shadow-[#00d4aa]/30 transition-all"
        >
          Activar y Continuar
        </button>
      </div>

      <div className="pt-4 border-t border-[#2a2d3e]">
        <a href="/consentimiento" className="text-sm text-[#6c63ff] hover:text-[#5a52d5] font-medium flex items-center gap-1">
          + Añadir nuevo estudiante (Consentimiento)
        </a>
      </div>
    </div>
  )
}
