import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  getNotificaciones, getNotificacionesNoLeidas, getContadorNotificaciones,
  marcarNotificacionLeida, marcarTodasNotificacionesLeidas
} from '../services/api'

const TIPO_COLOR = {
  CITA_PENDIENTE: 'bg-yellow-100 text-yellow-700',
  CITA_CONFIRMADA: 'bg-green-100 text-green-700',
  CITA_CANCELADA: 'bg-red-100 text-red-700',
  CITA_REPROGRAMADA: 'bg-indigo-100 text-indigo-700',
  REPROGRAMACION_ACEPTADA: 'bg-green-100 text-green-700',
  REPROGRAMACION_RECHAZADA: 'bg-red-100 text-red-700',
  SEGUIMIENTO_EVENTO: 'bg-blue-100 text-blue-700',
  SEGUIMIENTO_ESTADO: 'bg-purple-100 text-purple-700'
}

const fmtFecha = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'hace unos segundos'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function NotificacionesBell() {
  const { user } = useAuth()
  const { show } = useToast()
  const [abierto, setAbierto] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const ultimoIdRef = useRef(null)
  const inicializadoRef = useRef(false)
  const prevCountRef = useRef(0)

  const sincronizar = async () => {
    if (!user?.id || !user?.rol) return
    try {
      const [contRes, listRes] = await Promise.all([
        getContadorNotificaciones(user.rol, user.id),
        getNotificacionesNoLeidas(user.rol, user.id)
      ])
      const nuevoCount = contRes.data?.count || 0
      const lista = listRes.data || []
      setCount(nuevoCount)

      const masReciente = lista[0]
      const prevId = ultimoIdRef.current

      if (!inicializadoRef.current) {
        ultimoIdRef.current = masReciente?.id || null
        prevCountRef.current = nuevoCount
        inicializadoRef.current = true
        return
      }

      const haySubidaConteo = nuevoCount > prevCountRef.current
      const nuevoIdDistinto = masReciente && masReciente.id !== prevId
      prevCountRef.current = nuevoCount

      if (haySubidaConteo && nuevoIdDistinto) {
        const cantidad = Math.max(1, nuevoCount - (prevId ? 0 : prevCountRef.current - lista.length))
        const recienLlegadas = lista
          .filter(n => !prevId || n.id > prevId)
          .slice(0, cantidad)
        recienLlegadas.forEach(n => {
          show({
            titulo: n.titulo || 'Nueva notificación',
            mensaje: n.mensaje,
            variant: 'notif',
            duration: 7000
          })
        })
        ultimoIdRef.current = masReciente.id
      } else if (masReciente) {
        ultimoIdRef.current = masReciente.id
      }
    } catch {}
  }

  const cargarLista = async () => {
    if (!user?.id || !user?.rol) return
    try {
      const r = await getNotificaciones(user.rol, user.id)
      setNotifs(r.data || [])
    } catch {}
  }

  useEffect(() => {
    inicializadoRef.current = false
    ultimoIdRef.current = null
    prevCountRef.current = 0
    sincronizar()
    const interval = setInterval(sincronizar, 15000)
    return () => clearInterval(interval)
  }, [user?.id, user?.rol])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const abrir = () => {
    cargarLista()
    setAbierto(true)
  }

  const marcarUna = async (n) => {
    if (n.leida) return
    try {
      await marcarNotificacionLeida(n.id)
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x))
      setCount(c => Math.max(0, c - 1))
    } catch {}
  }

  const marcarTodas = async () => {
    try {
      await marcarTodasNotificacionesLeidas(user.rol, user.id)
      setNotifs(prev => prev.map(x => ({ ...x, leida: true })))
      setCount(0)
    } catch {}
  }

  if (!user?.id) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => abierto ? setAbierto(false) : abrir()}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] bg-white border border-gray-200 rounded-xl shadow-xl z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Notificaciones</h3>
            <div className="flex items-center gap-1">
              {notifs.some(n => !n.leida) && (
                <button onClick={marcarTodas} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                  <CheckCheck size={14} /> Marcar todas
                </button>
              )}
              <button onClick={() => setAbierto(false)} className="text-gray-400 hover:text-gray-600 ml-1 p-1">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifs.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8 px-4">No tienes notificaciones.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifs.map(n => (
                  <li
                    key={n.id}
                    onClick={() => marcarUna(n)}
                    className={`px-4 py-3 cursor-pointer transition-colors ${n.leida ? 'bg-white' : 'bg-blue-50'} hover:bg-gray-50`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TIPO_COLOR[n.tipo] || 'bg-gray-100 text-gray-700'}`}>
                        {n.tipo?.replace(/_/g, ' ')}
                      </span>
                      {!n.leida && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 ml-auto shrink-0" />}
                    </div>
                    <p className="text-sm font-medium text-gray-800">{n.titulo}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{n.mensaje}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{fmtFecha(n.fechaCreacion)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
