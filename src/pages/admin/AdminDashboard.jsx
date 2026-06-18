import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import {
  getUsuarios, getCitas, getListaEspera, getSeguimientos,
  getTodasHoras, getEspecialidades, getCitasReprogramacion
} from '../../services/api'
import {
  Users, Calendar, Clock, ClipboardList, Stethoscope, BookOpen,
  RefreshCw, TrendingUp, AlertTriangle, CheckCircle2
} from 'lucide-react'

function StatCard({ label, value, icon: Icon, color, textColor, hint }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex items-center gap-4">
      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} className={textColor} />
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-800">{value ?? '...'}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5 truncate">{hint}</p>}
      </div>
    </div>
  )
}

function BarChart({ title, data, colorClass, empty = 'Sin datos disponibles' }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <h2 className="text-sm sm:text-base font-semibold text-gray-800 mb-4">{title}</h2>
      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1 gap-2">
              <span className="text-gray-600 font-medium truncate">{item.label}</span>
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
          <p className="text-gray-400 text-sm text-center py-4">{empty}</p>
        )}
      </div>
    </div>
  )
}

function DonutCard({ title, segments }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  let offset = 0
  const radius = 38
  const circ = 2 * Math.PI * radius

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <h2 className="text-sm sm:text-base font-semibold text-gray-800 mb-4">{title}</h2>
      {total === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
      ) : (
        <div className="flex items-center gap-5 flex-wrap">
          <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90 shrink-0">
            <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f3f4f6" strokeWidth="14" />
            {segments.map((s, i) => {
              const len = (s.value / total) * circ
              const dasharray = `${len} ${circ - len}`
              const dashoffset = -offset
              offset += len
              return (
                <circle
                  key={i}
                  cx="50" cy="50" r={radius}
                  fill="transparent"
                  stroke={s.color}
                  strokeWidth="14"
                  strokeDasharray={dasharray}
                  strokeDashoffset={dashoffset}
                />
              )
            })}
          </svg>
          <ul className="space-y-1.5 text-sm flex-1 min-w-[140px]">
            {segments.map((s, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: s.color }} />
                <span className="text-gray-600 flex-1 truncate">{s.label}</span>
                <span className="font-semibold text-gray-800">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const ESTADO_COLORS = ['bg-yellow-400', 'bg-green-500', 'bg-red-400', 'bg-blue-400', 'bg-purple-400']
const ESP_COLORS = ['bg-blue-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-teal-500', 'bg-sky-400', 'bg-violet-500']
const PRIO_COLORS = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']
const ROL_COLORS = { ADMIN: '#6366f1', MEDICO: '#10b981', PACIENTE: '#3b82f6' }

const fmtFecha = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [raw, setRaw] = useState({
    usuarios: [], citas: [], lista: [], seguimiento: [],
    horas: [], especialidades: [], reprogramaciones: []
  })

  const cargar = () => {
    setLoading(true)
    Promise.allSettled([
      getUsuarios(), getCitas(), getListaEspera(), getSeguimientos(),
      getTodasHoras(), getEspecialidades(), getCitasReprogramacion()
    ]).then(([usuarios, citas, lista, seguimiento, horas, esp, reprog]) => {
      setRaw({
        usuarios: usuarios.value?.data || [],
        citas: citas.value?.data || [],
        lista: lista.value?.data || [],
        seguimiento: seguimiento.value?.data || [],
        horas: horas.value?.data || [],
        especialidades: esp.value?.data || [],
        reprogramaciones: reprog.value?.data || []
      })
      setLoading(false)
    })
  }

  useEffect(() => { cargar() }, [])

  const stats = useMemo(() => {
    const horasDisp = raw.horas.filter(h => h.disponible).length
    const citasActivas = raw.citas.filter(c => c.estado === 'AGENDADA').length
    const listaPendiente = raw.lista.filter(l => l.estado === 'PENDIENTE' || !l.estado).length
    return {
      usuarios: raw.usuarios.length,
      citas: raw.citas.length,
      lista: raw.lista.length,
      seguimiento: raw.seguimiento.length,
      horas: raw.horas.length,
      especialidades: raw.especialidades.length,
      reprogramaciones: raw.reprogramaciones.length,
      horasDisp,
      citasActivas,
      listaPendiente
    }
  }, [raw])

  const citasPorEstado = useMemo(() => {
    const map = {}
    raw.citas.forEach(c => {
      const e = c.estado || 'DESCONOCIDO'
      map[e] = (map[e] || 0) + 1
    })
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  }, [raw.citas])

  const citasPorEsp = useMemo(() => {
    const map = {}
    raw.citas.forEach(c => {
      const e = c.horaMedica?.especialidad || c.especialidad || 'Otra'
      map[e] = (map[e] || 0) + 1
    })
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [raw.citas])

  const listaPorPrioridad = useMemo(() => {
    const map = {}
    raw.lista.forEach(l => {
      const p = l.prioridad || 'SIN PRIORIDAD'
      map[p] = (map[p] || 0) + 1
    })
    const orden = ['ALTA', 'MEDIA', 'BAJA']
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => orden.indexOf(a.label) - orden.indexOf(b.label))
  }, [raw.lista])

  const usuariosPorRol = useMemo(() => {
    const map = {}
    raw.usuarios.forEach(u => {
      const r = u.rol || 'SIN ROL'
      map[r] = (map[r] || 0) + 1
    })
    return Object.entries(map).map(([label, value]) => ({
      label, value, color: ROL_COLORS[label] || '#94a3b8'
    }))
  }, [raw.usuarios])

  const proximasCitas = useMemo(() => {
    const ahora = Date.now()
    return raw.citas
      .filter(c => c.estado === 'AGENDADA')
      .map(c => ({
        id: c.id,
        paciente: c.nombrePaciente,
        medico: c.horaMedica?.nombreMedico,
        especialidad: c.horaMedica?.especialidad,
        fecha: c.horaMedica?.fechaHora
      }))
      .filter(c => c.fecha && new Date(c.fecha).getTime() >= ahora)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .slice(0, 5)
  }, [raw.citas])

  return (
    <Layout>
      <div className="mb-6 sm:mb-8 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Panel Administrador</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen general del sistema RedNorte</p>
        </div>
        <button
          onClick={cargar}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Usuarios" value={stats.usuarios} icon={Users} color="bg-blue-100" textColor="text-blue-600" />
        <StatCard label="Citas activas" value={stats.citasActivas} hint={`${stats.citas} totales`} icon={Calendar} color="bg-green-100" textColor="text-green-600" />
        <StatCard label="En lista de espera" value={stats.listaPendiente} hint={`${stats.lista} históricas`} icon={Clock} color="bg-yellow-100" textColor="text-yellow-600" />
        <StatCard label="Seguimientos" value={stats.seguimiento} icon={ClipboardList} color="bg-purple-100" textColor="text-purple-600" />
        <StatCard label="Horas disponibles" value={stats.horasDisp} hint={`${stats.horas} cargadas`} icon={Stethoscope} color="bg-cyan-100" textColor="text-cyan-600" />
        <StatCard label="Especialidades" value={stats.especialidades} icon={BookOpen} color="bg-indigo-100" textColor="text-indigo-600" />
        <StatCard label="Reprogramaciones" value={stats.reprogramaciones} icon={RefreshCw} color="bg-pink-100" textColor="text-pink-600" />
        <StatCard label="Ocupación horas" value={`${stats.horas ? Math.round((1 - stats.horasDisp / stats.horas) * 100) : 0}%`} icon={TrendingUp} color="bg-emerald-100" textColor="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <BarChart title="Citas por estado" data={citasPorEstado} colorClass={ESTADO_COLORS} />
        <BarChart title="Citas por especialidad" data={citasPorEsp} colorClass={ESP_COLORS} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <BarChart title="Lista de espera por prioridad" data={listaPorPrioridad} colorClass={PRIO_COLORS} empty="Lista de espera vacía" />
        <DonutCard title="Usuarios por rol" segments={usuariosPorRol} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <h2 className="text-sm sm:text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-600" />
          Próximas citas
        </h2>
        {proximasCitas.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No hay citas próximas agendadas.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {proximasCitas.map(c => (
              <li key={c.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{c.paciente || 'Paciente'}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {c.medico || 'Médico'} · {c.especialidad || 'Sin especialidad'}
                  </p>
                </div>
                <span className="text-xs sm:text-sm text-gray-700 font-medium shrink-0">{fmtFecha(c.fecha)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {stats.listaPendiente > 10 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">
            Hay <strong>{stats.listaPendiente}</strong> pacientes en lista de espera. Considera asignar horas médicas para reducir el backlog.
          </p>
        </div>
      )}
    </Layout>
  )
}
