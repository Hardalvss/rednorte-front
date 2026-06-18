import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { getSeguimientos } from '../../services/api'
import {
  ClipboardList, CheckCircle, Stethoscope, AlertCircle, Pill,
  Activity, FileText, NotebookPen
} from 'lucide-react'

const ESTADOS = [
  { key: 'EN_ESPERA',      label: 'En espera',      color: 'bg-yellow-500', soft: 'bg-yellow-100 text-yellow-700' },
  { key: 'EN_TRATAMIENTO', label: 'En tratamiento', color: 'bg-blue-500',   soft: 'bg-blue-100 text-blue-700' },
  { key: 'EN_SEGUIMIENTO', label: 'En seguimiento', color: 'bg-indigo-500', soft: 'bg-indigo-100 text-indigo-700' },
  { key: 'ALTA',           label: 'Alta',           color: 'bg-green-500',  soft: 'bg-green-100 text-green-700' },
]

const ESTADO_DERIVADO = { key: 'DERIVADO', label: 'Derivado', color: 'bg-gray-500', soft: 'bg-gray-200 text-gray-700' }

const TIPO_ICON = {
  DIAGNOSTICO: { icon: FileText,    color: 'text-blue-600',   bg: 'bg-blue-100' },
  INDICACION:  { icon: Activity,    color: 'text-purple-600', bg: 'bg-purple-100' },
  MEDICAMENTO: { icon: Pill,        color: 'text-pink-600',   bg: 'bg-pink-100' },
  EVOLUCION:   { icon: Activity,    color: 'text-emerald-600',bg: 'bg-emerald-100' },
  CAMBIO_ESTADO:{icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-100' },
  NOTA:        { icon: NotebookPen, color: 'text-gray-600',   bg: 'bg-gray-100' }
}

const getEstadoIndex = (estado) => ESTADOS.findIndex(e => e.key === estado)

function TimelineCard({ seg }) {
  const derivado = seg.estadoActual === 'DERIVADO'
  const estadoIdx = derivado ? -1 : getEstadoIndex(seg.estadoActual)
  const estadoActual = derivado ? ESTADO_DERIVADO : ESTADOS[estadoIdx]

  return (
    <div className="card mb-6">
      <div className="flex items-start justify-between gap-2 mb-5 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <Stethoscope size={18} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-800 text-base sm:text-lg truncate capitalize">{seg.especialidad}</p>
            <p className="text-xs text-gray-500">
              Inicio: {seg.fechaCreacion ? new Date(seg.fechaCreacion).toLocaleDateString('es-CL') : '—'}
            </p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${estadoActual?.soft || 'bg-gray-100 text-gray-700'}`}>
          {estadoActual?.label || seg.estadoActual}
        </span>
      </div>

      {!derivado ? (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {ESTADOS.map((e, i) => (
              <div key={e.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    i <= estadoIdx ? `${e.color} border-transparent` : 'bg-white border-gray-300'
                  }`}>
                    {i < estadoIdx ? (
                      <CheckCircle size={16} className="text-white" />
                    ) : i === estadoIdx ? (
                      <div className="w-3 h-3 bg-white rounded-full" />
                    ) : (
                      <div className="w-3 h-3 bg-gray-300 rounded-full" />
                    )}
                  </div>
                  <p className={`text-[10px] sm:text-xs font-medium mt-1 text-center ${i <= estadoIdx ? 'text-gray-700' : 'text-gray-400'}`}>
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
      ) : (
        <div className="mb-6 p-3 rounded-lg bg-gray-100 border border-gray-200 flex items-center gap-2 text-sm text-gray-700">
          <AlertCircle size={16} className="text-gray-500 shrink-0" />
          Tu caso fue derivado a otra especialidad o centro de atención.
        </div>
      )}

      {seg.eventos && seg.eventos.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Historial de eventos</p>
          <ol className="relative border-l-2 border-gray-200 ml-3 space-y-4">
            {seg.eventos.map((ev) => {
              const tipo = TIPO_ICON[ev.tipo] || TIPO_ICON.NOTA
              const Icon = tipo.icon
              return (
                <li key={ev.id} className="ml-5">
                  <span className={`absolute -left-3 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${tipo.bg} ring-4 ring-white`}>
                    <Icon size={12} className={tipo.color} />
                  </span>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {ev.tipo && (
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${tipo.bg} ${tipo.color}`}>
                          {ev.tipo.replace('_', ' ')}
                        </span>
                      )}
                      {ev.estadoNuevo && ev.estadoAnterior && ev.estadoNuevo !== ev.estadoAnterior && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {ev.estadoAnterior?.replace('_', ' ')} → {ev.estadoNuevo?.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800">{ev.descripcion}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {ev.registradoPor || '—'} · {ev.fechaEvento ? new Date(ev.fechaEvento).toLocaleString('es-CL') : ''}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
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
          const mios = (r.data || []).filter(s => s.pacienteId == user.id)
          mios.sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0))
          setSeguimientos(mios)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [user])

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Mi Seguimiento Médico</h1>
        <p className="text-gray-500 text-sm mt-1">Proceso y estado de tus atenciones médicas</p>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400">Cargando…</div>
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
