import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import {
  getUsuarios, createUsuario, updateUsuario, deleteUsuario,
  getEspecialidades, createEspecialidad,
  asociarMedicoEspecialidad, desasociarMedicoEspecialidad,
  upsertHorarioMedico, getPlantillasPorMedico
} from '../../services/api'
import { CalendarClock, CheckCircle, AlertCircle, Plus, X } from 'lucide-react'

const EMPTY_FORM = {
  nombre: '', apellido: '', rut: '', email: '', password: '',
  telefono: '', rol: 'PACIENTE', fechaNacimiento: ''
}

const calcEdad = (fechaNac) => {
  if (!fechaNac) return null
  const d = new Date(fechaNac)
  if (Number.isNaN(d.getTime())) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - d.getFullYear()
  const m = hoy.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) edad--
  return edad
}

const EMPTY_HORARIO = {
  especialidadId: '',
  horaInicio: '08:00',
  horaFin: '18:00',
  duracionMinutos: 30,
  semanasAdelante: 4,
  diasSemana: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
}

const DIAS = [
  { value: 'MONDAY',    label: 'Lun' },
  { value: 'TUESDAY',   label: 'Mar' },
  { value: 'WEDNESDAY', label: 'Mié' },
  { value: 'THURSDAY',  label: 'Jue' },
  { value: 'FRIDAY',    label: 'Vie' },
  { value: 'SATURDAY',  label: 'Sáb' },
  { value: 'SUNDAY',    label: 'Dom' }
]

