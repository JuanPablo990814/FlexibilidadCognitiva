'use client'

import { useState } from 'react'

export default function WcstHistoryTable({ res }: { res: any }) {
  const [show, setShow] = useState(false)

  if (!res.historial || res.historial.length === 0) return null

  return (
    <div className="mt-6">
      <button 
        type="button"
        className="text-[10px] uppercase font-bold text-[#64748b] hover:text-[#00d4aa] mb-2 flex items-center gap-1 transition-colors"
        onClick={() => setShow(!show)}
      >
        {show ? '🔼 Ocultar Bitácora' : '👁️ Ver Bitácora de Decisiones (64 Ensayos)'}
      </button>

      {show && (
        <div className="overflow-hidden rounded-lg border border-[#2a2d3e] animate-[fadeIn_0.3s_ease-out]">
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-[10px] text-left">
              <thead className="bg-[#1a1d2e] text-[#64748b] sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-3 py-2">Ensayo</th>
                  <th className="px-3 py-2">Regla Activa</th>
                  <th className="px-3 py-2">Elección (Carta)</th>
                  <th className="px-3 py-2">Resultado</th>
                  <th className="px-3 py-2 text-center">¿Pers.?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2d3e]">
                {res.historial.map((h: any, i: number) => (
                  <tr key={i} className={`${h.correcto ? 'bg-green-500/5' : 'bg-red-500/5'} hover:bg-white/5 transition-colors`}>
                    <td className="px-3 py-1.5 text-[#64748b]">#{i + 1}</td>
                    <td className="px-3 py-1.5 font-bold uppercase text-[#e2e8f0]">{h.regla}</td>
                    <td className="px-3 py-1.5 text-[#e2e8f0]">Posición {h.estimuloElegidoIdx + 1}</td>
                    <td className={`px-3 py-1.5 font-bold ${h.correcto ? 'text-green-400' : 'text-red-400'}`}>
                      {h.correcto ? '✓ Acierto' : '✗ Error'}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      {h.esPersonerativo ? (
                        <span className="bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-400/40 font-bold">SÍ</span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-[#1a1d2e] p-2 text-center border-t border-[#2a2d3e]">
             <button onClick={() => setShow(false)} className="text-[9px] text-[#64748b] hover:text-white uppercase font-bold">Cerrar Tabla</button>
          </div>
        </div>
      )}
    </div>
  )
}
