import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import ReprogramarModal from '../../components/ReprogramarModal'
import SeguimientoModal from '../../components/SeguimientoModal'
import { useAuth } from '../../context/AuthContext'
import { getCitasPorMedico } from '../../services/api'
import { CalendarClock, ClipboardList, CheckCircle, AlertCircle } from 'lucide-react'

const ESTADOS_ACCIONABLES = ['CONFIRMADA', 'PENDIENTE', 'AGENDADA']

export default function MisCitas() {
  const { user } = useAuth()
  const [citas, setCitas] = useState([])
  const [modalReprog, setModalReprog] = useState(false)
  const [modalSeg, setModalSeg] = useState(false)
  const [citaSel, setCitaSel] = useState(null)
  const [pacienteSel, setPacienteSel] = useState(null)
  const [especialidadSel, setEspecialidadSel] = useState(null)
  const [aviso, setAviso] = useState({ tipo: '', texto: '' })

  const cargar = () => {
    if (user?.id) getCitasPorMedico(user.id).then(r => setCitas(r.data)).catch(() => {})
  }
  useEffect(() => { cargar() }, [user?.id])

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

  const flash = (tipo, texto) => {
    setAviso({ tipo, texto })
    setTimeout(() => setAviso({ tipo: '', texto: '' }), 3500)
  }

  const abrirReprog = (c) => { setCitaSel(c); setModalReprog(true) }
  const abrirSeg = (c) => {
    setPacienteSel({ id: c.pacienteId, nombre: c.nombrePaciente, rut: c.rutPaciente })
    setEspecialidadSel(c.horaMedica?.especialidad || null)
    setModalSeg(true)
  }

  const onOkReprog = () => {
    setModalReprog(false)
    flash('ok', 'Solicitud de reprogramación enviada. Esperando respuesta del paciente.')
    cargar()
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nombrePaciente', label: 'Paciente' },
    { key: 'rutPaciente', label: 'RUT' },
    { key: 'horaMedica', label: 'Fecha/Hora', render: (v) => v?.fechaHora ? new Date(v.fechaHora).toLocaleString('es-CL') : '—' },
    { key: 'horaMedica', label: 'Especialidad', render: (v) => v?.especialidad || '—' },
    { key: 'estado', label: 'Estado', render: badge },
    { key: 'observaciones', label: 'Observaciones' },
  ]

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Mis Citas</h1>
        <p className="text-gray-500 text-sm mt-1">{citas.length} citas asignadas</p>
      </div>

      {aviso.texto && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
          aviso.tipo === 'ok' ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {aviso.tipo === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {aviso.texto}
        </div>
      )}

      <div className="card">
        <Table
          columns={columns}
          data={citas}
          actions={(row) => (
            <div className="inline-flex items-center gap-3 flex-wrap">
              <button onClick={() => abrirSeg(row)} className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1">
                <ClipboardList size={13} /> Seguimiento
              </button>
              {ESTADOS_ACCIONABLES.includes(row.estado) && (
                <button onClick={() => abrirReprog(row)} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                  <CalendarClock size={13} /> Reprogramar
                </button>
              )}
            </div>
          )}
        />
      </div>

      <ReprogramarModal cita={citaSel} isOpen={modalReprog} onClose={() => setModalReprog(false)} onSuccess={onOkReprog} />
      <SeguimientoModal
        isOpen={modalSeg}
        onClose={() => setModalSeg(false)}
        paciente={pacienteSel}
        especialidad={especialidadSel}
      />
    </Layout>
  )
}
