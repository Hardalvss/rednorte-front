import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import PrivateRoute from './components/PrivateRoute'
import { ShieldOff } from 'lucide-react'

// Auth
import Login from './pages/Login'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import Usuarios from './pages/admin/Usuarios'
import CitasAdmin from './pages/admin/CitasAdmin'
import ReprogramacionAdmin from './pages/admin/ReprogramacionAdmin'
import ListaEsperaAdmin from './pages/admin/ListaEsperaAdmin'
import SeguimientoAdmin from './pages/admin/SeguimientoAdmin'
import HorasMedicasAdmin from './pages/admin/HorasMedicasAdmin'

// Médico
import MedicoDashboard from './pages/medico/MedicoDashboard'
import MisCitas from './pages/medico/MisCitas'
import ConfirmarCitas from './pages/medico/ConfirmarCitas'
import ReprogramacionMedico from './pages/medico/ReprogramacionMedico'
import SeguimientoMedico from './pages/medico/SeguimientoMedico'

// Paciente
import AgendarCita from './pages/paciente/AgendarCita'
import MisCitasPaciente from './pages/paciente/MisCitasPaciente'
import ListaEsperaPaciente from './pages/paciente/ListaEsperaPaciente'
import SeguimientoPaciente from './pages/paciente/SeguimientoPaciente'

function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <ShieldOff size={52} className="text-gray-300" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Acceso no autorizado</h1>
        <p className="text-gray-500 mt-2">No tienes permisos para ver esta página.</p>
        <a href="/login" className="btn-primary inline-block mt-4">Volver al login</a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ADMIN */}
          <Route path="/admin" element={<PrivateRoute roles={['ADMIN']}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/usuarios" element={<PrivateRoute roles={['ADMIN']}><Usuarios /></PrivateRoute>} />
          <Route path="/admin/citas" element={<PrivateRoute roles={['ADMIN']}><CitasAdmin /></PrivateRoute>} />
          <Route path="/admin/reprogramacion" element={<PrivateRoute roles={['ADMIN']}><ReprogramacionAdmin /></PrivateRoute>} />
          <Route path="/admin/lista-espera" element={<PrivateRoute roles={['ADMIN']}><ListaEsperaAdmin /></PrivateRoute>} />
          <Route path="/admin/seguimiento" element={<PrivateRoute roles={['ADMIN']}><SeguimientoAdmin /></PrivateRoute>} />
          <Route path="/admin/horas-medicas" element={<PrivateRoute roles={['ADMIN']}><HorasMedicasAdmin /></PrivateRoute>} />

          {/* MÉDICO */}
          <Route path="/medico" element={<PrivateRoute roles={['MEDICO']}><MedicoDashboard /></PrivateRoute>} />
          <Route path="/medico/confirmar" element={<PrivateRoute roles={['MEDICO']}><ConfirmarCitas /></PrivateRoute>} />
          <Route path="/medico/mis-citas" element={<PrivateRoute roles={['MEDICO']}><MisCitas /></PrivateRoute>} />
          <Route path="/medico/reprogramacion" element={<PrivateRoute roles={['MEDICO']}><ReprogramacionMedico /></PrivateRoute>} />
          <Route path="/medico/seguimiento" element={<PrivateRoute roles={['MEDICO']}><SeguimientoMedico /></PrivateRoute>} />

          {/* PACIENTE */}
          <Route path="/paciente" element={<Navigate to="/paciente/mis-citas" replace />} />
          <Route path="/paciente/mis-citas" element={<PrivateRoute roles={['PACIENTE']}><MisCitasPaciente /></PrivateRoute>} />
          <Route path="/paciente/agendar" element={<PrivateRoute roles={['PACIENTE']}><AgendarCita /></PrivateRoute>} />
          <Route path="/paciente/lista-espera" element={<PrivateRoute roles={['PACIENTE']}><ListaEsperaPaciente /></PrivateRoute>} />
          <Route path="/paciente/seguimiento" element={<PrivateRoute roles={['PACIENTE']}><SeguimientoPaciente /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
