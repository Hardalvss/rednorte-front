import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import {
  getListaEspera, agregarListaEspera, asignarListaEspera, cancelarListaEspera,
  getUsuarios
} from '../../services/api'
import { ShieldAlert } from 'lucide-react'

const EMPTY = { pacienteId: '', nombrePaciente: '', rutPaciente: '', especialidad: '', prioridad: 'MEDIA', observaciones: '', edad: '' }

const calcEdad = (fechaNac) => {
  if (!fechaNac) return null
  const d = new Date(fechaNac)
  if (Number.isNaN(d.getTime())) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - d.getFullYear()
  const m = hoy.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) edad--
  return edad
}

export default function ListaEsperaAdmin() {
  const [lista, setLista] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [filtroEstado, setFiltroEstado] = useState('')

  const cargar = () => getListaEspera(filtroEstado ? { estado: filtroEstado } : {}).then(r => setLista(r.data))
  useEffect(() => { cargar() }, [filtroEstado])
  useEffect(() => {
    getUsuarios().then(r => setPacientes(r.data.filter(u => u.rol === 'PACIENTE'))).catch(() => {})
  }, [])

  const seleccionarPaciente = (id) => {
    const p = pacientes.find(x => String(x.id) === String(id))
    if (!p) { setForm(prev => ({ ...prev, pacienteId: id })); return }
    const edad = p.fechaNacimiento ? calcEdad(p.fechaNacimiento) : null
    setForm(prev => ({
      ...prev,
      pacienteId: id,
      nombrePaciente: `${p.nombre} ${p.apellido || ''}`.trim(),
      rutPaciente: p.rut || '',
      edad: edad ?? '',
      prioridad: edad !== null && edad >= 70 ? 'ALTA' : prev.prioridad
    }))
  }

  const guardar = async (e) => {
    e.preventDefault()
    const payload = { ...form, pacienteId: Number(form.pacienteId), edad: form.edad === '' ? null : Number(form.edad) }
    await agregarListaEspera(payload)
    setModal(false); cargar()
  }

  const prioridadBadge = (p, row) => {
    const cls = { ALTA: 'bg-red-100 text-red-700', MEDIA: 'bg-yellow-100 text-yellow-700', BAJA: 'bg-green-100 text-green-700' }
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cls[p] || 'bg-gray-100 text-gray-700'}`}>{p}</span>
        {row?.adultoMayor && (
          <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
            <ShieldAlert size={10} /> 70+
          </span>
        )}
      </span>
    )
  }

  const estadoBadge = (e) => {
    const cls = { EN_ESPERA: 'badge-pendiente', ASIGNADO: 'badge-activo', CANCELADO: 'badge-cancelado' }
    return <span className={cls[e] || 'badge-pendiente'}>{e?.replace('_', ' ')}</span>
  }

  const nombreCol = (v, row) => (
    <div className="flex items-center gap-2">
      {row?.adultoMayor && (
        <span title="Adulto mayor (70+)" className="w-2 h-2 bg-orange-500 rounded-full shrink-0" />
      )}
      <span>{v}</span>
    </div>
  )

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nombrePaciente', label: 'Paciente', render: nombreCol },
    { key: 'rutPaciente', label: 'RUT' },
    { key: 'especialidad', label: 'Especialidad' },
    { key: 'prioridad', label: 'Prioridad', render: prioridadBadge },
    { key: 'estado', label: 'Estado', render: estadoBadge },
    { key: 'fechaIngreso', label: 'Ingreso', render: (v) => v ? new Date(v).toLocaleDateString('es-CL') : '—' },
  ]

  const adultosMayores = lista.filter(l => l.adultoMayor).length

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Lista de Espera</h1>
          <p className="text-gray-500 text-sm mt-1">
            {lista.length} pacientes {adultosMayores > 0 && <span className="text-orange-600 font-medium">· {adultosMayores} adulto{adultosMayores === 1 ? '' : 's'} mayor{adultosMayores === 1 ? '' : 'es'}</span>}
          </p>
        </div>
        <button onClick={() => { setForm(EMPTY); setModal(true) }} className="btn-primary w-full sm:w-auto">+ Agregar</button>
      </div>

      <div className="card mb-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <label className="label mb-0">Filtrar por estado:</label>
        <select className="input w-full sm:w-40" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos</option>
          <option value="EN_ESPERA">En espera</option>
          <option value="ASIGNADO">Asignado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      <div className="card">
        <Table
          columns={columns}
          data={lista}
          actions={(row) => row.estado === 'EN_ESPERA' && (
            <>
              <button onClick={() => asignarListaEspera(row.id).then(cargar)} className="text-green-600 hover:text-green-800 text-sm font-medium mr-2">Asignar</button>
              <button onClick={() => cancelarListaEspera(row.id).then(cargar)} className="text-red-500 hover:text-red-700 text-sm font-medium mr-2">Cancelar</button>
            </>
          )}
        />
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Agregar a Lista de Espera">
        <form onSubmit={guardar} className="space-y-3">
          <div>
            <label className="label">Paciente</label>
            <select className="input" value={form.pacienteId} onChange={e => seleccionarPaciente(e.target.value)} required>
              <option value="">Seleccionar paciente…</option>
              {pacientes.map(p => {
                const e = p.fechaNacimiento ? calcEdad(p.fechaNacimiento) : null
                return (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.apellido} · {p.rut}{e !== null ? ` · ${e} años${e >= 70 ? ' (Adulto mayor)' : ''}` : ''}
                  </option>
                )
              })}
            </select>
          </div>
          <div><label className="label">Especialidad</label><input className="input" value={form.especialidad} onChange={e => setForm({...form, especialidad: e.target.value})} required /></div>
          <div>
            <label className="label">
              Prioridad
              {form.edad !== '' && form.edad >= 70 && (
                <span className="ml-2 text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">Forzada a ALTA por edad 70+</span>
              )}
            </label>
            <select className="input" value={form.prioridad} onChange={e => setForm({...form, prioridad: e.target.value})} disabled={form.edad !== '' && form.edad >= 70}>
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
