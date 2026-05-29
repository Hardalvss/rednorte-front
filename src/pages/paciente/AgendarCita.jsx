import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import {
  getEspecialidades, getUsuarios,
  getHorasDisponibles, agendarCita, crearSeguimiento, registrarEvento, agregarListaEspera
} from '../../services/api'
import {
  Stethoscope, User, Clock, CheckCircle, ChevronRight, ChevronLeft, AlertCircle, Search
} from 'lucide-react'

const PASOS = ['Especialidad', 'Médico', 'Hora', 'Confirmar']

export default function AgendarCita() {
  const { user } = useAuth()
  const [paso, setPaso] = useState(0)
  const [especialidades, setEspecialidades] = useState([])
  const [medicos, setMedicos] = useState([])
  const [horas, setHoras] = useState([])
  const [espSel, setEspSel] = useState(null)
  const [medicoSel, setMedicoSel] = useState(null)
  const [horaSel, setHoraSel] = useState(null)
  const [observaciones, setObservaciones] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)      // 'cita' | 'espera'
  const [error, setError] = useState('')

  useEffect(() => {
    getEspecialidades().then(r => setEspecialidades(r.data)).catch(() => {})
    getUsuarios().then(r => setMedicos(r.data.filter(u => u.rol === 'MEDICO'))).catch(() => {})
  }, [])

  useEffect(() => {
    if (espSel && medicoSel) {
      getHorasDisponibles(espSel.nombre)
        .then(r => {
          const filtradas = r.data.filter(h => Number(h.medicoId) === Number(medicoSel.id))
          setHoras(filtradas)
        })
        .catch(() => setHoras([]))
    }
  }, [espSel, medicoSel])

  const medicosDeEsp = espSel ? medicos.filter(m => espSel.medicoIds?.some(id => Number(id) === Number(m.id))) : []

  const seleccionarEsp = (e) => { setEspSel(e); setMedicoSel(null); setHoraSel(null); setPaso(1) }
  const seleccionarMedico = (m) => { setMedicoSel(m); setHoraSel(null); setPaso(2) }
  const seleccionarHora = (h) => { setHoraSel(h); setPaso(3) }

  const confirmar = async () => {
    // Verificar que la sesión tiene todos los campos necesarios
    if (!user?.id) {
      setError('Tu sesión está desactualizada. Por favor cierra sesión y vuelve a ingresar.')
      return
    }

    setLoading(true); setError('')
    try {
      await agendarCita({
        horaMedicaId: Number(horaSel.id),
        pacienteId: Number(user.id),
        nombrePaciente: `${user.nombre} ${user.apellido || ''}`.trim(),
        rutPaciente: user.rut || 'Sin RUT',
        observaciones,
      })
      // Crear seguimiento
      try {
        const seg = await crearSeguimiento({
          pacienteId: user.id,
          nombrePaciente: `${user.nombre} ${user.apellido || ''}`.trim(),
          rutPaciente: user.rut || 'Sin RUT',
          especialidad: espSel.nombre,
        })
        await registrarEvento(seg.data.id, {
          descripcion: `Cita agendada con Dr. ${medicoSel.nombre} ${medicoSel.apellido} para el ${new Date(horaSel.fechaHora).toLocaleString('es-CL')}`,
          registradoPor: `${user.nombre} ${user.apellido || ''}`.trim(),
        })
      } catch { /* seguimiento no bloquea la cita */ }
      setExito('cita')
    } catch (err) {
      // 409: slot ya tomado → agregar a lista de espera automáticamente
      if (err.response?.status === 409) {
        try {
          await agregarListaEspera({
            pacienteId: user.id,
            nombrePaciente: `${user.nombre} ${user.apellido || ''}`.trim(),
            rutPaciente: user.rut || 'Sin RUT',
            especialidad: espSel.nombre,
            prioridad: 'MEDIA',
            observaciones: `Hora solicitada con Dr. ${medicoSel.nombre} ${medicoSel.apellido} el ${new Date(horaSel.fechaHora).toLocaleString('es-CL')} ya no estaba disponible.`,
          })
          setExito('espera')
        } catch {
          setError('La hora ya fue tomada y no pudimos agregarte a lista de espera. Intenta con otra hora.')
        }
      } else {
        const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.defaultMessage || 'Error al agendar. Intenta de nuevo.'
        setError(msg)
        console.error('Error agendar cita:', err.response?.status, err.response?.data)
      }
    } finally { setLoading(false) }
  }

  const reiniciar = () => {
    setEspSel(null); setMedicoSel(null); setHoraSel(null)
    setObservaciones(''); setExito(false); setError(''); setPaso(0); setBusqueda('')
  }

  if (exito === 'cita') {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-10 card text-center py-12">
          <CheckCircle size={52} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">¡Cita agendada!</h2>
          <p className="text-gray-500 text-sm mb-1">
            <span className="font-medium">{espSel?.nombre}</span> con <span className="font-medium">Dr. {medicoSel?.nombre} {medicoSel?.apellido}</span>
          </p>
          <p className="text-gray-500 text-sm mb-6">{new Date(horaSel?.fechaHora).toLocaleString('es-CL')}</p>
          <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-4 py-2 mb-6">
            Tu seguimiento médico ha sido iniciado. Puedes verlo en "Mi Seguimiento".
          </p>
          <button onClick={reiniciar} className="btn-primary">Agendar otra cita</button>
        </div>
      </Layout>
    )
  }

  if (exito === 'espera') {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-10 card text-center py-12">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Hora no disponible</h2>
          <p className="text-gray-500 text-sm mb-4">
            La hora que seleccionaste ya fue tomada por otro paciente.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-6 text-left">
            <p className="text-sm font-semibold text-yellow-800 mb-1">Te agregamos a la lista de espera</p>
            <p className="text-xs text-yellow-700">
              Especialidad: <span className="font-medium">{espSel?.nombre}</span><br/>
              En cuanto haya una hora disponible, serás contactado.
            </p>
          </div>
          <button onClick={reiniciar} className="btn-primary">Buscar otra hora</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Agendar Cita Médica</h1>
        <p className="text-gray-500 text-sm mt-1">Sigue los pasos para reservar tu hora</p>
      </div>

      <div className="flex items-center mb-8">
        {PASOS.map((p, i) => (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                i < paso ? 'bg-blue-600 border-blue-600 text-white' :
                i === paso ? 'border-blue-600 text-blue-600 bg-white' :
                'border-gray-300 text-gray-400 bg-white'}`}>
                {i < paso ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${i === paso ? 'text-blue-600' : i < paso ? 'text-blue-400' : 'text-gray-400'}`}>{p}</span>
            </div>
            {i < PASOS.length - 1 && <div className={`h-0.5 w-8 sm:w-14 mx-2 ${i < paso ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {paso === 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-4">Selecciona una especialidad</h2>

          {/* Barra de búsqueda */}
          <div className="relative mb-5 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Buscar especialidad... (ej: Cardiología)"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              autoFocus
            />
          </div>

          {especialidades.length === 0 ? (
            <p className="text-gray-400 text-center py-10">Cargando especialidades...</p>
          ) : (() => {
            const filtradas = especialidades.filter(e =>
              e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
              e.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
            )
            return busqueda.trim() === '' ? (
              <p className="text-gray-400 text-sm text-center py-8">Escribe para buscar una especialidad</p>
            ) : filtradas.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No se encontraron especialidades para "{busqueda}"</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtradas.map(e => (
                  <button key={e.id} onClick={() => seleccionarEsp(e)}
                    className="card text-left hover:border-blue-400 border-2 border-transparent transition-all hover:shadow-md group">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors flex-shrink-0">
                        <Stethoscope size={16} className="text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{e.nombre}</p>
                        {e.descripcion && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{e.descripcion}</p>}
                        <p className="text-xs text-blue-500 mt-1">{e.medicoIds?.length || 0} médico(s)</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
          })()}
        </div>
      )}

      {paso === 1 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setPaso(0)} className="text-blue-600 hover:text-blue-800"><ChevronLeft size={20} /></button>
            <h2 className="text-base font-semibold text-gray-700">Médicos — <span className="text-blue-600">{espSel?.nombre}</span></h2>
          </div>
          {medicosDeEsp.length === 0 ? (
            <div className="card text-center py-10">
              <User size={36} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500">No hay médicos asignados a esta especialidad.</p>
              <button onClick={() => setPaso(0)} className="btn-secondary mt-4">Volver</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {medicosDeEsp.map(m => (
                <button key={m.id} onClick={() => seleccionarMedico(m)}
                  className="card text-left hover:border-blue-400 border-2 border-transparent transition-all hover:shadow-md group">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{m.nombre?.[0]}{m.apellido?.[0]}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Dr. {m.nombre} {m.apellido}</p>
                      <p className="text-sm text-blue-600">{espSel?.nombre}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{m.email}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {paso === 2 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setPaso(1)} className="text-blue-600 hover:text-blue-800"><ChevronLeft size={20} /></button>
            <h2 className="text-base font-semibold text-gray-700">Horas disponibles — Dr. {medicoSel?.nombre} {medicoSel?.apellido}</h2>
          </div>
          {horas.length === 0 ? (
            <div className="card text-center py-10">
              <Clock size={36} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500">No hay horas disponibles para este médico.</p>
              <button onClick={() => setPaso(1)} className="btn-secondary mt-4">Volver</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {horas.map(h => (
                <button key={h.id} onClick={() => seleccionarHora(h)}
                  className="card text-left hover:border-blue-400 border-2 border-transparent transition-all hover:shadow-md">
                  <p className="text-xs text-gray-500 mb-1 capitalize">
                    {new Date(h.fechaHora).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-3xl font-bold text-blue-600 mb-1">
                    {new Date(h.fechaHora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11} /> {h.duracionMinutos} min</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {paso === 3 && (
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setPaso(2)} className="text-blue-600 hover:text-blue-800"><ChevronLeft size={20} /></button>
            <h2 className="text-base font-semibold text-gray-700">Confirmar cita</h2>
          </div>
          <div className="card mb-4 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center"><Stethoscope size={16} className="text-blue-600" /></div>
              <div><p className="text-xs text-gray-500">Especialidad</p><p className="font-semibold text-gray-800">{espSel?.nombre}</p></div>
            </div>
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">{medicoSel?.nombre?.[0]}{medicoSel?.apellido?.[0]}</span>
              </div>
              <div><p className="text-xs text-gray-500">Médico</p><p className="font-semibold text-gray-800">Dr. {medicoSel?.nombre} {medicoSel?.apellido}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center"><Clock size={16} className="text-green-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Fecha y hora</p>
                <p className="font-semibold text-gray-800 capitalize">
                  {new Date(horaSel?.fechaHora).toLocaleString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-gray-400">{horaSel?.duracionMinutos} minutos</p>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="label">Observaciones (opcional)</label>
            <textarea className="input" rows={3} placeholder="Motivo de la consulta o síntomas relevantes..."
              value={observaciones} onChange={e => setObservaciones(e.target.value)} />
          </div>
          <button onClick={confirmar} disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60 py-3">
            <CheckCircle size={16} />
            {loading ? 'Agendando...' : 'Confirmar Cita'}
          </button>
        </div>
      )}
    </Layout>
  )
}
