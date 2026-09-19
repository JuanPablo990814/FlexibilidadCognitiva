'use client'

import { useState } from 'react'

export default function StudentSelector({ estudiantes, onSelectAction }: { estudiantes: any[], onSelectAction: (id: string) => void }) {
  const [selectedId, setSelectedId] = useState<string>('')
  const [query, setQuery] = useState('')
  const uniqueStudents = estudiantes.filter((student, index, list) => {
    const key = `${student.nombre_estudiante}|${student.grado_estudiante}|${student.grupo_estudiante}`.trim().toLocaleLowerCase()
    return list.findIndex(candidate => `${candidate.nombre_estudiante}|${candidate.grado_estudiante}|${candidate.grupo_estudiante}`.trim().toLocaleLowerCase() === key) === index
  })
  const filtered = uniqueStudents.filter(est => `${est.nombre_estudiante} ${est.grado_estudiante} ${est.grupo_estudiante}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="site-card animate-[fadeIn_0.6s_ease-out]">
      <h3 className="text-lg font-bold text-[#20232c] mb-2">Seleccionar estudiante</h3>
      <p className="text-sm text-[#657078] mb-5">Elige quién realizará la prueba en este momento. Hay {uniqueStudents.length} estudiantes disponibles.</p>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1 space-y-2">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre, grado o grupo…" className="w-full bg-white border border-black/15 text-[#20232c] text-sm rounded-lg p-3 outline-none focus:border-[#302f4c]" />
        <select 
          className="w-full bg-white border border-black/15 text-[#20232c] text-sm rounded-lg focus:ring-[#302f4c] focus:border-[#302f4c] block p-3 outline-none transition-colors"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="" disabled>-- Selecciona un estudiante --</option>
          {filtered.map((est) => (
            <option key={est.id_consentimiento} value={est.id_consentimiento}>
              {est.nombre_estudiante} ({est.grado_estudiante}-{est.grupo_estudiante})
            </option>
          ))}
        </select>
        {query && filtered.length === 0 && <p className="text-xs text-[#9b3123]">No hay estudiantes que coincidan con la búsqueda.</p>}
        </div>
        
        <button 
          onClick={() => {
            if (selectedId) onSelectAction(selectedId)
          }}
          disabled={!selectedId}
          className="site-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Activar y Continuar
        </button>
      </div>

      <div className="pt-4 border-t border-black/10">
        <a href="/consentimiento" className="text-sm text-[#20232c] hover:underline font-medium flex items-center gap-1">
          + Añadir nuevo estudiante (Consentimiento)
        </a>
      </div>
    </div>
  )
}
