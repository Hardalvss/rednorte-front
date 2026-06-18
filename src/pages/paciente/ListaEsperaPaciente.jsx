import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { getListaEspera } from '../../services/api'
import { Clock as ClockIcon, ShieldAlert } from 'lucide-react'

export default function ListaEsperaPaciente() {
  const { user } = useAuth()
  const [registros, setRegistros] = useState([])

  useEffect(() => {
    getListaEspera().then(r => {
      const mios = (r.data || []).filter(l => l.pacienteId == user?.id)
      setRegistros(mios)
    }).catch(() => {})
  }, [user])

  const prioridadBadge = (p) => {
    const cls = { ALTA: 'bg-red-100 text-red-700', MEDIA: 'bg-yellow-100 text-yellow-700', BAJA: 'bg-green-100 text-green-700' }
    return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cls[p] || 'bg-gray-100 text-gray-700'}`}>{p}</span>
  }

  const estadoBadge = (e) => {
    const cls = { EN_ESPERA: 'badge-pendiente', ASIGNADO: 'badge-activo', CANCELADO: 'badge-cancelado' }
    return <span className={cls[e] || 'badge-pendiente'}>{e?.replace('_', ' ')}</span>
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Mi Lista de Espera</h1>
        <p className="text-gray-500 text-sm mt-1">{registros.length} registros</p>
      </div>

      {registros.length === 0 ? (
        <div className="card text-center py-12">
          <div className="flex justify-center mb-3">
            <ClockIcon size={40} className="text-gray-300" />
          </div>
          <p className="text-gray-500">No estás en ninguna lista de espera actualmente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {registros.map(r => (
            <div key={r.id} className={`card ${r.adultoMayor ? 'border-l-4 border-orange-400' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 text-lg">{r.especialidad}</p>
                    {r.adultoMayor && (
                      <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <ShieldAlert size={10} /> Adulto mayor — prioridad
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Ingresado: {r.fechaIngreso ? new Date(r.fechaIngreso).toLocaleDateString('es-CL') : '—'}
                  </p>
                  {r.observaciones && <p className="text-sm text-gray-600 mt-2">{r.observaciones}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {estadoBadge(r.estado)}
                  {prioridadBadge(r.prioridad)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
