import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, Calendar, RefreshCw, Clock,
  ClipboardList, LogOut, Stethoscope, Activity, BookOpen, X, CalendarClock, CheckSquare
} from 'lucide-react'

const menuAdmin = [
  { to: '/admin',                label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/admin/usuarios',       label: 'Usuarios',        icon: Users },
  { to: '/admin/citas',          label: 'Citas Agenda',    icon: Calendar },
  { to: '/admin/reprogramacion', label: 'Reprogramación',  icon: RefreshCw },
  { to: '/admin/lista-espera',   label: 'Lista de Espera', icon: Clock },
  { to: '/admin/seguimiento',    label: 'Seguimiento',     icon: ClipboardList },
  { to: '/admin/horas-medicas',  label: 'Horas Médicas',   icon: Stethoscope },
]

const menuMedico = [
  { to: '/medico',                label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/medico/confirmar',      label: 'Por Confirmar',  icon: CheckSquare },
  { to: '/medico/mis-citas',      label: 'Mis Citas',      icon: Calendar },
  { to: '/medico/reprogramacion', label: 'Reprogramación', icon: RefreshCw },
  { to: '/medico/seguimiento',    label: 'Seguimiento',    icon: ClipboardList },
]

const menuPaciente = [
  { to: '/paciente/mis-citas',     label: 'Mis Citas',       icon: Calendar },
  { to: '/paciente/agendar',       label: 'Agendar Cita',    icon: Stethoscope },
  { to: '/paciente/lista-espera',  label: 'Lista de Espera', icon: Clock },
  { to: '/paciente/seguimiento',   label: 'Mi Seguimiento',  icon: Activity },
]

export default function Sidebar({ open = false, onClose = () => {} }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const menus = { ADMIN: menuAdmin, MEDICO: menuMedico, PACIENTE: menuPaciente }
  const menu = menus[user?.rol] || []

  const handleLogout = () => {
    onClose()
    logout()
    navigate('/login')
  }

  return (
    <>
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Stethoscope size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-base leading-tight">RedNorte</p>
              <p className="text-xs text-slate-400">Sistema de Salud</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md text-slate-300 hover:bg-slate-800"
            aria-label="Cerrar menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-slate-700">
          <p className="text-sm font-semibold truncate">{user?.nombre || user?.email}</p>
          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full mt-1 inline-block">
            {user?.rol}
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menu.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.split('/').length === 2}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
