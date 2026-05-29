import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import { useAuth } from '../../context/AuthContext'
import { getCitasPorPaciente } from '../../services/api'

export default function MisCitasPaciente() {
  const { user } = useAuth()
  const [citas, setCitas] = useState([])

  useEffect(() => {
    if (user?.id) getCitasPorPaciente(user.id).then(r => setCitas(r.data)).catch(() => {})
  }, [user])

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'horaMedica', label: 'Médico', render: (v) => v?.nombreMedico || '—' },
    { key: 'horaMedica', label: 'Especialidad', render: (v) => v?.especialidad || '—' },
    { key: 'horaMedica', label: 'Fecha/Hora', render: (v) => v?.fechaHora ? new Date(v.fechaHora).toLocaleString('es-CL') : '—' },
    { key: 'estado', label: 'Estado', render: (v) => (
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${v === 'CANCELADA' ? 'badge-cancelado' : 'badge-activo'}`}>{v}</span>
    )},
    { key: 'observaciones', label: 'Observaciones' },
  ]

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mis Citas</h1>
        <p className="text-gray-500 text-sm mt-1">{citas.length} citas registradas</p>
      </div>
      <div className="card">
        <Table columns={columns} data={citas} />
      </div>
    </Layout>
  )
}
