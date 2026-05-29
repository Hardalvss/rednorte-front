import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import { getCitas } from '../../services/api'

export default function CitasAdmin() {
  const [citas, setCitas] = useState([])

  useEffect(() => { getCitas().then(r => setCitas(r.data)) }, [])

  const estadoBadge = (estado) => {
    const cls = {
      ACTIVA: 'badge-activo', CANCELADA: 'badge-cancelado',
      PENDIENTE: 'badge-pendiente', REPROGRAMADA: 'badge-reprogramado'
    }
    return <span className={cls[estado] || 'badge-pendiente'}>{estado}</span>
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nombrePaciente', label: 'Paciente' },
    { key: 'rutPaciente', label: 'RUT' },
    { key: 'horaMedica', label: 'Médico', render: (v) => v?.nombreMedico || '—' },
    { key: 'horaMedica', label: 'Especialidad', render: (v) => v?.especialidad || '—' },
    { key: 'horaMedica', label: 'Fecha/Hora', render: (v) => v?.fechaHora ? new Date(v.fechaHora).toLocaleString('es-CL') : '—' },
    { key: 'estado', label: 'Estado', render: estadoBadge },
  ]

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Citas Médicas</h1>
        <p className="text-gray-500 text-sm mt-1">{citas.length} citas en el sistema</p>
      </div>
      <div className="card">
        <Table columns={columns} data={citas} />
      </div>
    </Layout>
  )
}
