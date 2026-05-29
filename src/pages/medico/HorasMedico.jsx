import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { getTodasHoras, crearHoraMedica, getEspecialidades, getCitasPorMedico } from '../../services/api'
import { Clock, CheckCircle, XCircle, Calendar, Zap } from 'lucide-react'

const SLOTS = Array.from({ length: 23 }, (_, i) => {
  const totalMin = 7 * 60 + i * 30
  const h = Math.floor(totalMin / 60).toString().padStart(2, '0')
  const m = (totalMin % 60).toString().padStart(2, '0')
  return `${h}:${m}`
})

export default function HorasMedico() {
  const { user } = useAuth()
  const [horas, setHoras] = useState([])
  const [citas, setCitas] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [espSel, setEspSel] = useState('')
  const [duracion, setDuracion] = useState(30)
  const [habilitando, setHabilitando] = useState(false)
  const [msg, setMsg] = useState('')

  const uid = Number(user?.id)

  const cargar = () => {
    if (!uid) return
    getTodasHoras().then(r => setHoras(r.data.filter(h => Number(h.medicoId) === uid))).catch(() => {})
    getCitasPorMedico(uid).then(r => setCitas(r.data)).catch(() => {})
    getEspecialidades().then(r => {
      const misEsp = r.data.filter(e => e.medicoIds?.some(id => Number(id) === uid))
      setEspecialidades(misEsp)
      if (misEsp.length > 0) setEspSel(prev => prev || misEsp[0].nombre)
    }).catch(() => {})
  }

  useEffect(() => { cargar() }, [user])

  // Horas de ese día y especialidad
  const horasDelDia = horas.filter(h => {
    const d = new Date(h.fechaHora).toISOString().split('T')[0]
    return d === fecha && h.especialidad === espSel
  })

  const getSlotStatus = (slot) => {
    const [sh, sm] = slot.split(':').map(Number)
    const horaEntry = horasDelDia.find(h => {
      const d = new Date(h.fechaHora)
      return d.getHours() === sh && d.getMinutes() === sm
    })
    if (!horaEntry) return 'sin-habilitar'
    if (!horaEntry.disponible) return 'ocupada'
    return 'disponible'
  }

  // Habilitar TODAS las horas del día seleccionado de una vez
  const habilitarDia = async () => {
    if (!espSel) { setMsg('Selecciona una especialidad'); return }
    if (!uid) { setMsg('Error: cierra sesión e ingresa nuevamente'); return }

    setHabilitando(true); setMsg('')
    const slotsACrear = SLOTS.filter(slot => getSlotStatus(slot) === 'sin-habilitar')

    if (slotsACrear.length === 0) { setMsg('Todas las horas ya están habilitadas para este día'); setHabilitando(false); return }

    let creadas = 0
    for (const slot of slotsACrear) {
      const [h, m] = slot.split(':')
      const fechaHora = `${fecha}T${h}:${m}:00`
      try {
        await crearHoraMedica({
          medicoId: uid,
          nombreMedico: `${user.nombre} ${user.apellido || ''}`.trim(),
          especialidad: espSel,
          fechaHora,
          duracionMinutos: duracion,
        })
        creadas++
      } catch {}
    }

    setMsg(`${creadas} horas habilitadas para el ${new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL')}`)
    setTimeout(() => setMsg(''), 4000)
    cargar()
    setHabilitando(false)
  }

  const estadoDia = () => {
    const total = SLOTS.length
    const habilitadas = SLOTS.filter(s => getSlotStatus(s) !== 'sin-habilitar').length
    const ocupadas = SLOTS.filter(s => getSlotStatus(s) === 'ocupada').length
    return { total, habilitadas, ocupadas, disponibles: habilitadas - ocupadas }
  }

  const stats = estadoDia()

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mi Agenda</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona tu disponibilidad diaria (7:00 – 18:00)</p>
      </div>

      {/* Controles */}
      <div className="card mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Fecha</label>
            <input type="date" className="input" value={fecha}
              onChange={e => setFecha(e.target.value)} />
          </div>
          <div>
            <label className="label">Especialidad</label>
            <select className="input" value={espSel} onChange={e => setEspSel(e.target.value)}>
              {especialidades.length === 0
                ? <option value="">Sin especialidades asignadas</option>
                : especialidades.map(e => <option key={e.nombre} value={e.nombre}>{e.nombre}</option>)
              }
            </select>
          </div>
          <div>
            <label className="label">Duración por hora</label>
            <select className="input" value={duracion} onChange={e => setDuracion(Number(e.target.value))}>
              <option value={15}>15 min</option>
              <option value={20}>20 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>
        </div>

        {especialidades.length === 0 ? (
          <p className="text-yellow-600 text-xs bg-yellow-50 rounded px-3 py-2">
            No tienes especialidades asignadas. Pide al administrador que te asigne una.
          </p>
        ) : (
          <button
            onClick={habilitarDia}
            disabled={habilitando || especialidades.length === 0}
            className="w-full sm:w-auto btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            <Zap size={15} />
            {habilitando ? 'Habilitando...' : `Habilitar todas las horas del ${new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}`}
          </button>
        )}

        {msg && <p className="mt-3 text-sm text-blue-700 bg-blue-50 rounded px-3 py-2">{msg}</p>}
      </div>

      {/* Resumen del día */}
      {stats.habilitadas > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="card text-center py-3">
            <p className="text-2xl font-bold text-gray-800">{stats.disponibles}</p>
            <p className="text-xs text-gray-500 mt-0.5">Disponibles</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-2xl font-bold text-red-500">{stats.ocupadas}</p>
            <p className="text-xs text-gray-500 mt-0.5">Ocupadas</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-2xl font-bold text-blue-600">{stats.habilitadas}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total habilitadas</p>
          </div>
        </div>
      )}

      {/* Grilla */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-blue-600" />
          <h2 className="text-base font-semibold text-gray-700 capitalize">
            {new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {espSel && <span className="text-blue-600"> — {espSel}</span>}
          </h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {SLOTS.map(slot => {
            const status = getSlotStatus(slot)
            return (
              <div key={slot} className={`rounded-xl p-3 text-center border-2 ${
                status === 'ocupada'       ? 'bg-red-50 border-red-200' :
                status === 'disponible'    ? 'bg-green-50 border-green-200' :
                'bg-gray-50 border-gray-100'
              }`}>
                <p className={`text-sm font-bold ${
                  status === 'ocupada'    ? 'text-red-500' :
                  status === 'disponible' ? 'text-green-600' :
                  'text-gray-300'
                }`}>{slot}</p>
                {status === 'ocupada'    && <XCircle size={12} className="text-red-400 mx-auto mt-1" />}
                {status === 'disponible' && <CheckCircle size={12} className="text-green-500 mx-auto mt-1" />}
                {status === 'sin-habilitar' && <Clock size={12} className="text-gray-200 mx-auto mt-1" />}
              </div>
            )
          })}
        </div>

        {/* Leyenda */}
        <div className="flex gap-5 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-3 rounded bg-green-200 border border-green-300" /> Disponible
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-3 rounded bg-red-200 border border-red-300" /> Ocupada
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" /> Sin habilitar
          </div>
        </div>
      </div>
    </Layout>
  )
}
