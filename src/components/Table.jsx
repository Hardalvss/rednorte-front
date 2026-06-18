export default function Table({ columns, data, onEdit, onDelete, actions }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">No hay datos disponibles.</p>
  }

  const hasActions = onEdit || onDelete || actions

  return (
    <>
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
                {hasActions && (
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    {actions && actions(row)}
                    {onEdit && (
                      <button onClick={() => onEdit(row)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Editar
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(row)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                        Eliminar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {data.map((row, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <dl className="space-y-2">
              {columns.map((col) => {
                const value = col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')
                return (
                  <div key={col.key} className="flex justify-between gap-3 text-sm">
                    <dt className="text-gray-500 font-medium shrink-0">{col.label}</dt>
                    <dd className="text-gray-800 text-right break-words min-w-0">{value}</dd>
                  </div>
                )
              })}
            </dl>
            {hasActions && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap justify-end gap-2">
                {actions && actions(row)}
                {onEdit && (
                  <button onClick={() => onEdit(row)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Editar
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(row)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                    Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
