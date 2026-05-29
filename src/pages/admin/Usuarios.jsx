import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../../services/api'

const EMPTY_FORM = { nombre: '', apellido: '', rut: '', email: '', password: '', telefono: '', rol: 'PACIENTE' }
const FILTROS = ['TODOS', 'MEDICO', 'PACIENTE', 'ADMIN']

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [filtro, setFiltro] = useState('TODOS')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cargar = () => getUsuarios().then(r => setUsuarios(r.data))
  useEffect(() => { cargar() }, [])

  const usuariosFiltrados = filtro === 'TODOS'
    ? usuarios
    : usuarios.filter(u => u.rol === filtro)

  const abrirCrear = () => { setEditando(null); setForm(EMPTY_FORM); setError(''); setModal(true) }
  const abrirEditar = (u) => { setEditando(u); setForm({ ...u, password: '' }); setError(''); setModal(true) }

  const guardar = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      if (editando) await updateUsuario(editando.id, form)
      else await createUsuario(form)
      setModal(false)
      cargar()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar. Verifica los datos.')
    } finally { setLoading(false) }
  }

  const eliminar = async (u) => {
    if (!confirm(`¿Eliminar a ${u.nombre} ${u.apellido}?`)) return
    await deleteUsuario(u.id)
    cargar()
  }

  const rolBadge = (v) => {
    const cls = {
      ADMIN:    'bg-purple-100 text-purple-700',
      MEDICO:   'bg-blue-100 text-blue-700',
      PACIENTE: 'bg-green-100 text-green-700',
    }
    return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cls[v] || ''}`}>{v}</span>
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre', render: (v, row) => `${v} ${row.apellido}` },
    { key: 'rut', label: 'RUT' },
    { key: 'email', label: 'Email' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'rol', label: 'Rol', render: rolBadge },
  ]

  const conteo = {
    TODOS: usuarios.length,
    MEDICO: usuarios.filter(u => u.rol === 'MEDICO').length,
    PACIENTE: usuarios.filter(u => u.rol === 'PACIENTE').length,
    ADMIN: usuarios.filter(u => u.rol === 'ADMIN').length,
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">{usuariosFiltrados.length} usuarios</p>
        </div>
        <button onClick={abrirCrear} className="btn-primary">+ Nuevo Usuario</button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filtro === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {f === 'TODOS' ? 'Todos' : f.charAt(0) + f.slice(1).toLowerCase()}
            <span className="ml-1.5 text-xs opacity-75">({conteo[f]})</span>
          </button>
        ))}
      </div>

      <div className="card">
        <Table columns={columns} data={usuariosFiltrados} onEdit={abrirEditar} onDelete={eliminar} />
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editando ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <form onSubmit={guardar} className="space-y-3">
          {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nombre</label><input className="input" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required /></div>
            <div><label className="label">Apellido</label><input className="input" value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} required /></div>
          </div>
          <div><label className="label">RUT</label><input className="input" placeholder="12345678-9" value={form.rut} onChange={e => setForm({...form, rut: e.target.value})} required /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
          <div><label className="label">{editando ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label><input type="password" className="input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editando} /></div>
          <div><label className="label">Teléfono</label><input className="input" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} required /></div>
          <div><label className="label">Rol</label>
            <select className="input" value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}>
              <option value="PACIENTE">PACIENTE</option>
              <option value="MEDICO">MEDICO</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
