import { getListaEspera, asignarListaEspera } from '../services/api'

export async function liberarListaEspera(pacienteId, especialidad) {
  if (!pacienteId || !especialidad) return 0
  try {
    const r = await getListaEspera()
    const candidatas = (r.data || []).filter(l =>
      Number(l.pacienteId) === Number(pacienteId) &&
      l.estado === 'EN_ESPERA' &&
      l.especialidad?.toLowerCase().trim() === especialidad.toLowerCase().trim()
    )
    let liberadas = 0
    for (const l of candidatas) {
      try { await asignarListaEspera(l.id); liberadas++ } catch {}
    }
    return liberadas
  } catch {
    return 0
  }
}
