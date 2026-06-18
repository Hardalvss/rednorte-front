import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import {
  getCitasPendientesMedico, getCitasPorMedico,
  confirmarCitaAgenda,
  aceptarReprogramacionAgenda
} from '../../services/api'
import { liberarListaEspera } from '../../utils/listaEspera'
import {
  Check, Clock, User, Stethoscope, AlertCircle, CheckCircle, RefreshCw, CalendarClock
} from 'lucide-react'

const fmt = (iso) => iso ? new Date(iso).toLocaleString('es-CL', {
  weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
}) : '—'

export default function ConfirmarCitas() {
  const { user } = useAuth()
  const [pendientes, setPendientes] = useState([])
  const [reprogPacientes, setReprogPacientes] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ tipo: '', texto: '' })

  const cargar = () => {
    if (!user?.id) return
    setLoading(true)
    Promise.allSettled([
      getCitasPendientesMedico(user.id),
      getCitasPorMedico(user.id)
    ]).then(([pendRes, todasRes]) => {
      setPendientes(pendRes.value?.data || [])
      const todas = todasRes.value?.data || []
      setReprogPacientes(todas.filter(c =>
        c.estado === 'REPROGRAMACION_PENDIENTE' && c.solicitanteReprogramacion === 'PACIENTE'
      ))
      setLoading(false)
    })
  }

  useEffect(() => { cargar() }, [user?.id])

  const flash = (tipo, texto) => {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg({ tipo: '', texto: '' }), 3500)
  }

  const confirmar = async (c) => {
    try {
      await confirmarCitaAgenda(c.id)
      liberarListaEspera(c.pacienteId, c.horaMedica?.especialidad).catch(() => {})
      flash('ok', `Cita de ${c.nombrePaciente} confirmada. Se notificó al paciente.`)
      cargar()
    } catch (err) {
      flash('err', err.response?.data?.message || 'No se pudo confirmar la cita')
    }
  }

  const aceptarReprog = async (c) => {
    try {
      await aceptarReprogramacionAgenda(c.id)
      liberarListaEspera(c.pacienteId, c.horaMedica?.especialidad).catch(() => {})
      flash('ok', `Reprogramación de ${c.nombrePaciente} aceptada. Cita confirmada.`)
      cargar()
    } catch (err) {
      flash('err', err.response?.data?.message || 'No se pudo aceptar')
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Citas por Confirmar</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pendientes.length + reprogPacientes.length} acciones pendientes
          </p>
        </div>
        <button onClick={cargar} disabled={loading} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {msg.texto && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
          msg.tipo === 'ok' ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg.tipo === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.texto}
        </div>
      )}

      {pendientes.length === 0 && reprogPacientes.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle size={36} className="mx-auto text-green-300 mb-3" />
          <p className="text-gray-500">No tienes citas ni reprogramaciones pendientes.</p>
        </div>
      ) : (
        <>
          {pendientes.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock size={16} className="text-yellow-500" />
                Nuevas citas por confirmar ({pendientes.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendientes.map(c => (
                  <div key={c.id} className="card border-l-4 border-yellow-400">
                    <span className="inline-block text-[10px] font-bold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 mb-3">
                      PENDIENTE DE CONFIRMACIÓN
                    </span>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-start gap-2">
                        <User size={15} className="text-gray-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">{c.nombrePaciente}</p>
                          <p className="text-xs text-gray-500">{c.rutPaciente}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Stethoscope size={15} className="text-gray-400 mt-0.5 shrink-0" />
                        <p className="text-gray-700 capitalize">{c.horaMedica?.especialidad}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock size={15} className="text-gray-400 mt-0.5 shrink-0" />
                        <p className="font-medium text-blue-600 capitalize">{fmt(c.horaMedica?.fechaHora)}</p>
                      </div>
                      {c.observaciones && (
                        <p className="text-xs text-gray-600 bg-gray-50 rounded p-2 mt-2">
                          <strong>Observación:</strong> {c.observaciones}
                        </p>
                      )}
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <button onClick={() => confirmar(c)} className="w-full flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-2 rounded-lg">
                        <Check size={16} /> Confirmar cita
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reprogPacientes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CalendarClock size={16} className="text-indigo-500" />
                Reprogramaciones solicitadas por pacientes ({reprogPacientes.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reprogPacientes.map(c => (
                  <div key={c.id} className="card border-l-4 border-indigo-400">
                    <span className="inline-block text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 mb-3">
                      REPROGRAMACIÓN SOLICITADA
                    </span>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-start gap-2">
                        <User size={15} className="text-gray-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">{c.nombrePaciente}</p>
                          <p className="text-xs text-gray-500">{c.rutPaciente}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock size={15} className="text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase text-gray-500">Nueva fecha propuesta</p>
                          <p className="font-medium text-blue-600 capitalize">{fmt(c.horaMedica?.fechaHora)}</p>
                        </div>
                      </div>
                      {c.motivoReprogramacion && (
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-[10px] uppercase text-gray-500">Motivo del paciente</p>
                          <p className="text-xs text-gray-700">{c.motivoReprogramacion}</p>
                        </div>
                      )}
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <button onClick={() => aceptarReprog(c)} className="w-full flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-2 rounded-lg">
                        <Check size={16} /> Aceptar reprogramación
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
