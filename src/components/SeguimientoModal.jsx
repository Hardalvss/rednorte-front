import { useEffect, useState } from 'react'
import Modal from './Modal'
import { useAuth } from '../context/AuthContext'
import {
  getSeguimientos, crearSeguimiento, registrarEvento,
  getCitasPorPaciente, atenderCitaAgenda,
  getListaEspera, asignarListaEspera
} from '../services/api'
import {
  CheckCircle, AlertCircle, FileText, Activity, Pill, NotebookPen, Clock, RefreshCw
} from 'lucide-react'

const ESTADOS = [
  { key: 'EN_ESPERA',      label: 'En espera' },
  { key: 'EN_TRATAMIENTO', label: 'En tratamiento' },
  { key: 'EN_SEGUIMIENTO', label: 'En seguimiento' },
  { key: 'ALTA',           label: 'Alta' },
  { key: 'DERIVADO',       label: 'Derivado' }
]

const TIPOS = [
  { key: 'DIAGNOSTICO', label: 'Diagnóstico',  icon: FileText,    color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  { key: 'INDICACION',  label: 'Indicación',   icon: Activity,    color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  { key: 'MEDICAMENTO', label: 'Medicamento',  icon: Pill,        color: 'text-pink-700', bg: 'bg-pink-50 border-pink-200' },
  { key: 'EVOLUCION',   label: 'Evolución',    icon: Activity,    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  { key: 'NOTA',        label: 'Nota',         icon: NotebookPen, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' }
]

const TIPO_BADGE = {
  DIAGNOSTICO: 'bg-blue-100 text-blue-700',
  INDICACION: 'bg-purple-100 text-purple-700',
  MEDICAMENTO: 'bg-pink-100 text-pink-700',
  EVOLUCION: 'bg-emerald-100 text-emerald-700',
  CAMBIO_ESTADO: 'bg-green-100 text-green-700',
  NOTA: 'bg-gray-100 text-gray-700'
}

export default function SeguimientoModal({
  isOpen, onClose, paciente, especialidad, onUpdated
}) {
  const { user } = useAuth()
  const [seguimiento, setSeguimiento] = useState(null)
  const [creando, setCreando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ tipo: 'EVOLUCION', descripcion: '', estadoNuevo: '' })
  const [msg, setMsg] = useState({ tipo: '', texto: '' })

  const flash = (tipo, texto) => {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg({ tipo: '', texto: '' }), 3000)
  }

  const cargar = async () => {
    if (!isOpen || !paciente?.id) return
    setLoading(true)
    try {
      const r = await getSeguimientos()
      const mio = (r.data || []).find(s =>
        Number(s.pacienteId) === Number(paciente.id) &&
        (!especialidad || s.especialidad?.toLowerCase() === especialidad.toLowerCase())
      )
      setSeguimiento(mio || null)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [isOpen, paciente?.id, especialidad])

  useEffect(() => {
    if (!isOpen) {
      setSeguimiento(null); setCreando(false)
      setForm({ tipo: 'EVOLUCION', descripcion: '', estadoNuevo: '' })
    }
  }, [isOpen])

  const crearInicial = async () => {
    if (!paciente?.id || !especialidad) return
    setLoading(true)
    try {
      await crearSeguimiento({
        pacienteId: Number(paciente.id),
        nombrePaciente: paciente.nombre,
        rutPaciente: paciente.rut || 'Sin RUT',
        especialidad
      })
      await cargar()
      flash('ok', 'Seguimiento creado.')
    } catch (err) {
      flash('err', err.response?.data?.message || 'No se pudo crear el seguimiento.')
    } finally { setLoading(false) }
  }

  const cerrarFlujoAtencion = async () => {
    if (!paciente?.id || !seguimiento?.especialidad) return { citas: 0, lista: 0 }
    let citasAtendidas = 0
    let listaAsignada = 0
    try {
      const citasRes = await getCitasPorPaciente(paciente.id)
      const activas = (citasRes.data || []).filter(c =>
        ['CONFIRMADA', 'PENDIENTE', 'AGENDADA'].includes(c.estado) &&
        c.horaMedica?.especialidad?.toLowerCase() === seguimiento.especialidad.toLowerCase()
      )
      for (const c of activas) {
        try { await atenderCitaAgenda(c.id); citasAtendidas++ } catch {}
      }
    } catch {}
    try {
      const listaRes = await getListaEspera()
      const enEspera = (listaRes.data || []).filter(l =>
        Number(l.pacienteId) === Number(paciente.id) &&
        l.estado === 'EN_ESPERA' &&
        l.especialidad?.toLowerCase() === seguimiento.especialidad.toLowerCase()
      )
      for (const l of enEspera) {
        try { await asignarListaEspera(l.id); listaAsignada++ } catch {}
      }
    } catch {}
    return { citas: citasAtendidas, lista: listaAsignada }
  }

  const registrar = async (e) => {
    e.preventDefault()
    if (!seguimiento?.id) return
    if (form.descripcion.trim().length < 3) { flash('err', 'Describe al menos 3 caracteres'); return }
    setLoading(true)
    try {
      const payload = {
        tipo: form.tipo,
        descripcion: form.descripcion.trim(),
        registradoPor: `Dr(a). ${user.nombre} ${user.apellido || ''}`.trim()
      }
      if (form.estadoNuevo) payload.estadoNuevo = form.estadoNuevo
      await registrarEvento(seguimiento.id, payload)

      let cierreInfo = ''
      if (form.estadoNuevo === 'ALTA') {
        const cierre = await cerrarFlujoAtencion()
        const parts = []
        if (cierre.citas > 0) parts.push(`${cierre.citas} cita${cierre.citas > 1 ? 's' : ''} cerrada${cierre.citas > 1 ? 's' : ''}`)
        if (cierre.lista > 0) parts.push(`liberado de lista de espera`)
        if (parts.length > 0) cierreInfo = ` (${parts.join(' y ')})`
      }

      setForm({ tipo: 'EVOLUCION', descripcion: '', estadoNuevo: '' })
      await cargar()
      flash('ok', 'Evento registrado. El paciente recibirá una notificación.' + cierreInfo)
      onUpdated && onUpdated()
    } catch (err) {
      flash('err', err.response?.data?.message || 'No se pudo registrar el evento.')
    } finally { setLoading(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Seguimiento de ${paciente?.nombre || 'paciente'}`}>
      {msg.texto && (
        <div className={`mb-3 p-2.5 rounded-lg flex items-center gap-2 text-sm ${
          msg.tipo === 'ok' ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg.tipo === 'ok' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {msg.texto}
        </div>
      )}

      {!seguimiento && !loading && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm mb-4">
            {paciente?.nombre} aún no tiene un historial de seguimiento{especialidad ? ` para ${especialidad}` : ''}.
          </p>
          <button onClick={crearInicial} className="btn-primary">Crear seguimiento</button>
        </div>
      )}

      {seguimiento && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <p className="text-xs uppercase text-gray-500">Especialidad</p>
              <p className="font-semibold text-gray-800 capitalize">{seguimiento.especialidad}</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
              {seguimiento.estadoActual?.replace('_', ' ')}
            </span>
          </div>

          <details className="border border-gray-200 rounded-lg">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 px-3 py-2 flex items-center justify-between">
              <span>Historial ({seguimiento.eventos?.length || 0})</span>
              <Clock size={14} className="text-gray-400" />
            </summary>
            <div className="p-3 border-t border-gray-100 max-h-48 overflow-y-auto">
              {(!seguimiento.eventos || seguimiento.eventos.length === 0) ? (
                <p className="text-center text-gray-400 text-sm py-2">Sin eventos previos.</p>
              ) : (
                <ul className="space-y-2">
                  {seguimiento.eventos.map(ev => (
                    <li key={ev.id} className="bg-gray-50 rounded p-2">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${TIPO_BADGE[ev.tipo] || TIPO_BADGE.NOTA}`}>
                          {(ev.tipo || 'NOTA').replace('_', ' ')}
                        </span>
                        {ev.estadoNuevo && ev.estadoAnterior && ev.estadoNuevo !== ev.estadoAnterior && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                            {ev.estadoAnterior?.replace('_', ' ')} → {ev.estadoNuevo?.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-800">{ev.descripcion}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {ev.registradoPor || '—'} · {ev.fechaEvento ? new Date(ev.fechaEvento).toLocaleString('es-CL') : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>

          <form onSubmit={registrar} className="space-y-3 border-t border-gray-200 pt-4">
            <p className="text-sm font-semibold text-gray-700">Registrar nuevo evento</p>

            <div>
              <label className="label">Tipo</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TIPOS.map(t => {
                  const Icon = t.icon
                  const sel = form.tipo === t.key
                  return (
                    <button
                      type="button"
                      key={t.key}
                      onClick={() => setForm({ ...form, tipo: t.key })}
                      className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                        sel ? `${t.bg} ${t.color} border-current font-semibold` : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={14} className="mb-1" />
                      <p>{t.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="label">Descripción</label>
              <textarea
                className="input"
                rows={3}
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Ej: Paciente presenta mejora. Indicado seguir tratamiento por 2 semanas más."
                required
              />
            </div>

            <div>
              <label className="label">Cambiar estado (opcional)</label>
              <select
                className="input"
                value={form.estadoNuevo}
                onChange={e => setForm({ ...form, estadoNuevo: e.target.value })}
              >
                <option value="">Mantener "{seguimiento.estadoActual?.replace('_', ' ')}"</option>
                {ESTADOS.filter(s => s.key !== seguimiento.estadoActual).map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary">Cerrar</button>
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><RefreshCw size={14} className="animate-spin" /> Guardando…</> : 'Registrar evento'}
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  )
}
