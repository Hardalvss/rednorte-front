import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import ReprogramarModal from '../../components/ReprogramarModal'
import { useAuth } from '../../context/AuthContext'
import { getCitasPorMedico } from '../../services/api'
import { CalendarClock, Clock, User, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

const fmt = (iso) => iso ? new Date(iso).toLocaleString('es-CL', {
  weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
}) : '—'

const ESTADOS_REPROGRAMABLES = ['CONFIRMADA', 'PENDIENTE', 'AGENDADA']

export default function ReprogramacionMedico() {
  const { user } = useAuth()
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [citaSel, setCitaSel] = useState(null)
  const [msg, setMsg] = useState({ tipo: '', texto: '' })

  const cargar = () => {
    if (!user?.id) return
    setLoading(true)
    getCitasPorMedico(user.id)
      .then(r => setCitas(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [user?.id])

  const flash = (tipo, texto) => {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg({ tipo: '', texto: '' }), 3500)
  }

  const abrirModal = (c) => { setCitaSel(c); setModal(true) }
  const onReprogramOk = () => {
    setModal(false)
    flash('ok', 'Solicitud de reprogramación enviada. El paciente debe confirmar.')
    cargar()
  }

  const reprogramables = citas.filter(c => ESTADOS_REPROGRAMABLES.includes(c.estado))
  const enEspera = citas.filter(c => c.estado === 'REPROGRAMACION_PENDIENTE')

  const badge = (estado) => {
    const cls = {
      PENDIENTE: 'badge-pendiente',
      CONFIRMADA: 'badge-confirmado',
      AGENDADA: 'badge-activo',
      REPROGRAMACION_PENDIENTE: 'badge-reprogramado',
      CANCELADA: 'badge-cancelado'
    }
    return <span className={cls[estado] || 'badge-pendiente'}>{estado.replace('_', ' ')}</span>
  }

  const CardCita = ({ c, accionable }) => (
    <div className={`card ${c.estado === 'REPROGRAMACION_PENDIENTE' ? 'border-l-4 border-blue-400' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <User size={14} className="text-gray-400 shrink-0" />
            <p className="font-medium text-gray-800 truncate">{c.nombrePaciente}</p>
          </div>
          <p className="text-xs text-gray-500 ml-5">{c.rutPaciente}</p>
        </div>
        {badge(c.estado)}
      </div>

      <div className="space-y-1.5 text-sm mb-3">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-gray-400" />
          <span className="text-gray-700 capitalize">{fmt(c.horaMedica?.fechaHora)}</span>
        </div>
        <p className="text-xs text-gray-500 ml-6 capitalize">{c.horaMedica?.especialidad}</p>
        {c.motivoReprogramacion && (
          <div className="bg-blue-50 border border-blue-100 rounded p-2 mt-2">
            <p className="text-[10px] uppercase text-blue-700 font-semibold">Motivo</p>
            <p className="text-xs text-blue-800">{c.motivoReprogramacion}</p>
          </div>
        )}
      </div>

      {accionable && (
        <div className="pt-3 border-t border-gray-100">
          <button onClick={() => abrirModal(c)} className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg">
            <CalendarClock size={15} /> Reprogramar
          </button>
        </div>
      )}
    </div>
  )

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reprogramación de Citas</h1>
          <p className="text-gray-500 text-sm mt-1">Tus citas activas. Selecciona una para proponer un nuevo horario.</p>
        </div>
        <button onClick={cargar} disabled={loading} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {msg.texto && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
          msg.tipo === 'ok' ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg.tipo === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.texto}
        </div>
      )}

      {enEspera.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CalendarClock size={16} className="text-blue-500" />
            Esperando confirmación del paciente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {enEspera.map(c => <CardCita key={c.id} c={c} accionable={false} />)}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Citas activas</h2>
        {reprogramables.length === 0 ? (
          <div className="card text-center py-12">
            <CalendarClock size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No tienes citas activas para reprogramar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reprogramables.map(c => <CardCita key={c.id} c={c} accionable />)}
          </div>
        )}
      </div>

      <ReprogramarModal cita={citaSel} isOpen={modal} onClose={() => setModal(false)} onSuccess={onReprogramOk} />
    </Layout>
  )
}
