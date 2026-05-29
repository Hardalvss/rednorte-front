import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, LogIn } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      const routes = { ADMIN: '/admin', MEDICO: '/medico', PACIENTE: '/paciente' }
      navigate(routes[user.rol] || '/login')
    } catch {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen w-full relative"
      style={{
        backgroundImage: 'url(/login-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center right',
      }}
    >
      {/* Overlay sutil para profundidad */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to right, rgba(4,12,30,0.0) 0%, rgba(4,12,30,0.0) 100%)' }}
      />

      {/* Card glassmorphism con el formulario */}
      <div
        className="absolute z-10 w-full max-w-2xl rounded-2xl p-9"
        style={{
          bottom: '12%',
          left: '7%',
          background: 'rgba(8, 40, 60, 0.55)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(99, 155, 255, 0.25)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <h2 className="text-white text-2xl font-bold mb-1">Iniciar Sesión</h2>
        <p className="text-blue-300 text-sm mb-6 opacity-80">Ingresa tus credenciales para continuar</p>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-400 border-opacity-40 text-red-200 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-200 mb-1.5">Correo electrónico</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 opacity-70" />
              <input
                type="email"
                placeholder="usuario@rednorte.cl"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm text-white placeholder-blue-400 placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(99,155,255,0.3)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-200 mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 opacity-70" />
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm text-white placeholder-blue-400 placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(99,155,255,0.3)',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-lg transition-all duration-200 mt-2 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 15px rgba(37,99,235,0.4)',
            }}
          >
            <LogIn size={16} className="text-white" />
            <span className="text-white">{loading ? 'Iniciando sesión...' : 'Ingresar al sistema'}</span>
          </button>
        </form>

        <p className="text-center text-xs text-blue-400 opacity-60 mt-6">
          RedNorte © 2026 — Sistema de Salud
        </p>
      </div>
    </div>
  )
}
