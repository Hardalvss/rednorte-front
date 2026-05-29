import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import { getSeguimientos } from '../../services/api'

export default function SeguimientoMedico() {
  const [seguimientos, setSeguimientos] = useState([])
  useEffect(() => { getSeguimientos().then(r => setSeguimientos(r.data)).catch(() => {}) }, [])

  const estadoBadge = (e) => {
    const cls = { EN_ESPERA: 'badge-pendiente', EN_TRATAMIENTO: 'badge-reprogramado', EN_SEGUIMIENTO: 'badge-activo', ALTA: 'bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full', DERIVADO: 'badge-cancelado' }
    return <span className={cls[e] || 'badge-pendiente'}>{e?.replace('_', ' ')}</span>
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nombrePaciente', label: 'Paciente' },
    { key: 'rutPaciente', label: 'RUT' },
    { key: 'especialidad', label: 'Especialidad' },
    { key: 'estadoActual', label: 'Estado', render: estadoBadge },
    { key: 'fechaActualizacion', label: 'Última actualización', render: (v) => v ? new Date(v).toLocaleDateString('es-CL') : '—' },
  ]

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Seguimiento de Pacientes</h1>
        <p className="text-gray-500 text-sm mt-1">{seguimientos.length} pacientes en seguimiento</p>
      </div>
      <div className="card">
        <Table columns={columns} data={seguimientos} />
      </div>
    </Layout>
  )
}
