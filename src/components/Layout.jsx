import { useState } from 'react'
import { Menu, Stethoscope } from 'lucide-react'
import Sidebar from './Sidebar'
import NotificacionesBell from './NotificacionesBell'

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-gray-700 hover:bg-gray-100"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Stethoscope size={16} className="text-white" />
              </div>
              <span className="font-bold text-gray-800">RedNorte</span>
            </div>
          </div>
          <NotificacionesBell />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
