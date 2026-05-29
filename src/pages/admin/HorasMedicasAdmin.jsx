import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { getTodasHoras, crearHoraMedica } from '../../services/api'

const EMPTY = { medicoId: '', nombreMedico: '', especialidad: '', fechaHora: '', duracionMinutos: 30 }

export default function HorasMedicasAdmin() {
  const [horas, setHoras] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const cargar = () => getTodasHoras().then(r => setHoras(r.data))
  useEffect(() => { cargar() }, [])

  const guardar = async (e) => {
    e.preventDefault()
    await crearHoraMedica(form)
    setModal(false); cargar()
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nombreMedico', label: 'Médico' },
    { key: 'especialidad', label: 'Especialidad' },
    { key: 'fechaHora', label: 'Fecha/Hora', render: (v) => v ? new Date(v).toLocaleString('es-CL') : '—' },
    { key: 'duracionMinutos', label: 'Duración', render: (v) => `${v} min` },
    { key: 'disponible', label: 'Disponible', render: (v) => v
      ? <span className="badge-activo">Disponible</span>
      : <span className="badge-cancelado">Ocupada</span>
    },
  ]

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Horas Médicas</h1>
          <p className="text-gray-500 text-sm mt-1">{horas.length} horas registradas</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setModal(true) }} className="btn-primary">+ Nueva Hora</button>
      </div>

      <div className="card">
        <Table columns={columns} data={horas} />
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Crear Hora Médica">
        <form onSubmit={guardar} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">ID Médico</label><input type="number" className="input" value={form.medicoId} onChange={e => setForm({...form, medicoId: e.target.value})} required /></div>
            <div><label className="label">Nombre Médico</label><input className="input" value={form.nombreMedico} onChange={e => setForm({...form, nombreMedico: e.target.value})} required /></div>
          </div>
          <div><label className="label">Especialidad</label><input className="input" value={form.especialidad} onChange={e => setForm({...form, especialidad: e.target.value})} required /></div>
          <div><label className="label">Fecha y Hora</label><input type="datetime-local" className="input" value={form.fechaHora} onChange={e => setForm({...form, fechaHora: e.target.value})} required /></div>
          <div><label className="label">Duración (minutos)</label><input type="number" className="input" value={form.duracionMinutos} onChange={e => setForm({...form, duracionMinutos: e.target.value})} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Crear</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
