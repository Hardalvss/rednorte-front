import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Modal from '../../components/Modal'
import {
  getEspecialidades, createEspecialidad, updateEspecialidad, deleteEspecialidad,
  asociarMedicoEspecialidad, desasociarMedicoEspecialidad, getUsuarios
} from '../../services/api'
import { Plus, Pencil, Trash2, UserPlus, UserMinus, Stethoscope, AlertCircle, CheckCircle } from 'lucide-react'

const EMPTY_ESP = { nombre: '', descripcion: '' }

export default function EspecialidadesAdmin() {
  const [especialidades, setEspecialidades] = useState([])
  const [medicos, setMedicos] = useState([])
  const [modalEsp, setModalEsp] = useState(false)
  const [modalMedicos, setModalMedicos] = useState(false)
  const [editando, setEditando] = useState(null)
  const [espSeleccionada, setEspSeleccionada] = useState(null)
  const [form, setForm] = useState(EMPTY_ESP)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ tipo: '', texto: '' })

  const cargar = () => {
    getEspecialidades().then(r => setEspecialidades(r.data)).catch(() => {})
    getUsuarios().then(r => setMedicos(r.data.filter(u => u.rol === 'MEDICO'))).catch(() => {})
  }

  useEffect(() => { cargar() }, [])

  const showMsg = (tipo, texto) => {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg({ tipo: '', texto: '' }), 3000)
  }

  // ── Crear / Editar especialidad ──────────────────────
  const abrirCrear = () => { setEditando(null); setForm(EMPTY_ESP); setModalEsp(true) }
  const abrirEditar = (e) => { setEditando(e); setForm({ nombre: e.nombre, descripcion: e.descripcion || '' }); setModalEsp(true) }

  const guardarEsp = async (ev) => {
    ev.preventDefault()
    setLoading(true)
    try {
      if (editando) await updateEspecialidad(editando.id, form)
      else await createEspecialidad(form)
      setModalEsp(false)
      cargar()
      showMsg('ok', editando ? 'Especialidad actualizada.' : 'Especialidad creada.')
    } catch (err) {
      showMsg('err', err.response?.data?.message || 'Error al guardar.')
    } finally { setLoading(false) }
  }

  const eliminar = async (e) => {
    if (!confirm(`¿Eliminar la especialidad "${e.nombre}"?`)) return
    try {
      await deleteEspecialidad(e.id)
      cargar()
      showMsg('ok', 'Especialidad eliminada.')
    } catch {
      showMsg('err', 'No se pudo eliminar.')
    }
  }

  // ── Asociar / Desasociar médicos ─────────────────────
  const abrirMedicos = (e) => { setEspSeleccionada(e); setModalMedicos(true) }

  const asociar = async (medicoId) => {
    try {
      await asociarMedicoEspecialidad(espSeleccionada.id, medicoId)
      const res = await getEspecialidades()
      setEspecialidades(res.data)
      setEspSeleccionada(res.data.find(e => e.id === espSeleccionada.id))
    } catch (err) {
      showMsg('err', err.response?.data?.message || 'Error al asociar.')
    }
  }

  const desasociar = async (medicoId) => {
    try {
      await desasociarMedicoEspecialidad(espSeleccionada.id, medicoId)
      const res = await getEspecialidades()
      setEspecialidades(res.data)
      setEspSeleccionada(res.data.find(e => e.id === espSeleccionada.id))
    } catch {
      showMsg('err', 'Error al desasociar.')
    }
  }

  const medicosAsociados = espSeleccionada
    ? medicos.filter(m => espSeleccionada.medicoIds?.some(id => Number(id) === Number(m.id)))
    : []
  const medicosDisponibles = espSeleccionada
    ? medicos.filter(m => !espSeleccionada.medicoIds?.some(id => Number(id) === Number(m.id)))
    : []

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Especialidades</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona las especialidades médicas y sus médicos asignados</p>
        </div>
        <button onClick={abrirCrear} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Nueva Especialidad
        </button>
      </div>

      {/* Mensajes */}
      {msg.texto && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 mb-4 text-sm border ${
          msg.tipo === 'ok'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {msg.tipo === 'ok' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {msg.texto}
        </div>
      )}

      {/* Lista de especialidades */}
      {especialidades.length === 0 ? (
        <div className="card text-center py-14">
          <Stethoscope size={42} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No hay especialidades creadas aún.</p>
          <button onClick={abrirCrear} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={14} /> Crear primera especialidad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {especialidades.map(e => (
            <div key={e.id} className="card flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Stethoscope size={15} className="text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800">{e.nombre}</h3>
                  </div>
                  {e.descripcion && (
                    <p className="text-xs text-gray-500 mt-1 ml-10">{e.descripcion}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => abrirEditar(e)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => eliminar(e)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Médicos asociados */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Médicos asignados ({e.medicoIds?.length || 0})
                </p>
                {e.medicoIds?.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {e.medicoIds.map(mid => {
                      const m = medicos.find(x => x.id === mid)
                      return m ? (
                        <span key={mid} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                          {m.nombre} {m.apellido}
                        </span>
                      ) : null
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Sin médicos asignados</p>
                )}
              </div>

              {/* Botón gestionar médicos */}
              <button
                onClick={() => abrirMedicos(e)}
                className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 border border-blue-200 rounded-lg py-2 hover:bg-blue-50 transition-colors"
              >
                <UserPlus size={14} /> Gestionar médicos
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar especialidad */}
      <Modal isOpen={modalEsp} onClose={() => setModalEsp(false)} title={editando ? 'Editar Especialidad' : 'Nueva Especialidad'}>
        <form onSubmit={guardarEsp} className="space-y-4">
          <div>
            <label className="label">Nombre de la especialidad</label>
            <input
              className="input"
              placeholder="Ej: Cardiología"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Descripción (opcional)</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Breve descripción de la especialidad..."
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModalEsp(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal gestionar médicos */}
      <Modal
        isOpen={modalMedicos}
        onClose={() => setModalMedicos(false)}
        title={`Médicos — ${espSeleccionada?.nombre}`}
      >
        <div className="space-y-4">
          {/* Médicos asignados */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Médicos asignados</p>
            {medicosAsociados.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Ninguno asignado aún.</p>
            ) : (
              <div className="space-y-2">
                {medicosAsociados.map(m => (
                  <div key={m.id} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.nombre} {m.apellido}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </div>
                    <button
                      onClick={() => desasociar(m.id)}
                      className="flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      <UserMinus size={13} /> Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Médicos disponibles para agregar */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Agregar médico</p>
            {medicosDisponibles.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Todos los médicos ya están asignados.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {medicosDisponibles.map(m => (
                  <div key={m.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.nombre} {m.apellido}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </div>
                    <button
                      onClick={() => asociar(m.id)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                      <UserPlus size={13} /> Asignar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
