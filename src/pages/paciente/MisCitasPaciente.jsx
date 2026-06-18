import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import ReprogramarModal from '../../components/ReprogramarModal'
import { useAuth } from '../../context/AuthContext'
import {
  getCitasPorPaciente,
  aceptarReprogramacionAgenda, rechazarReprogramacionAgenda,
  cancelarCitaAgenda
} from '../../services/api'
import { liberarListaEspera } from '../../utils/listaEspera'
import { CalendarClock, Check, X, AlertCircle, CheckCircle, Clock, Stethoscope, Hourglass, XCircle } from 'lucide-react'

const REPROGRAMABLES_POR_PACIENTE = ['CONFIRMADA', 'PENDIENTE', 'AGENDADA']
const CANCELABLES_POR_PACIENTE = ['CONFIRMADA', 'PENDIENTE', 'AGENDADA']

const fmt = (iso) => iso ? new Date(iso).toLocaleString('es-CL', {
  weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
}) : '—'

export default function MisCitasPaciente() {
  const { user } = useAuth()
  const [citas, setCitas] = useState([])
  const [modal, setModal] = useState(false)
  const [citaSel, setCitaSel] = useState(null)
  const [msg, setMsg] = useState({ tipo: '', texto: '' })

  const cargar = () => {
    if (user?.id) getCitasPorPaciente(user.id).then(r => setCitas(r.data)).catch(() => {})
  }
  useEffect(() => { cargar() }, [user?.id])

  const flash = (tipo, texto) => {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg({ tipo: '', texto: '' }), 3500)
  }

  const aceptar = async (c) => {
    try {
      await aceptarReprogramacionAgenda(c.id)
      liberarListaEspera(user.id, c.horaMedica?.especialidad).catch(() => {})
      flash('ok', 'Reprogramación aceptada. Tu cita quedó confirmada para la nueva fecha.')
      cargar()
    } catch (err) {
      flash('err', err.response?.data?.message || 'No se pudo aceptar la reprogramación')
    }
  }

  const rechazar = async (c) => {
    if (!confirm('¿Rechazar esta reprogramación? La cita quedará cancelada.')) return
    try {
      await rechazarReprogramacionAgenda(c.id)
      flash('ok', 'Reprogramación rechazada. La cita fue cancelada.')
      cargar()
    } catch (err) {
      flash('err', err.response?.data?.message || 'No se pudo rechazar la reprogramación')
    }
  }

  const abrirReprog = (c) => { setCitaSel(c); setModal(true) }
  const onReprogOk = () => {
    setModal(false)
    flash('ok', 'Tu solicitud de reprogramación fue enviada. Esperando respuesta del médico.')
    cargar()
  }

  const cancelarCita = async (c) => {
    if (!confirm(`¿Cancelar tu cita con Dr(a). ${c.horaMedica?.nombreMedico} del ${new Date(c.horaMedica?.fechaHora).toLocaleString('es-CL')}?`)) return
    try {
      await cancelarCitaAgenda(c.id)
      flash('ok', 'Cita cancelada. La hora quedó liberada.')
      cargar()
    } catch (err) {
      flash('err', err.response?.data?.message || 'No se pudo cancelar la cita')
    }
  }

  const esperandoPaciente = citas.filter(c =>
    c.estado === 'REPROGRAMACION_PENDIENTE' && c.solicitanteReprogramacion === 'MEDICO'
  )
  const esperandoMedico = citas.filter(c =>
    c.estado === 'REPROGRAMACION_PENDIENTE' && c.solicitanteReprogramacion === 'PACIENTE'
  )
  const restantes = citas.filter(c => c.estado !== 'REPROGRAMACION_PENDIENTE')

  const ETIQUETAS = {
    PENDIENTE: 'Pendiente',
    CONFIRMADA: 'Confirmada',
    AGENDADA: 'Agendada',
    REPROGRAMACION_PENDIENTE: 'Reprogramación pendiente',
    CANCELADA: 'Cancelada',
    ATENDIDA: 'Terminada'
  }

  const badge = (v) => {
    const cls = {
      PENDIENTE: 'badge-pendiente',
      CONFIRMADA: 'badge-confirmado',
      AGENDADA: 'badge-activo',
      REPROGRAMACION_PENDIENTE: 'badge-reprogramado',
      CANCELADA: 'badge-cancelado',
      ATENDIDA: 'bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full'
    }
    return <span className={cls[v] || 'badge-pendiente'}>{ETIQUETAS[v] || v}</span>
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'horaMedica', label: 'Médico', render: (v) => v?.nombreMedico || '—' },
    { key: 'horaMedica', label: 'Especialidad', render: (v) => v?.especialidad || '—' },
    { key: 'horaMedica', label: 'Fecha/Hora', render: (v) => v?.fechaHora ? new Date(v.fechaHora).toLocaleString('es-CL') : '—' },
    { key: 'estado', label: 'Estado', render: badge },
    { key: 'observaciones', label: 'Observaciones' },
  ]

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Mis Citas</h1>
        <p className="text-gray-500 text-sm mt-1">{citas.length} citas registradas</p>
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

      {esperandoPaciente.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CalendarClock size={16} className="text-blue-500" />
            Reprogramaciones pendientes de tu confirmación
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {esperandoPaciente.map(c => (
              <div key={c.id} className="card border-l-4 border-blue-400">
                <span className="inline-block text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700 mb-3">
                  ESPERANDO TU RESPUESTA
                </span>
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-start gap-2">
                    <Stethoscope size={15} className="text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">Dr(a). {c.horaMedica?.nombreMedico}</p>
                      <p className="text-xs text-gray-500 capitalize">{c.horaMedica?.especialidad}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock size={15} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase text-gray-500">Nueva fecha propuesta</p>
                      <p className="font-medium text-blue-600 capitalize">{fmt(c.horaMedica?.fechaHora)}</p>
                    </div>
                  </div>
                  {c.motivoReprogramacion && (
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-[10px] uppercase text-gray-500">Motivo</p>
                      <p className="text-xs text-gray-700">{c.motivoReprogramacion}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => aceptar(c)} className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-2 rounded-lg">
                    <Check size={16} /> Aceptar
                  </button>
                  <button onClick={() => rechazar(c)} className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-3 py-2 rounded-lg">
                    <X size={16} /> Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {esperandoMedico.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Hourglass size={16} className="text-amber-500" />
            Tus solicitudes esperando respuesta del médico
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {esperandoMedico.map(c => (
              <div key={c.id} className="card border-l-4 border-amber-400 bg-amber-50">
                <span className="inline-block text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 mb-3">
                  ESPERANDO AL MÉDICO
                </span>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Stethoscope size={15} className="text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">Dr(a). {c.horaMedica?.nombreMedico}</p>
                      <p className="text-xs text-gray-500 capitalize">{c.horaMedica?.especialidad}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock size={15} className="text-gray-400 mt-0.5 shrink-0" />
                    <p className="font-medium text-gray-700 capitalize">Propuesta: {fmt(c.horaMedica?.fechaHora)}</p>
                  </div>
                  {c.motivoReprogramacion && (
                    <p className="text-xs text-gray-600 bg-white rounded p-2">
                      <strong>Motivo:</strong> {c.motivoReprogramacion}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <Table
          columns={columns}
          data={restantes}
          actions={(row) => {
            const puedeReprog = REPROGRAMABLES_POR_PACIENTE.includes(row.estado)
            const puedeCancelar = CANCELABLES_POR_PACIENTE.includes(row.estado)
            if (!puedeReprog && !puedeCancelar) return null
            return (
              <div className="inline-flex items-center gap-3">
                {puedeReprog && (
                  <button onClick={() => abrirReprog(row)} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                    <CalendarClock size={13} /> Reprogramar
                  </button>
                )}
                {puedeCancelar && (
                  <button onClick={() => cancelarCita(row)} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1">
                    <XCircle size={13} /> Cancelar
                  </button>
                )}
              </div>
            )
          }}
        />
      </div>

      <ReprogramarModal
        cita={citaSel}
        isOpen={modal}
        onClose={() => setModal(false)}
        onSuccess={onReprogOk}
        solicitante="PACIENTE"
      />
    </Layout>
  )
}
