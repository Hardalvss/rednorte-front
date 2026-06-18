import { useEffect, useState } from 'react'
import Modal from './Modal'
import { getHorasDisponibles, reprogramarCitaAgenda } from '../services/api'
import { Clock, AlertCircle, CalendarClock } from 'lucide-react'

const fmt = (iso) => new Date(iso).toLocaleString('es-CL', {
  weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
})

export default function ReprogramarModal({ cita, isOpen, onClose, onSuccess, solicitante = 'MEDICO' }) {
  const [horas, setHoras] = useState([])
  const [horaSel, setHoraSel] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !cita?.horaMedica?.especialidad) return
    setHoras([]); setHoraSel(null); setMotivo(''); setError('')
    getHorasDisponibles(cita.horaMedica.especialidad)
      .then(r => {
        const filtradas = (r.data || []).filter(h =>
          Number(h.medicoId) === Number(cita.horaMedica.medicoId) &&
          Number(h.id) !== Number(cita.horaMedica.id)
        )
        setHoras(filtradas)
      })
      .catch(() => setHoras([]))
  }, [isOpen, cita])

  const enviar = async (e) => {
    e.preventDefault()
    if (!horaSel) { setError('Selecciona una nueva hora'); return }
    if (motivo.trim().length < 5) { setError('El motivo debe tener al menos 5 caracteres'); return }
    setLoading(true); setError('')
    try {
      await reprogramarCitaAgenda(cita.id, {
        horaMedicaNuevaId: Number(horaSel.id),
        motivo: motivo.trim(),
        solicitante
      })
      onSuccess && onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo reprogramar la cita')
    } finally { setLoading(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reprogramar cita">
      <form onSubmit={enviar} className="space-y-4">
        {cita?.horaMedica && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-xs text-gray-500 mb-0.5">Cita actual</p>
            <p className="font-medium text-gray-800">{cita.nombrePaciente}</p>
            <p className="text-gray-600 capitalize">{fmt(cita.horaMedica.fechaHora)}</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
            <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <div>
          <label className="label flex items-center gap-1.5">
            <CalendarClock size={14} /> Nueva hora disponible
          </label>
          {horas.length === 0 ? (
            <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-3 text-center">
              No hay otras horas disponibles para esta especialidad.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
              {horas.map(h => (
                <button
                  type="button"
                  key={h.id}
                  onClick={() => setHoraSel(h)}
                  className={`p-2 rounded-lg border-2 text-left transition-colors ${
                    horaSel?.id === h.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <p className="text-[11px] text-gray-500 capitalize">
                    {new Date(h.fechaHora).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-base font-bold text-gray-800">
                    {new Date(h.fechaHora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={10} /> {h.duracionMinutos} min</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label">Motivo de la reprogramación</label>
          <textarea
            className="input"
            rows={3}
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Ej: Emergencia médica, conflicto de agenda..."
            required
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading || !horaSel} className="btn-primary disabled:opacity-60">
            {loading ? 'Enviando…' : 'Solicitar reprogramación'}
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center">
          {solicitante === 'PACIENTE'
            ? 'El médico recibirá una notificación y deberá aceptar el cambio.'
            : 'El paciente recibirá una notificación y deberá aceptar el cambio.'}
        </p>
      </form>
    </Modal>
  )
}
