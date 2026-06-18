import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { getCitasReprogramacion, cancelarCita, reprogramarCita } from '../../services/api'

export default function ReprogramacionAdmin() {
  const [citas, setCitas] = useState([])
  const [modalReprogram, setModalReprogram] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ fechaNueva: '', motivo: '' })

  const cargar = () => getCitasReprogramacion().then(r => setCitas(r.data))
  useEffect(() => { cargar() }, [])

  const handleCancelar = async (cita) => {
    const motivo = prompt('Motivo de cancelación:')
    if (!motivo) return
    await cancelarCita(cita.id, motivo)
    cargar()
  }

  const abrirReprogram = (cita) => { setSelected(cita); setForm({ fechaNueva: '', motivo: '' }); setModalReprogram(true) }
  const handleReprogram = async (e) => {
    e.preventDefault()
    await reprogramarCita(selected.id, { fechaNueva: form.fechaNueva, motivo: form.motivo })
    setModalReprogram(false)
    cargar()
  }

  const estadoBadge = (e) => {
    const cls = { PENDIENTE: 'badge-pendiente', CANCELADA: 'badge-cancelado', REPROGRAMADA: 'badge-reprogramado' }
    return <span className={cls[e] || 'badge-pendiente'}>{e}</span>
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'pacienteId', label: 'Paciente ID' },
    { key: 'medicoId', label: 'Médico ID' },
    { key: 'fechaOriginal', label: 'Fecha Original', render: (v) => v ? new Date(v).toLocaleString('es-CL') : '—' },
    { key: 'fechaNueva', label: 'Fecha Nueva', render: (v) => v ? new Date(v).toLocaleString('es-CL') : '—' },
    { key: 'motivo', label: 'Motivo' },
    { key: 'estado', label: 'Estado', render: estadoBadge },
  ]

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Reprogramación de Citas</h1>
        <p className="text-gray-500 text-sm mt-1">{citas.length} registros</p>
      </div>
      <div className="card">
        <Table
          columns={columns}
          data={citas}
          actions={(row) => row.estado !== 'CANCELADA' && (
            <>
              <button onClick={() => abrirReprogram(row)} className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-2">Reprogramar</button>
              <button onClick={() => handleCancelar(row)} className="text-red-500 hover:text-red-700 text-sm font-medium mr-2">Cancelar</button>
            </>
          )}
        />
      </div>

      <Modal isOpen={modalReprogram} onClose={() => setModalReprogram(false)} title="Reprogramar Cita">
        <form onSubmit={handleReprogram} className="space-y-4">
          <div>
            <label className="label">Nueva Fecha y Hora</label>
            <input type="datetime-local" className="input" value={form.fechaNueva} onChange={e => setForm({...form, fechaNueva: e.target.value})} required />
          </div>
          <div>
            <label className="label">Motivo</label>
            <textarea className="input" rows={3} value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} required />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalReprogram(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Reprogramar</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
