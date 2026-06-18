import axios from 'axios'

const API_URL = 'http://localhost:8080'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Adjunta el token JWT en cada request automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el token expira, redirige al login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── AUTH ──────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const register = (data) =>
  api.post('/auth/register', data)

// ── USUARIOS ──────────────────────────────────────────
export const getUsuarios = () => api.get('/api/usuarios')
export const getUsuarioById = (id) => api.get(`/api/usuarios/${id}`)
export const createUsuario = (data) => api.post('/api/usuarios', data)
export const updateUsuario = (id, data) => api.put(`/api/usuarios/${id}`, data)
export const deleteUsuario = (id) => api.delete(`/api/usuarios/${id}`)

// ── AGENDA MÉDICA (citas) ─────────────────────────────
export const getCitas = () => api.get('/agenda/api/citas')
export const getCitaById = (id) => api.get(`/agenda/api/citas/${id}`)
export const getCitasPorPaciente = (id) => api.get(`/agenda/api/citas/paciente/${id}`)
export const getCitasPorMedico = (id) => api.get(`/agenda/api/citas/medico/${id}`)
export const agendarCita = (data) => api.post('/agenda/api/citas', data)
export const cancelarCitaAgenda = (id) => api.patch(`/agenda/api/citas/${id}/cancelar`)
export const confirmarCitaAgenda = (id) => api.patch(`/agenda/api/citas/${id}/confirmar`)
export const atenderCitaAgenda = (id) => api.patch(`/agenda/api/citas/${id}/atender`)
export const reprogramarCitaAgenda = (id, data) => api.patch(`/agenda/api/citas/${id}/reprogramar`, data)
export const aceptarReprogramacionAgenda = (id) => api.patch(`/agenda/api/citas/${id}/aceptar-reprogramacion`)
export const rechazarReprogramacionAgenda = (id) => api.patch(`/agenda/api/citas/${id}/rechazar-reprogramacion`)
export const getCitasPendientesMedico = (id) => api.get(`/agenda/api/citas/medico/${id}/pendientes`)

// ── HORAS MÉDICAS ─────────────────────────────────────
export const getHorasDisponibles = (especialidad) =>
  api.get('/agenda/api/horas-medicas', { params: especialidad ? { especialidad } : {} })
export const getTodasHoras = () => api.get('/agenda/api/horas-medicas/todas')
export const getHoraMedicaById = (id) => api.get(`/agenda/api/horas-medicas/${id}`)
export const crearHoraMedica = (data) => api.post('/agenda/api/horas-medicas', data)

// ── REPROGRAMACIÓN ────────────────────────────────────
export const getCitasReprogramacion = () => api.get('/reprogramacion/api/citas')
export const getCitaReprogramacionById = (id) => api.get(`/reprogramacion/api/citas/${id}`)
export const getCitasReprogramacionPorPaciente = (id) => api.get(`/reprogramacion/api/citas/paciente/${id}`)
export const getCitasReprogramacionPorMedico = (id) => api.get(`/reprogramacion/api/citas/medico/${id}`)
export const crearCitaReprogramacion = (data) => api.post('/reprogramacion/api/citas', data)
export const cancelarCita = (id, motivo) => api.put(`/reprogramacion/api/citas/${id}/cancelar`, { motivo })
export const reprogramarCita = (id, data) => api.put(`/reprogramacion/api/citas/${id}/reprogramar`, data)

// ── LISTA DE ESPERA ───────────────────────────────────
export const getListaEspera = (params) => api.get('/api/lista-espera', { params })
export const getListaEsperaById = (id) => api.get(`/api/lista-espera/${id}`)
export const agregarListaEspera = (data) => api.post('/api/lista-espera', data)
export const asignarListaEspera = (id) => api.patch(`/api/lista-espera/${id}/asignar`)
export const cancelarListaEspera = (id) => api.patch(`/api/lista-espera/${id}/cancelar`)

// ── SEGUIMIENTO ───────────────────────────────────────
export const getSeguimientos = () => api.get('/api/seguimiento')
export const getSeguimientoPorPaciente = (id) => api.get(`/api/seguimiento/paciente/${id}/historial`)
export const getSeguimientoEstado = (id) => api.get(`/api/seguimiento/${id}/estado`)
export const crearSeguimiento = (data) => api.post('/api/seguimiento', data)
export const registrarEvento = (id, data) => api.post(`/api/seguimiento/${id}/eventos`, data)
export const actualizarEstadoSeguimiento = (id, data) => api.patch(`/api/seguimiento/${id}/estado`, data)

// ── NOTIFICACIONES ────────────────────────────────────
export const getNotificaciones = (rol, id) => api.get(`/agenda/api/notificaciones/${rol}/${id}`)
export const getNotificacionesNoLeidas = (rol, id) => api.get(`/agenda/api/notificaciones/${rol}/${id}/no-leidas`)
export const getContadorNotificaciones = (rol, id) => api.get(`/agenda/api/notificaciones/${rol}/${id}/contador`)
export const marcarNotificacionLeida = (notifId) => api.patch(`/agenda/api/notificaciones/${notifId}/leer`)
export const marcarTodasNotificacionesLeidas = (rol, id) => api.patch(`/agenda/api/notificaciones/${rol}/${id}/leer-todas`)

// ── PLANTILLAS DE HORARIO ─────────────────────────────
export const getPlantillas = () => api.get('/agenda/api/plantillas-horario')
export const getPlantillasPorMedico = (medicoId) => api.get(`/agenda/api/plantillas-horario/medico/${medicoId}`)
export const crearPlantilla = (data) => api.post('/agenda/api/plantillas-horario', data)
export const actualizarPlantilla = (id, data) => api.put(`/agenda/api/plantillas-horario/${id}`, data)
export const eliminarPlantilla = (id) => api.delete(`/agenda/api/plantillas-horario/${id}`)
export const togglePlantilla = (id) => api.patch(`/agenda/api/plantillas-horario/${id}/toggle`)
export const generarHorasPlantilla = (id) => api.post(`/agenda/api/plantillas-horario/${id}/generar`)
export const upsertHorarioMedico = (data) => api.post('/agenda/api/horarios-medico', data)

// ── ESPECIALIDADES ────────────────────────────────────
export const getEspecialidades = () => api.get('/api/especialidades')
export const getEspecialidadById = (id) => api.get(`/api/especialidades/${id}`)
export const createEspecialidad = (data) => api.post('/api/especialidades', data)
export const updateEspecialidad = (id, data) => api.put(`/api/especialidades/${id}`, data)
export const deleteEspecialidad = (id) => api.delete(`/api/especialidades/${id}`)
export const asociarMedicoEspecialidad = (espId, medicoId) => api.post(`/api/especialidades/${espId}/medicos/${medicoId}`)
export const desasociarMedicoEspecialidad = (espId, medicoId) => api.delete(`/api/especialidades/${espId}/medicos/${medicoId}`)

export default api
