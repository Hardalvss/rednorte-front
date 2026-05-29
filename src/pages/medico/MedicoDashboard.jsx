import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { getCitasPorMedico, getHorasDisponibles } from '../../services/api'
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function MedicoDashboard() {
  const { user } = useAuth()
  const [citas, setCitas] = useState([])
  const [horasDisp, setHorasDisp] = useState([])

  useEffect(() => {
    if (user?.id) {
      getCitasPorMedico(user.id).then(r => setCitas(r.data)).catch(() => {})
      getHorasDisponibles().then(r => setHorasDisp(r.data)).catch(() => {})
    }
  }, [user])

  const hoy = new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Bienvenido, Dr. {user?.nombre}</h1>
        <p className="text-gray-500 mt-1 capitalize">{hoy}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calendar size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Mis Citas</p>
            <p className="text-2xl font-bold text-gray-800">{citas.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Clock size={22} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Horas Disponibles</p>
            <p className="text-2xl font-bold text-gray-800">{horasDisp.length}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Próximas citas</h2>
        {citas.length === 0 ? (
          <p className="text-gray-400 text-sm">No tienes citas registradas.</p>
        ) : (
          <div className="space-y-3">
            {citas.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{c.nombrePaciente}</p>
                  <p className="text-sm text-gray-500">{c.rutPaciente}</p>
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
