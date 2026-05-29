import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { useAuth } from '../../context/AuthContext'
import { getCitasReprogramacionPorMedico, reprogramarCita, cancelarCita } from '../../services/api'

export default function ReprogramacionMedico() {
  const { user } = useAuth()
  const [citas, setCitas] = useState([])
  const [modal, setModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ fechaNueva: '', motivo: '' })

  const cargar = () => {
    if (user?.id) getCitasReprogramacionPorMedico(user.id).then(r => setCitas(r.data)).catch(() => {})
  }
  useEffect(() => { cargar() }, [user])

  const abrirReprogram = (c) => { setSelected(c); setForm({ fechaNueva: '', motivo: '' }); setModal(true) }
  const handleReprogram = async (e) => {
    e.preventDefault()
    await reprogramarCita(selected.id, form)
    setModal(false); cargar()
  }
  const handleCancelar = async (c) => {
    const motivo = prompt('Motivo de cancelación:')
    if (!motivo) return
    await cancelarCita(c.id, motivo); cargar()
  }

  const estadoBadge = (e) => {
    const cls = { PENDIENTE: 'badge-pendiente', CANCELADA: 'badge-cancelado', REPROGRAMADA: 'badge-reprogramado' }
    return <span className={cls[e] || 'badge-pendiente'}>{e}</span>
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'pacienteId', label: 'Paciente ID' },
    { key: 'fechaOriginal', label: 'Fecha Original', render: (v) => v ? new Date(v).toLocaleString('es-CL') : '—' },
    { key: 'fechaNueva', label: 'Reprogramada', render: (v) => v ? new Date(v).toLocaleString('es-CL') : '—' },
    { key: 'motivo', label: 'Motivo' },
    { key: 'estado', label: 'Estado', render: estadoBadge },
  ]

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reprogramación</h1>
        <p className="text-gray-500 text-sm mt-1">{citas.length} registros</p>
      </div>
      <div className="card">
        <Table columns={columns} data={citas}
          actions={(row) => row.estado !== 'CANCELADA' && (
            <>
              <button onClick={() => abrirReprogram(row)} className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-2">Reprogramar</button>
              <button onClick={() => handleCancelar(row)} className="text-red-500 hover:text-red-700 text-sm font-medium mr-2">Cancelar</button>
            </>
          )}
        />
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Reprogramar Cita">
        <form onSubmit={handleReprogram} className="space-y-4">
          <div><label className="label">Nueva Fecha</label><input type="datetime-local" className="input" value={form.fechaNueva} onChange={e => setForm({...form, fechaNueva: e.target.value})} required /></div>
          <div><label className="label">Motivo</label><textarea className="input" rows={3} value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} required /></div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Reprogramar</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
