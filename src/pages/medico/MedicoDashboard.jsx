import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import ReprogramarModal from '../../components/ReprogramarModal'
import { useAuth } from '../../context/AuthContext'
import {
  getCitasPorMedico, getTodasHoras,
  confirmarCitaAgenda
} from '../../services/api'
import {
  Calendar, Clock, CheckCircle, AlertCircle, AlertTriangle,
  CalendarClock, TrendingUp, Users, ArrowRight, RefreshCw, Check
} from 'lucide-react'

const ACTIVAS = ['PENDIENTE', 'CONFIRMADA', 'AGENDADA', 'REPROGRAMACION_PENDIENTE']

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const fmtHora = (iso) => new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
const fmtFechaCorta = (iso) => new Date(iso).toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit' })

const ESTADO_COLOR = {
  PENDIENTE: { bg: 'bg-yellow-400', border: 'border-yellow-500', text: 'text-yellow-700', soft: 'bg-yellow-50' },
  CONFIRMADA: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-green-700', soft: 'bg-green-50' },
  AGENDADA: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-blue-700', soft: 'bg-blue-50' },
  REPROGRAMACION_PENDIENTE: { bg: 'bg-indigo-500', border: 'border-indigo-600', text: 'text-indigo-700', soft: 'bg-indigo-50' },
  CANCELADA: { bg: 'bg-gray-300', border: 'border-gray-400', text: 'text-gray-500', soft: 'bg-gray-50' },
  ATENDIDA: { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-700', soft: 'bg-emerald-50' }
}

function StatCard({ label, value, hint, icon: Icon, color, textColor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex items-center gap-4">
      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} className={textColor} />
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-800">{value}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5 truncate">{hint}</p>}
      </div>
    </div>
  )
}

