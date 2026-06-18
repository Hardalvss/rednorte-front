import { createContext, useCallback, useContext, useState } from 'react'
import { Bell, CheckCircle, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

let idSeq = 1

const COLORES = {
  notif:   { ring: 'border-l-4 border-blue-500',   icon: Bell,         color: 'text-blue-600',   bg: 'bg-blue-50' },
  success: { ring: 'border-l-4 border-green-500',  icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50' },
  error:   { ring: 'border-l-4 border-red-500',    icon: AlertCircle,  color: 'text-red-600',    bg: 'bg-red-50' }
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = (id) => setToasts(t => t.filter(x => x.id !== id))

  const show = useCallback((toast) => {
    const id = idSeq++
    const item = { id, variant: 'notif', duration: 6000, ...toast }
    setToasts(t => [...t, item])
    if (item.duration > 0) {
      setTimeout(() => remove(id), item.duration)
    }
    return id
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-auto pointer-events-none">
        {toasts.map(t => {
          const c = COLORES[t.variant] || COLORES.notif
          const Icon = c.icon
          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto bg-white shadow-lg rounded-xl ${c.ring} flex items-start gap-3 px-4 py-3 animate-slide-in`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.bg}`}>
                <Icon size={16} className={c.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{t.titulo}</p>
                {t.mensaje && <p className="text-xs text-gray-600 mt-0.5 line-clamp-3">{t.mensaje}</p>}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="text-gray-400 hover:text-gray-700 shrink-0"
                aria-label="Cerrar"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
