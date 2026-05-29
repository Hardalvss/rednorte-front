import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { getUsuarios, getCitas, getListaEspera, getSeguimientos } from '../../services/api'
import { Users, Calendar, Clock, ClipboardList } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color, textColor }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className={textColor} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value ?? '...'}</p>
      </div>
    </div>
  )
}

function BarChart({ title, data, colorClass }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="card">
      <h2 className="text-base font-semibold text-gray-800 mb-4">{title}</h2>
      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 font-medium">{item.label}</span>
              <span className="text-gray-800 font-bold">{item.value}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${colorClass[i % colorClass.length]}`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">Sin datos disponibles</p>
        )}
      </div>
    </div>
  )
}

const ESTADO_COLORS = ['bg-yellow-400', 'bg-green-500', 'bg-red-400', 'bg-blue-400', 'bg-purple-400']
const ESP_COLORS = ['bg-blue-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-teal-500', 'bg-sky-400', 'bg-violet-500']

export default function AdminDashboard() {
  const [stats, setStats] = useState({})
  const [citasPorEstado, setCitasPorEstado] = useState([])
  const [citasPorEsp, setCitasPorEsp] = useState([])

  useEffect(() => {
    Promise.allSettled([
      getUsuarios(), getCitas(), getListaEspera(), getSeguimientos()
    ]).then(([usuarios, citas, lista, seguimiento]) => {
      setStats({
        usuarios: usuarios.value?.data?.length ?? '—',
        citas: citas.value?.data?.length ?? '—',
        lista: lista.value?.data?.length ?? '—',
        seguimiento: seguimiento.value?.data?.length ?? '—',
      })

      const citasData = citas.value?.data || []

      // Agrupar por estado
      const porEstado = {}
      citasData.forEach(c => {
        const e = c.estado || 'DESCONOCIDO'
        porEstado[e] = (porEstado[e] || 0) + 1
      })
      setCitasPorEstado(
        Object.entries(porEstado)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
      )

      // Agrupar por especialidad
      const porEsp = {}
      citasData.forEach(c => {
        const e = c.especialidad || c.nombreMedico || 'Otra'
        porEsp[e] = (porEsp[e] || 0) + 1
      })
      setCitasPorEsp(
        Object.entries(porEsp)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6)
      )
    })
  }, [])

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Panel Administrador</h1>
        <p className="text-gray-500 mt-1">Resumen general del sistema RedNorte</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Usuarios registrados"  value={stats.usuarios}     icon={Users}         color="bg-blue-100"   textColor="text-blue-600" />
        <StatCard label="Citas agendadas"        value={stats.citas}        icon={Calendar}      color="bg-green-100"  textColor="text-green-600" />
        <StatCard label="En lista de espera"     value={stats.lista}        icon={Clock}         color="bg-yellow-100" textColor="text-yellow-600" />
        <StatCard label="Seguimientos activos"   value={stats.seguimiento}  icon={ClipboardList} color="bg-purple-100" textColor="text-purple-600" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Citas por Estado"
          data={citasPorEstado}
          colorClass={ESTADO_COLORS}
        />
        <BarChart
          title="Citas por Especialidad"
          data={citasPorEsp}
          colorClass={ESP_COLORS}
        />
      </div>
    </Layout>
  )
}
