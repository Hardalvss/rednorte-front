import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Modal from '../../components/Modal'
import {
  getPlantillas, crearPlantilla, actualizarPlantilla,
  eliminarPlantilla, togglePlantilla, generarHorasPlantilla,
  getUsuarios, getEspecialidades
} from '../../services/api'
import { Plus, Calendar, Power, PowerOff, Trash2, Pencil, PlayCircle, CheckCircle, AlertCircle } from 'lucide-react'

const DIAS = [
  { value: 'MONDAY',    label: 'Lunes',     short: 'L' },
  { value: 'TUESDAY',   label: 'Martes',    short: 'M' },
  { value: 'WEDNESDAY', label: 'Miércoles', short: 'X' },
  { value: 'THURSDAY',  label: 'Jueves',    short: 'J' },
  { value: 'FRIDAY',    label: 'Viernes',   short: 'V' },
  { value: 'SATURDAY',  label: 'Sábado',    short: 'S' },
  { value: 'SUNDAY',    label: 'Domingo',   short: 'D' }
]

const EMPTY = {
  medicoId: '',
  nombreMedico: '',
  especialidad: '',
  horaInicio: '08:00',
  horaFin: '18:00',
  duracionMinutos: 30,
  semanasAdelante: 4,
  diasSemana: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
}

const fmt = (iso) => iso ? new Date(iso).toLocaleString('es-CL') : '—'

