import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { getListaEspera, agregarListaEspera, asignarListaEspera, cancelarListaEspera } from '../../services/api'

const EMPTY = { pacienteId: '', nombrePaciente: '', rutPaciente: '', especialidad: '', prioridad: 'MEDIA', observaciones: '' }

export default function ListaEsperaAdmin() {
  const [lista, setLista] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [filtroEstado, setFiltroEstado] = useState('')

  const cargar = () => getListaEspera(filtroEstado ? { estado: filtroEstado } : {}).then(r => setLista(r.data))
  useEffect(() => { cargar() }, [filtroEstado])

  const guardar = async (e) => {
    e.preventDefault()
    await agregarListaEspera(form)
    setModal(false); cargar()
  }

  const prioridadBadge = (p) => {
    const cls = { ALTA: 'bg-red-100 text-red-700', MEDIA: 'bg-yellow-100 text-yellow-700', BAJA: 'bg-green-100 text-green-700' }
    return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cls[p]}`}>{p}</span>
  }

  const estadoBadge = (e) => {
    const cls = { PENDIENTE: 'badge-pendiente', ASIGNADO: 'badge-activo', CANCELADO: 'badge-cancelado' }
    return <span className={cls[e] || 'badge-pendiente'}>{e}</span>
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nombrePaciente', label: 'Paciente' },
    { key: 'rutPaciente', label: 'RUT' },
    { key: 'especialidad', label: 'Especialidad' },
    { key: 'prioridad', label: 'Prioridad', render: prioridadBadge },
    { key: 'estado', label: 'Estado', render: estadoBadge },
    { key: 'fechaIngreso', label: 'Ingreso', render: (v) => v ? new Date(v).toLocaleDateString('es-CL') : '—' },
  ]

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lista de Espera</h1>
          <p className="text-gray-500 text-sm mt-1">{lista.length} pacientes</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setModal(true) }} className="btn-primary">+ Agregar</button>
      </div>

      <div className="card mb-4 flex items-center gap-3">
        <label className="label mb-0">Filtrar por estado:</label>
        <select className="input w-40" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="ASIGNADO">Asignado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      <div className="card">
        <Table
          columns={columns}
          data={lista}
          actions={(row) => row.estado === 'PENDIENTE' && (
            <>
              <button onClick={() => asignarListaEspera(row.id).then(cargar)} className="text-green-600 hover:text-green-800 text-sm font-medium mr-2">Asignar</button>
              <button onClick={() => cancelarListaEspera(row.id).then(cargar)} className="text-red-500 hover:text-red-700 text-sm font-medium mr-2">Cancelar</button>
            </>
          )}
        />
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Agregar a Lista de Espera">
        <form onSubmit={guardar} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">ID Paciente</label><input type="number" className="input" value={form.pacienteId} onChange={e => setForm({...form, pacienteId: e.target.value})} required /></div>
            <div><label className="label">RUT</label><input className="input" value={form.rutPaciente} onChange={e => setForm({...form, rutPaciente: e.target.value})} required /></div>
          </div>
          <div><label className="label">Nombre Paciente</label><input className="input" value={form.nombrePaciente} onChange={e => setForm({...form, nombrePaciente: e.target.value})} required /></div>
          <div><label className="label">Especialidad</label><input className="input" value={form.especialidad} onChange={e => setForm({...form, especialidad: e.target.value})} required /></div>
          <div><label className="label">Prioridad</label>
            <select className="input" value={form.prioridad} onChange={e => setForm({...form, prioridad: e.target.value})}>
              <option value="ALTA">ALTA</option><option value="MEDIA">MEDIA</option><option value="BAJA">BAJA</option>
            </select>
          </div>
          <div><label className="label">Observaciones</label><textarea className="input" rows={2} value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Agregar</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
