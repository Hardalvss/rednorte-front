import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { getCitasPorPaciente, getCitasReprogramacionPorPaciente, getListaEspera } from '../../services/api'
import { Calendar, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function PacienteDashboard() {
  const { user } = useAuth()
  const [citas, setCitas] = useState([])
  const [reprogramadas, setReprogramadas] = useState([])
  const [enEspera, setEnEspera] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    getCitasPorPaciente(user.id).then(r => setCitas(r.data)).catch(() => {})
    getCitasReprogramacionPorPaciente(user.id).then(r => setReprogramadas(r.data)).catch(() => {})
    getListaEspera().then(r => {
      const mias = r.data.filter(l => l.pacienteId == user.id && l.estado === 'PENDIENTE')
      setEnEspera(mias.length)
    }).catch(() => {})
  }, [user])

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Bienvenido, {user?.nombre}</h1>
        <p className="text-gray-500 mt-1">Este es tu panel de salud personal</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calendar size={22} className="text-blue-600" />
          </div>
          <div><p className="text-sm text-gray-500">Mis Citas</p><p className="text-2xl font-bold text-gray-800">{citas.length}</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <RefreshCw size={22} className="text-yellow-600" />
          </div>
          <div><p className="text-sm text-gray-500">Reprogramadas</p><p className="text-2xl font-bold text-gray-800">{reprogramadas.length}</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <Clock size={22} className="text-orange-600" />
          </div>
          <div><p className="text-sm text-gray-500">En Espera</p><p className="text-2xl font-bold text-gray-800">{enEspera}</p></div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Próximas citas</h2>
        {citas.length === 0 ? (
          <p className="text-gray-400 text-sm">No tienes citas agendadas. Usa "Agendar Cita" para reservar una hora.</p>
        ) : (
          <div className="space-y-3">
            {citas.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{c.horaMedica?.nombreMedico || '—'}</p>
                  <p className="text-sm text-gray-500">{c.horaMedica?.especialidad || '—'}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="text-sm font-medium text-blue-600">
                    {c.horaMedica?.fechaHora ? new Date(c.horaMedica.fechaHora).toLocaleString('es-CL') : '—'}
                  </p>
                  <div className="flex items-center gap-1">
                    {c.estado === 'CANCELADA'
                      ? <XCircle size={13} className="text-red-500" />
                      : <CheckCircle size={13} className="text-green-500" />}
                    <span className={`text-xs font-medium ${c.estado === 'CANCELADA' ? 'text-red-500' : 'text-green-600'}`}>{c.estado}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