const FILTROS = ['TODOS', 'MEDICO', 'PACIENTE', 'ADMIN']

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [filtro, setFiltro] = useState('TODOS')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [horario, setHorario] = useState(EMPTY_HORARIO)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [creandoEsp, setCreandoEsp] = useState(false)
  const [nuevaEsp, setNuevaEsp] = useState({ nombre: '', descripcion: '' })

  const cargar = () => {
    getUsuarios().then(r => setUsuarios(r.data))
    getEspecialidades().then(r => setEspecialidades(r.data)).catch(() => {})
  }
  useEffect(() => { cargar() }, [])

  const usuariosFiltrados = filtro === 'TODOS'
    ? usuarios
    : usuarios.filter(u => u.rol === filtro)

  const especialidadIdDeMedico = (u) => {
    const e = especialidades.find(esp => esp.medicoIds?.some(id => Number(id) === Number(u.id)))
    return e ? String(e.id) : ''
  }

  const abrirCrear = () => {
    setEditando(null)
    setForm(EMPTY_FORM)
    setHorario(EMPTY_HORARIO)
    setError(''); setAviso('')
    setModal(true)
  }

  const abrirEditar = async (u) => {
    setEditando(u)
    setForm({
      ...u,
      password: '',
      fechaNacimiento: u.fechaNacimiento ? String(u.fechaNacimiento).substring(0, 10) : ''
    })
    setError(''); setAviso('')
    if (u.rol === 'MEDICO') {
      let h = { ...EMPTY_HORARIO, especialidadId: especialidadIdDeMedico(u) }
      try {
        const r = await getPlantillasPorMedico(u.id)
        if (r.data && r.data.length > 0) {
          const p = r.data[0]
          h = {
            especialidadId: h.especialidadId,
            horaInicio: p.horaInicio?.slice(0, 5) || '08:00',
            horaFin: p.horaFin?.slice(0, 5) || '18:00',
            duracionMinutos: p.duracionMinutos,
            semanasAdelante: p.semanasAdelante,
            diasSemana: p.diasSemana || []
          }
        }
      } catch {}
      setHorario(h)
    } else {
      setHorario(EMPTY_HORARIO)
    }
    setModal(true)
  }

  const crearEspecialidadInline = async () => {
    if (!nuevaEsp.nombre.trim()) { setError('El nombre de la especialidad es obligatorio'); return }
    setError('')
    try {
      const r = await createEspecialidad({ nombre: nuevaEsp.nombre.trim(), descripcion: nuevaEsp.descripcion.trim() })
      const lista = await getEspecialidades()
      setEspecialidades(lista.data)
      setHorario(prev => ({ ...prev, especialidadId: String(r.data.id) }))
      setNuevaEsp({ nombre: '', descripcion: '' })
      setCreandoEsp(false)
      setAviso('Especialidad creada')
      setTimeout(() => setAviso(''), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear la especialidad')
    }
  }

  const toggleDia = (dia) => {
    setHorario(prev => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter(d => d !== dia)
        : [...prev.diasSemana, dia]
    }))
  }

  const validarMedico = () => {
    if (form.rol !== 'MEDICO') return null
    if (!horario.especialidadId) return 'Selecciona una especialidad para el médico'
    if (!horario.diasSemana || horario.diasSemana.length === 0) return 'Selecciona al menos un día de atención'
    if (!horario.horaInicio || !horario.horaFin) return 'Define hora de inicio y fin'
    if (horario.horaFin <= horario.horaInicio) return 'La hora de fin debe ser posterior a la de inicio'
    return null
  }

  const sincronizarEspecialidad = async (medicoId) => {
    const espNuevaId = Number(horario.especialidadId)
    const espAnterior = especialidades.find(e => e.medicoIds?.some(id => Number(id) === Number(medicoId)))
    if (espAnterior && Number(espAnterior.id) !== espNuevaId) {
      try { await desasociarMedicoEspecialidad(espAnterior.id, medicoId) } catch {}
    }
    if (!espAnterior || Number(espAnterior.id) !== espNuevaId) {
      try { await asociarMedicoEspecialidad(espNuevaId, medicoId) } catch {}
    }
  }

  const generarHorario = async (medicoId, nombreCompleto, especialidadNombre) => {
    await upsertHorarioMedico({
      medicoId,
      nombreMedico: nombreCompleto,
      especialidad: especialidadNombre,
      horaInicio: horario.horaInicio.length === 5 ? `${horario.horaInicio}:00` : horario.horaInicio,
      horaFin: horario.horaFin.length === 5 ? `${horario.horaFin}:00` : horario.horaFin,
      duracionMinutos: Number(horario.duracionMinutos),
      semanasAdelante: Number(horario.semanasAdelante),
      diasSemana: horario.diasSemana
    })
  }

  const guardar = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setAviso('')

    const errMedico = validarMedico()
    if (errMedico) { setError(errMedico); setLoading(false); return }

    try {
      let usuarioGuardado
      if (editando) {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        const r = await updateUsuario(editando.id, payload)
        usuarioGuardado = r.data
      } else {
        const r = await createUsuario(form)
        usuarioGuardado = r.data
      }

      if (form.rol === 'MEDICO') {
        await sincronizarEspecialidad(usuarioGuardado.id)
        const espSel = especialidades.find(esp => String(esp.id) === String(horario.especialidadId))
        const nombreCompleto = `${form.nombre} ${form.apellido}`.trim()
        await generarHorario(usuarioGuardado.id, nombreCompleto, espSel?.nombre || '')
        setAviso('Médico guardado y horario generado.')
      } else {
        setAviso(editando ? 'Usuario actualizado.' : 'Usuario creado.')
      }

      setTimeout(() => { setModal(false); cargar() }, 600)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar. Verifica los datos.')
    } finally { setLoading(false) }
  }

  const eliminar = async (u) => {
    if (!confirm(`¿Eliminar a ${u.nombre} ${u.apellido}?`)) return
    await deleteUsuario(u.id)
    cargar()
  }

  const rolBadge = (v) => {
    const cls = {
      ADMIN:    'bg-purple-100 text-purple-700',
      MEDICO:   'bg-blue-100 text-blue-700',
      PACIENTE: 'bg-green-100 text-green-700',
    }
    return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cls[v] || ''}`}>{v}</span>
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre', render: (v, row) => `${v} ${row.apellido}` },
    { key: 'rut', label: 'RUT' },
    { key: 'email', label: 'Email' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'rol', label: 'Rol', render: rolBadge },
  ]

  const conteo = {
    TODOS: usuarios.length,
    MEDICO: usuarios.filter(u => u.rol === 'MEDICO').length,
    PACIENTE: usuarios.filter(u => u.rol === 'PACIENTE').length,
    ADMIN: usuarios.filter(u => u.rol === 'ADMIN').length,
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">{usuariosFiltrados.length} usuarios</p>
        </div>
        <button onClick={abrirCrear} className="btn-primary w-full sm:w-auto">+ Nuevo Usuario</button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filtro === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {f === 'TODOS' ? 'Todos' : f.charAt(0) + f.slice(1).toLowerCase()}
            <span className="ml-1.5 text-xs opacity-75">({conteo[f]})</span>
          </button>
        ))}
      </div>

      <div className="card">
        <Table columns={columns} data={usuariosFiltrados} onEdit={abrirEditar} onDelete={eliminar} />
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editando ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <form onSubmit={guardar} className="space-y-3">
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-2.5 text-sm flex items-start gap-2">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
            </div>
          )}
          {aviso && (
            <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-2.5 text-sm flex items-start gap-2">
              <CheckCircle size={15} className="mt-0.5 shrink-0" />{aviso}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label">Nombre</label><input className="input" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required /></div>
            <div><label className="label">Apellido</label><input className="input" value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} required /></div>
          </div>
          <div><label className="label">RUT</label><input className="input" placeholder="12345678-9" value={form.rut} onChange={e => setForm({...form, rut: e.target.value})} required /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
          <div><label className="label">{editando ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label><input type="password" className="input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editando} /></div>
          <div><label className="label">Teléfono</label><input className="input" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} required /></div>
          <div>
            <label className="label">
              Fecha de nacimiento
              {form.fechaNacimiento && (() => {
                const e = calcEdad(form.fechaNacimiento)
                if (e === null) return null
                return (
                  <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${e >= 70 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                    {e} años{e >= 70 ? ' · Adulto mayor' : ''}
                  </span>
                )
              })()}
            </label>
            <input
              type="date"
              className="input"
              value={form.fechaNacimiento}
              onChange={e => setForm({...form, fechaNacimiento: e.target.value})}
            />
            <p className="text-xs text-gray-500 mt-1">Pacientes de 70+ años obtienen prioridad ALTA automáticamente.</p>
          </div>
          <div>
            <label className="label">Rol</label>
            <select className="input" value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}>
              <option value="PACIENTE">PACIENTE</option>
              <option value="MEDICO">MEDICO</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          {form.rol === 'MEDICO' && (
            <div className="mt-5 pt-4 border-t border-gray-200 space-y-3">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <CalendarClock size={18} />
                <h3 className="font-semibold text-sm">Especialidad y horario de atención</h3>
              </div>
              <p className="text-xs text-gray-500">Define cuándo atiende el médico. Las horas disponibles se generarán automáticamente al guardar.</p>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Especialidad</label>
                  {!creandoEsp ? (
                    <button type="button" onClick={() => setCreandoEsp(true)} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                      <Plus size={12} /> Nueva especialidad
                    </button>
                  ) : (
                    <button type="button" onClick={() => { setCreandoEsp(false); setNuevaEsp({ nombre: '', descripcion: '' }) }} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                      <X size={12} /> Cancelar
                    </button>
                  )}
                </div>

                {!creandoEsp ? (
                  <select className="input" value={horario.especialidadId} onChange={e => setHorario({ ...horario, especialidadId: e.target.value })} required>
                    <option value="">Seleccionar especialidad…</option>
                    {especialidades.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                ) : (
                  <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 space-y-2">
                    <input
                      className="input"
                      placeholder="Nombre (ej: Cardiología)"
                      value={nuevaEsp.nombre}
                      onChange={e => setNuevaEsp({ ...nuevaEsp, nombre: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder="Descripción (opcional)"
                      value={nuevaEsp.descripcion}
                      onChange={e => setNuevaEsp({ ...nuevaEsp, descripcion: e.target.value })}
                    />
                    <button type="button" onClick={crearEspecialidadInline} className="btn-primary w-full">
                      Crear especialidad
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Hora inicio</label>
                  <input type="time" className="input" value={horario.horaInicio} onChange={e => setHorario({ ...horario, horaInicio: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Hora fin</label>
                  <input type="time" className="input" value={horario.horaFin} onChange={e => setHorario({ ...horario, horaFin: e.target.value })} required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Duración por cita (min)</label>
                  <input type="number" min="5" max="240" className="input" value={horario.duracionMinutos} onChange={e => setHorario({ ...horario, duracionMinutos: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Semanas a generar</label>
                  <input type="number" min="1" max="12" className="input" value={horario.semanasAdelante} onChange={e => setHorario({ ...horario, semanasAdelante: e.target.value })} required />
                </div>
              </div>

              <div>
                <label className="label">Días de atención</label>
                <div className="flex flex-wrap gap-2">
                  {DIAS.map(d => (
                    <button
                      type="button"
                      key={d.value}
                      onClick={() => toggleDia(d.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        horario.diasSemana.includes(d.value)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'Guardando…' : form.rol === 'MEDICO' ? 'Guardar y generar horas' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
