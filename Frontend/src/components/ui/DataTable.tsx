'use client'

import React from 'react'

interface Column<T> {
  header: string
  accessor: keyof T | ((item: T) => React.ReactNode)
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T) => void
  actions?: (item: T) => React.ReactNode
}

export default function DataTable<T extends { _id: string }>({ 
  data, 
  columns, 
  onRowClick,
  actions 
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg shadow-md border border-brass/20">
      <table className="w-full">
        <thead className="bg-charcoal text-ivory">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-4 text-left text-sm font-semibold tracking-wide"
              >
                {column.header}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-brass/10">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-6 py-12 text-center text-charcoal/60"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={item._id}
                onClick={() => onRowClick?.(item)}
                className={`${
                  onRowClick ? 'cursor-pointer hover:bg-brass/5' : ''
                } transition-colors duration-200`}
              >
                {columns.map((column, index) => (
                  <td
                    key={index}
                    className={`px-6 py-4 text-sm text-charcoal ${column.className || ''}`}
                  >
                    {typeof column.accessor === 'function'
                      ? column.accessor(item)
                      : String(item[column.accessor])}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      {actions(item)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

