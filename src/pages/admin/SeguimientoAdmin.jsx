import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { getSeguimientos, crearSeguimiento, registrarEvento, actualizarEstadoSeguimiento } from '../../services/api'

const EMPTY = { pacienteId: '', nombrePaciente: '', rutPaciente: '', especialidad: '' }
const ESTADOS = ['EN_ESPERA', 'EN_TRATAMIENTO', 'EN_SEGUIMIENTO', 'ALTA', 'DERIVADO']

export default function SeguimientoAdmin() {
  const [seguimientos, setSeguimientos] = useState([])
  const [modalCrear, setModalCrear] = useState(false)
  const [modalEvento, setModalEvento] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [eventoForm, setEventoForm] = useState({ descripcion: '', registradoPor: '', estadoNuevo: '' })

  const cargar = () => getSeguimientos().then(r => setSeguimientos(r.data))
  useEffect(() => { cargar() }, [])

  const guardar = async (e) => {
    e.preventDefault()
    await crearSeguimiento(form)
    setModalCrear(false); cargar()
  }

  const guardarEvento = async (e) => {
    e.preventDefault()
    await registrarEvento(selected.id, eventoForm)
    setModalEvento(false); cargar()
  }

  const estadoBadge = (e) => {
    const cls = {
      EN_ESPERA: 'badge-pendiente', EN_TRATAMIENTO: 'badge-reprogramado',
      EN_SEGUIMIENTO: 'badge-activo', ALTA: 'bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full',
      DERIVADO: 'badge-cancelado'
    }
    return <span className={cls[e] || 'badge-pendiente'}>{e?.replace('_', ' ')}</span>
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nombrePaciente', label: 'Paciente' },
    { key: 'rutPaciente', label: 'RUT' },
    { key: 'especialidad', label: 'Especialidad' },
    { key: 'estadoActual', label: 'Estado', render: estadoBadge },
    { key: 'fechaCreacion', label: 'Creado', render: (v) => v ? new Date(v).toLocaleDateString('es-CL') : '—' },
  ]

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Seguimiento de Pacientes</h1>
          <p className="text-gray-500 text-sm mt-1">{seguimientos.length} historiales</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setModalCrear(true) }} className="btn-primary">+ Nuevo Seguimiento</button>
      </div>

      <div className="card">
        <Table
          columns={columns}
          data={seguimientos}
          actions={(row) => (
            <button onClick={() => { setSelected(row); setEventoForm({ descripcion: '', registradoPor: '', estadoNuevo: row.estadoActual }); setModalEvento(true) }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-2">
              Registrar Evento
            </button>
          )}
        />
      </div>

      <Modal isOpen={modalCrear} onClose={() => setModalCrear(false)} title="Nuevo Seguimiento">
        <form onSubmit={guardar} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">ID Paciente</label><input type="number" className="input" value={form.pacienteId} onChange={e => setForm({...form, pacienteId: e.target.value})} required /></div>
            <div><label className="label">RUT</label><input className="input" value={form.rutPaciente} onChange={e => setForm({...form, rutPaciente: e.target.value})} required /></div>
          </div>
          <div><label className="label">Nombre Paciente</label><input className="input" value={form.nombrePaciente} onChange={e => setForm({...form, nombrePaciente: e.target.value})} required /></div>
          <div><label className="label">Especialidad</label><input className="input" value={form.especialidad} onChange={e => setForm({...form, especialidad: e.target.value})} required /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalCrear(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Crear</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalEvento} onClose={() => setModalEvento(false)} title={`Registrar Evento — Paciente ${selected?.nombrePaciente}`}>
        <form onSubmit={guardarEvento} className="space-y-3">
          <div><label className="label">Nuevo Estado</label>
            <select className="input" value={eventoForm.estadoNuevo} onChange={e => setEventoForm({...eventoForm, estadoNuevo: e.target.value})}>
              {ESTADOS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div><label className="label">Descripción</label><textarea className="input" rows={3} value={eventoForm.descripcion} onChange={e => setEventoForm({...eventoForm, descripcion: e.target.value})} required /></div>
          <div><label className="label">Registrado por</label><input className="input" value={eventoForm.registradoPor} onChange={e => setEventoForm({...eventoForm, registradoPor: e.target.value})} required /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalEvento(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Guardar Evento</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