export default function PlantillasHorario() {
  const [plantillas, setPlantillas] = useState([])
  const [medicos, setMedicos] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ tipo: '', texto: '' })

  const cargar = () => {
    getPlantillas().then(r => setPlantillas(r.data)).catch(() => {})
    getUsuarios().then(r => setMedicos(r.data.filter(u => u.rol === 'MEDICO'))).catch(() => {})
    getEspecialidades().then(r => setEspecialidades(r.data)).catch(() => {})
  }

  useEffect(() => { cargar() }, [])

  const flashMsg = (tipo, texto) => {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg({ tipo: '', texto: '' }), 4000)
  }

  const abrirCrear = () => { setEditando(null); setForm(EMPTY); setModal(true) }
  const abrirEditar = (p) => {
    setEditando(p)
    setForm({
      medicoId: p.medicoId,
      nombreMedico: p.nombreMedico,
      especialidad: p.especialidad,
      horaInicio: p.horaInicio?.slice(0, 5) || '08:00',
      horaFin: p.horaFin?.slice(0, 5) || '18:00',
      duracionMinutos: p.duracionMinutos,
      semanasAdelante: p.semanasAdelante,
      diasSemana: p.diasSemana || []
    })
    setModal(true)
  }

  const seleccionarMedico = (id) => {
    const m = medicos.find(x => String(x.id) === String(id))
    setForm(prev => ({
      ...prev,
      medicoId: id,
      nombreMedico: m ? `${m.nombre} ${m.apellido}` : prev.nombreMedico
    }))
  }

  const toggleDia = (dia) => {
    setForm(prev => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter(d => d !== dia)
        : [...prev.diasSemana, dia]
    }))
  }

  const guardar = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        medicoId: Number(form.medicoId),
        duracionMinutos: Number(form.duracionMinutos),
        semanasAdelante: Number(form.semanasAdelante),
        horaInicio: form.horaInicio.length === 5 ? `${form.horaInicio}:00` : form.horaInicio,
        horaFin: form.horaFin.length === 5 ? `${form.horaFin}:00` : form.horaFin
      }
      if (editando) await actualizarPlantilla(editando.id, payload)
      else await crearPlantilla(payload)
      setModal(false)
      cargar()
      flashMsg('ok', editando ? 'Plantilla actualizada' : 'Plantilla creada')
    } catch (err) {
      flashMsg('err', err.response?.data?.message || 'Error al guardar la plantilla')
    } finally { setLoading(false) }
  }

  const eliminar = async (p) => {
    if (!confirm(`¿Eliminar la plantilla del Dr(a). ${p.nombreMedico}?`)) return
    try {
      await eliminarPlantilla(p.id)
      cargar()
      flashMsg('ok', 'Plantilla eliminada')
    } catch {
      flashMsg('err', 'No se pudo eliminar la plantilla')
    }
  }

  const toggle = async (p) => {
    try {
      await togglePlantilla(p.id)
      cargar()
    } catch {
      flashMsg('err', 'No se pudo cambiar el estado')
    }
  }

  const generar = async (p) => {
    try {
      const r = await generarHorasPlantilla(p.id)
      flashMsg('ok', `Se generaron ${r.data?.creadas ?? 0} horas médicas.`)
      cargar()
    } catch (err) {
      flashMsg('err', err.response?.data?.message || 'Error al generar las horas')
    }
  }

  const diasResumen = (dias) => {
    if (!dias || dias.length === 0) return '—'
    return DIAS.filter(d => dias.includes(d.value)).map(d => d.short).join(' ')
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Plantillas de Horario</h1>
          <p className="text-gray-500 text-sm mt-1">Define los horarios semanales de los médicos y genera sus horas automáticamente.</p>
        </div>
        <button onClick={abrirCrear} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
          <Plus size={15} /> Nueva Plantilla
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

      {plantillas.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aún no hay plantillas de horario creadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plantillas.map(p => (
            <div key={p.id} className="card flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">Dr(a). {p.nombreMedico}</h3>
                  <p className="text-xs text-gray-500 truncate">{p.especialidad}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                  p.activa ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {p.activa ? 'ACTIVA' : 'INACTIVA'}
                </span>
              </div>

              <dl className="text-sm space-y-1.5 mb-4">
                <div className="flex justify-between"><dt className="text-gray-500">Horario</dt><dd className="font-medium text-gray-800">{p.horaInicio?.slice(0,5)} – {p.horaFin?.slice(0,5)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Duración slot</dt><dd className="font-medium text-gray-800">{p.duracionMinutos} min</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Días</dt><dd className="font-medium text-gray-800">{diasResumen(p.diasSemana)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Semanas</dt><dd className="font-medium text-gray-800">{p.semanasAdelante}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Última generación</dt><dd className="font-medium text-gray-800 text-right text-xs">{fmt(p.ultimaGeneracion)}</dd></div>
              </dl>

              <div className="mt-auto pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                <button onClick={() => generar(p)} className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg">
                  <PlayCircle size={14} /> Generar
                </button>
                <button onClick={() => toggle(p)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title={p.activa ? 'Desactivar' : 'Activar'}>
                  {p.activa ? <PowerOff size={16} /> : <Power size={16} />}
                </button>
                <button onClick={() => abrirEditar(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar">
                  <Pencil size={16} />
                </button>
                <button onClick={() => eliminar(p)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editando ? 'Editar Plantilla' : 'Nueva Plantilla'}>
        <form onSubmit={guardar} className="space-y-3">
          <div>
            <label className="label">Médico</label>
            <select className="input" value={form.medicoId} onChange={e => seleccionarMedico(e.target.value)} required>
              <option value="">Seleccionar médico…</option>
              {medicos.map(m => (
                <option key={m.id} value={m.id}>Dr(a). {m.nombre} {m.apellido}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Especialidad</label>
            <select className="input" value={form.especialidad} onChange={e => setForm({ ...form, especialidad: e.target.value })} required>
              <option value="">Seleccionar especialidad…</option>
              {especialidades.map(e => (
                <option key={e.id} value={e.nombre}>{e.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Hora inicio</label>
              <input type="time" className="input" value={form.horaInicio} onChange={e => setForm({ ...form, horaInicio: e.target.value })} required />
            </div>
            <div>
              <label className="label">Hora fin</label>
              <input type="time" className="input" value={form.horaFin} onChange={e => setForm({ ...form, horaFin: e.target.value })} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Duración por cita (min)</label>
              <input type="number" min="5" max="240" className="input" value={form.duracionMinutos} onChange={e => setForm({ ...form, duracionMinutos: e.target.value })} required />
            </div>
            <div>
              <label className="label">Semanas a generar</label>
              <input type="number" min="1" max="12" className="input" value={form.semanasAdelante} onChange={e => setForm({ ...form, semanasAdelante: e.target.value })} required />
            </div>
          </div>

          <div>
            <label className="label">Días de la semana</label>
            <div className="flex flex-wrap gap-2">
              {DIAS.map(d => (
                <button
                  type="button"
                  key={d.value}
                  onClick={() => toggleDia(d.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.diasSemana.includes(d.value)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">{loading ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
