import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import SeguimientoModal from '../../components/SeguimientoModal'
import { useAuth } from '../../context/AuthContext'
import { getCitasPorMedico, getSeguimientos } from '../../services/api'
import {
  ClipboardList, Search, RefreshCw, ChevronRight, User, Stethoscope, Calendar
} from 'lucide-react'

const ESTADO_BADGE = {
  EN_ESPERA: 'bg-yellow-100 text-yellow-700',
  EN_TRATAMIENTO: 'bg-blue-100 text-blue-700',
  EN_SEGUIMIENTO: 'bg-indigo-100 text-indigo-700',
  ALTA: 'bg-green-100 text-green-700',
  DERIVADO: 'bg-gray-200 text-gray-700'
}

const FILTROS = ['TODOS', 'EN_ESPERA', 'EN_TRATAMIENTO', 'EN_SEGUIMIENTO', 'ALTA']

export default function SeguimientoMedico() {
  const { user } = useAuth()
  const [seguimientos, setSeguimientos] = useState([])
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('TODOS')
  const [modal, setModal] = useState(false)
  const [pacienteSel, setPacienteSel] = useState(null)
  const [especialidadSel, setEspecialidadSel] = useState(null)

  const cargar = () => {
    if (!user?.id) return
    setLoading(true)
    Promise.allSettled([
      getCitasPorMedico(user.id),
      getSeguimientos()
    ]).then(([cs, ss]) => {
      setCitas(cs.value?.data || [])
      setSeguimientos(ss.value?.data || [])
      setLoading(false)
    })
  }

  useEffect(() => { cargar() }, [user?.id])

  const pacientesIds = useMemo(() => {
    const set = new Set()
    citas.forEach(c => { if (c.pacienteId) set.add(Number(c.pacienteId)) })
    return set
  }, [citas])

  const especialidadMedico = useMemo(() => {
    return citas[0]?.horaMedica?.especialidad || null
  }, [citas])

  const segsMios = useMemo(() => {
    return seguimientos.filter(s => pacientesIds.has(Number(s.pacienteId)))
  }, [seguimientos, pacientesIds])

  const filtrados = useMemo(() => {
    let lista = segsMios
    if (filtro !== 'TODOS') lista = lista.filter(s => s.estadoActual === filtro)
    if (busqueda.trim()) {
      const b = busqueda.toLowerCase()
      lista = lista.filter(s =>
        s.nombrePaciente?.toLowerCase().includes(b) ||
        s.rutPaciente?.toLowerCase().includes(b) ||
        s.especialidad?.toLowerCase().includes(b)
      )
    }
    return [...lista].sort((a, b) => new Date(b.fechaActualizacion || 0) - new Date(a.fechaActualizacion || 0))
  }, [segsMios, filtro, busqueda])

  const conteo = {
    TODOS: segsMios.length,
    EN_ESPERA: segsMios.filter(s => s.estadoActual === 'EN_ESPERA').length,
    EN_TRATAMIENTO: segsMios.filter(s => s.estadoActual === 'EN_TRATAMIENTO').length,
    EN_SEGUIMIENTO: segsMios.filter(s => s.estadoActual === 'EN_SEGUIMIENTO').length,
    ALTA: segsMios.filter(s => s.estadoActual === 'ALTA').length
  }

  const abrirSeg = (s) => {
    setPacienteSel({ id: s.pacienteId, nombre: s.nombrePaciente, rut: s.rutPaciente })
    setEspecialidadSel(s.especialidad)
    setModal(true)
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Seguimiento de Pacientes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {segsMios.length} {segsMios.length === 1 ? 'paciente' : 'pacientes'} en seguimiento contigo
          </p>
        </div>
        <button onClick={cargar} disabled={loading} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por nombre, RUT o especialidad…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filtro === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {f === 'TODOS' ? 'Todos' : f.replace('_', ' ')}
            <span className="ml-1.5 opacity-75">({conteo[f]})</span>
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardList size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">
            {busqueda || filtro !== 'TODOS' ? 'Sin resultados para los filtros aplicados.' : 'Aún no tienes pacientes en seguimiento.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtrados.map(s => (
            <button
              key={s.id}
              onClick={() => abrirSeg(s)}
              className="card text-left hover:border-blue-400 border-2 border-transparent transition-all hover:shadow-md group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-xs">
                      {s.nombrePaciente?.split(' ').slice(0, 2).map(n => n[0]).join('') || '?'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{s.nombrePaciente}</p>
                    <p className="text-xs text-gray-500">{s.rutPaciente}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${ESTADO_BADGE[s.estadoActual] || 'bg-gray-100 text-gray-700'}`}>
                  {s.estadoActual?.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Stethoscope size={12} className="text-gray-400" />
                  <span className="capitalize">{s.especialidad}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Calendar size={12} className="text-gray-400" />
                  <span>
                    Última actualización: {s.fechaActualizacion ? new Date(s.fechaActualizacion).toLocaleDateString('es-CL') : '—'}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-end text-xs font-medium text-blue-600 group-hover:text-blue-800">
                Abrir seguimiento <ChevronRight size={13} />
              </div>
            </button>
          ))}
        </div>
      )}

      <SeguimientoModal
        isOpen={modal}
        onClose={() => setModal(false)}
        paciente={pacienteSel}
        especialidad={especialidadSel || especialidadMedico}
        onUpdated={cargar}
      />
    </Layout>
  )
}
