import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { getSeguimientos } from '../../services/api'
import { ClipboardList, CheckCircle, Clock, Stethoscope, Circle } from 'lucide-react'

const ESTADOS = [
  { key: 'EN_ESPERA', label: 'Cita Agendada',   desc: 'Tu cita ha sido registrada en el sistema', color: 'bg-yellow-500' },
  { key: 'AGENDADO',  label: 'Confirmado',        desc: 'Cita confirmada por el equipo médico',     color: 'bg-blue-500'   },
  { key: 'ATENDIDO',  label: 'Atendido',           desc: 'Consulta médica completada',               color: 'bg-green-500'  },
]

function getEstadoIndex(estado) {
  return ESTADOS.findIndex(e => e.key === estado)
}

function TimelineCard({ seg }) {
  const estadoIdx = getEstadoIndex(seg.estadoActual)

  return (
    <div className="card mb-6">
      {/* Header especialidad */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Stethoscope size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-lg">{seg.especialidad}</p>
            <p className="text-xs text-gray-500">
              Inicio: {seg.fechaCreacion ? new Date(seg.fechaCreacion).toLocaleDateString('es-CL') : '—'}
            </p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
          seg.estadoActual === 'ATENDIDO'  ? 'bg-green-100 text-green-700' :
          seg.estadoActual === 'AGENDADO'  ? 'bg-blue-100 text-blue-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {ESTADOS[estadoIdx]?.label || seg.estadoActual}
        </span>
      </div>

      {/* Barra de progreso del proceso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {ESTADOS.map((e, i) => (
            <div key={e.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  i <= estadoIdx
                    ? `${e.color} border-transparent`
                    : 'bg-white border-gray-300'
                }`}>
                  {i < estadoIdx ? (
                    <CheckCircle size={16} className="text-white" />
                  ) : i === estadoIdx ? (
                    <div className="w-3 h-3 bg-white rounded-full" />
                  ) : (
                    <div className="w-3 h-3 bg-gray-300 rounded-full" />
                  )}
                </div>
                <p className={`text-xs font-medium mt-1 text-center ${i <= estadoIdx ? 'text-gray-700' : 'text-gray-400'}`}>
                  {e.label}
                </p>
              </div>
              {i < ESTADOS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mb-5 ${i < estadoIdx ? e.color : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Eventos del historial */}
      {seg.eventos && seg.eventos.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Historial de eventos</p>
          <div className="relative">
            <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {seg.eventos.map((ev, i) => (
                <div key={i} className="relative pl-9">
                  <div className="absolute left-2 top-1">
                    <Circle size={10} className="fill-blue-500 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-800">{ev.descripcion}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {ev.registradoPor} — {ev.fechaEvento ? new Date(ev.fechaEvento).toLocaleString('es-CL') : '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SeguimientoPaciente() {
  const { user } = useAuth()
  const [seguimientos, setSeguimientos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      getSeguimientos()
        .then(r => {
          const mios = r.data.filter(s => s.pacienteId === user.id || s.pacienteId == user.id)
          setSeguimientos(mios)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [user])

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mi Seguimiento Médico</h1>
        <p className="text-gray-500 text-sm mt-1">Proceso y estado de tus atenciones médicas</p>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      )}

      {!loading && seguimientos.length === 0 && (
        <div className="card text-center py-14">
          <ClipboardList size={44} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tienes seguimientos activos</p>
          <p className="text-gray-400 text-sm mt-1">Cuando agendes una cita, aparecerá aquí el seguimiento de tu proceso.</p>
        </div>
      )}

      {!loading && seguimientos.map(seg => (
        <TimelineCard key={seg.id} seg={seg} />
      ))}
    </Layout>
  )
}