function TimelineDia({ citas }) {
  const horaInicio = 8
  const horaFin = 20
  const totalMin = (horaFin - horaInicio) * 60
  const ahora = new Date()
  const minActuales = ahora.getHours() * 60 + ahora.getMinutes() - horaInicio * 60
  const pctAhora = (minActuales / totalMin) * 100

  const segmentos = citas
    .filter(c => c.horaMedica?.fechaHora)
    .map(c => {
      const ini = new Date(c.horaMedica.fechaHora)
      const min = ini.getHours() * 60 + ini.getMinutes() - horaInicio * 60
      const dur = c.horaMedica.duracionMinutos || 30
      return {
        cita: c,
        left: Math.max(0, (min / totalMin) * 100),
        width: (dur / totalMin) * 100
      }
    })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Calendar size={18} className="text-blue-600" />
          Agenda de hoy
        </h2>
        <span className="text-xs text-gray-500">{citas.length} {citas.length === 1 ? 'cita' : 'citas'}</span>
      </div>

      {citas.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No tienes citas agendadas para hoy.</p>
      ) : (
        <>
          <div className="relative h-12 bg-gray-50 rounded-lg mb-2">
            {segmentos.map((s, i) => {
              const c = s.cita
              const color = ESTADO_COLOR[c.estado] || ESTADO_COLOR.AGENDADA
              return (
                <div
                  key={c.id}
                  className={`absolute top-1 bottom-1 ${color.bg} rounded-md opacity-90 hover:opacity-100 hover:z-10 cursor-default transition-all`}
                  style={{ left: `${s.left}%`, width: `${Math.max(s.width, 1.5)}%` }}
                  title={`${fmtHora(c.horaMedica.fechaHora)} · ${c.nombrePaciente} · ${c.estado}`}
                />
              )
            })}
            {pctAhora >= 0 && pctAhora <= 100 && (
              <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20" style={{ left: `${pctAhora}%` }}>
                <span className="absolute -top-5 -translate-x-1/2 text-[10px] font-bold text-red-500 whitespace-nowrap">ahora</span>
              </div>
            )}
          </div>

          <div className="flex justify-between text-[10px] text-gray-400 mb-4">
            {Array.from({ length: horaFin - horaInicio + 1 }, (_, i) => horaInicio + i).map(h => (
              <span key={h}>{String(h).padStart(2, '0')}:00</span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 text-[11px] text-gray-600">
            {['PENDIENTE', 'CONFIRMADA', 'REPROGRAMACION_PENDIENTE', 'ATENDIDA', 'CANCELADA'].map(e => (
              <div key={e} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm ${ESTADO_COLOR[e].bg}`} />
                <span>{e.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function BarrasSemana({ porDia }) {
  const max = Math.max(...porDia.map(d => d.count), 1)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp size={18} className="text-emerald-600" />
        Próxima semana
      </h2>
      <div className="flex items-end justify-between gap-2 h-32">
        {porDia.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="text-xs font-semibold text-gray-700">{d.count}</div>
            <div className="w-full bg-gray-100 rounded-md overflow-hidden flex items-end" style={{ height: '80px' }}>
              <div
                className={`w-full rounded-md transition-all ${sameDay(d.fecha, new Date()) ? 'bg-blue-600' : 'bg-blue-300'}`}
                style={{ height: `${(d.count / max) * 100}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-500 capitalize">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MedicoDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [citas, setCitas] = useState([])
  const [horas, setHoras] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalReprog, setModalReprog] = useState(false)
  const [citaReprog, setCitaReprog] = useState(null)
  const [msg, setMsg] = useState({ tipo: '', texto: '' })

  const cargar = () => {
    if (!user?.id) return
    setLoading(true)
    Promise.allSettled([
      getCitasPorMedico(user.id),
      getTodasHoras()
    ]).then(([cs, hs]) => {
      setCitas(cs.value?.data || [])
      const todas = hs.value?.data || []
      setHoras(todas.filter(h => Number(h.medicoId) === Number(user.id)))
      setLoading(false)
    })
  }

  useEffect(() => { cargar() }, [user?.id])

  const flash = (tipo, texto) => {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg({ tipo: '', texto: '' }), 3500)
  }

  const ahora = new Date()
  const hoyInicio = new Date(ahora); hoyInicio.setHours(0, 0, 0, 0)
  const hoyFin = new Date(ahora); hoyFin.setHours(23, 59, 59, 999)
  const en30min = new Date(ahora.getTime() + 30 * 60 * 1000)
  const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000)
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  const citasHoy = useMemo(() => {
    return citas
      .filter(c => c.horaMedica?.fechaHora)
      .filter(c => {
        const f = new Date(c.horaMedica.fechaHora)
        return f >= hoyInicio && f <= hoyFin
      })
      .sort((a, b) => new Date(a.horaMedica.fechaHora) - new Date(b.horaMedica.fechaHora))
  }, [citas])

  const pendientesPorConfirmar = useMemo(
    () => citas.filter(c => c.estado === 'PENDIENTE'),
    [citas]
  )

  const reprogEsperando = useMemo(
    () => citas.filter(c => c.estado === 'REPROGRAMACION_PENDIENTE'),
    [citas]
  )

  const ocupacionHoras = useMemo(() => {
    const futuras = horas.filter(h => h.fechaHora && new Date(h.fechaHora) > ahora)
    if (futuras.length === 0) return 0
    const ocupadas = futuras.filter(h => !h.disponible).length
    return Math.round((ocupadas / futuras.length) * 100)
  }, [horas])

  const pacientesMes = useMemo(() => {
    const set = new Set()
    citas.forEach(c => {
      const f = c.horaMedica?.fechaHora ? new Date(c.horaMedica.fechaHora) : null
      if (f && f >= inicioMes && f <= hoyFin && c.estado !== 'CANCELADA') {
        set.add(c.pacienteId)
      }
    })
    return set.size
  }, [citas])

  const proximas = useMemo(() => {
    return citas
      .filter(c => ACTIVAS.includes(c.estado) && c.horaMedica?.fechaHora)
      .filter(c => new Date(c.horaMedica.fechaHora) >= ahora)
      .sort((a, b) => new Date(a.horaMedica.fechaHora) - new Date(b.horaMedica.fechaHora))
      .slice(0, 5)
  }, [citas])

  const proximaCita = proximas[0]
  const proximaEnMin = proximaCita
    ? Math.round((new Date(proximaCita.horaMedica.fechaHora) - ahora) / 60000)
    : null

  const inminentesSinConfirmar = useMemo(() => {
    return pendientesPorConfirmar.filter(c => {
      const f = new Date(c.horaMedica?.fechaHora)
      return f >= ahora && f <= en30min
    })
  }, [pendientesPorConfirmar])

  const reprogVencidas = useMemo(() => {
    return reprogEsperando.filter(c => c.fechaReprogramacion && new Date(c.fechaReprogramacion) < hace24h)
  }, [reprogEsperando])

  const porDiaSemana = useMemo(() => {
    const dias = []
    for (let i = 0; i < 7; i++) {
      const f = new Date(); f.setDate(ahora.getDate() + i); f.setHours(0, 0, 0, 0)
      const finF = new Date(f); finF.setHours(23, 59, 59, 999)
      const count = citas.filter(c => {
        const fc = c.horaMedica?.fechaHora ? new Date(c.horaMedica.fechaHora) : null
        return fc && fc >= f && fc <= finF && ACTIVAS.includes(c.estado)
      }).length
      dias.push({
        fecha: f,
        label: f.toLocaleDateString('es-CL', { weekday: 'short' }),
        count
      })
    }
    return dias
  }, [citas])

  const confirmarRapido = async (c) => {
    try {
      await confirmarCitaAgenda(c.id)
      flash('ok', `Cita de ${c.nombrePaciente} confirmada.`)
      cargar()
    } catch (err) {
      flash('err', err.response?.data?.message || 'No se pudo confirmar')
    }
  }

  const abrirReprog = (c) => { setCitaReprog(c); setModalReprog(true) }
  const onReprogOk = () => {
    setModalReprog(false)
    flash('ok', 'Solicitud de reprogramación enviada al paciente.')
    cargar()
  }

  const hoyTexto = ahora.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <Layout>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Bienvenido, Dr. {user?.nombre}</h1>
          <p className="text-gray-500 mt-1 capitalize text-sm">{hoyTexto}</p>
        </div>
        <button onClick={cargar} disabled={loading} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50">
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

      {(inminentesSinConfirmar.length > 0 || reprogVencidas.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-amber-900 space-y-1">
            {inminentesSinConfirmar.length > 0 && (
              <p>
                Tienes <strong>{inminentesSinConfirmar.length}</strong> {inminentesSinConfirmar.length === 1 ? 'cita' : 'citas'} en menos de 30 min sin confirmar.{' '}
                <button onClick={() => navigate('/medico/confirmar')} className="underline font-semibold">Ver ahora</button>
              </p>
            )}
            {reprogVencidas.length > 0 && (
              <p>
                <strong>{reprogVencidas.length}</strong> reprogramación(es) llevan más de 24h sin respuesta del paciente.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          label="Citas hoy"
          value={citasHoy.length}
          hint={`${citasHoy.filter(c => new Date(c.horaMedica.fechaHora) >= ahora).length} pendientes`}
          icon={Calendar}
          color="bg-blue-100"
          textColor="text-blue-600"
        />
        <StatCard
          label="Por confirmar"
          value={pendientesPorConfirmar.length}
          hint={inminentesSinConfirmar.length > 0 ? `${inminentesSinConfirmar.length} urgentes` : 'al día'}
          icon={Clock}
          color="bg-yellow-100"
          textColor="text-yellow-600"
        />
        <StatCard
          label="Reprog. esperando"
          value={reprogEsperando.length}
          hint={reprogVencidas.length > 0 ? `${reprogVencidas.length} > 24h` : 'al día'}
          icon={CalendarClock}
          color="bg-indigo-100"
          textColor="text-indigo-600"
        />
        <StatCard
          label="Ocupación"
          value={`${ocupacionHoras}%`}
          hint={`${pacientesMes} pacientes este mes`}
          icon={TrendingUp}
          color="bg-emerald-100"
          textColor="text-emerald-600"
        />
      </div>

      <div className="mb-6">
        <TimelineDia citas={citasHoy} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle size={18} className="text-green-600" />
              Próximas 5 citas
            </h2>
            {proximaEnMin !== null && proximaEnMin <= 120 && proximaEnMin >= 0 && (
              <span className="text-xs font-medium text-blue-600 bg-blue-50 rounded-full px-2.5 py-1">
                Próxima en {proximaEnMin < 60 ? `${proximaEnMin} min` : `${Math.floor(proximaEnMin/60)}h ${proximaEnMin%60}m`}
              </span>
            )}
          </div>
          {proximas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No tienes próximas citas.</p>
          ) : (
            <ul className="space-y-2">
              {proximas.map(c => {
                const color = ESTADO_COLOR[c.estado] || ESTADO_COLOR.AGENDADA
                return (
                  <li key={c.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg ${color.soft} border-l-4 ${color.border}`}>
                    <div className="w-12 h-12 bg-white rounded-lg flex flex-col items-center justify-center shrink-0">
                      <p className="text-[9px] text-gray-500 uppercase">{fmtFechaCorta(c.horaMedica.fechaHora).split(' ')[0]}</p>
                      <p className="text-sm font-bold text-gray-800">{fmtHora(c.horaMedica.fechaHora)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{c.nombrePaciente}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {c.rutPaciente} · <span className="capitalize">{c.horaMedica?.especialidad}</span>
                      </p>
                      <span className={`inline-block text-[10px] font-semibold mt-1 ${color.text}`}>
                        {c.estado.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {c.estado === 'PENDIENTE' && (
                        <button onClick={() => confirmarRapido(c)} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg">
                          <Check size={13} /> Confirmar
                        </button>
                      )}
                      {ACTIVAS.includes(c.estado) && c.estado !== 'REPROGRAMACION_PENDIENTE' && (
                        <button onClick={() => abrirReprog(c)} className="flex items-center gap-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
                          <CalendarClock size={13} /> Reprogramar
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <button
            onClick={() => navigate('/medico/mis-citas')}
            className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1"
          >
            Ver todas mis citas <ArrowRight size={14} />
          </button>
        </div>

        <BarrasSemana porDia={porDiaSemana} />
      </div>

      <ReprogramarModal cita={citaReprog} isOpen={modalReprog} onClose={() => setModalReprog(false)} onSuccess={onReprogOk} />
    </Layout>
  )
}
