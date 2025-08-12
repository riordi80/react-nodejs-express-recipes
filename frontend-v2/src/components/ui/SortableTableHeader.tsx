import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { SortConfig } from '@/hooks/useTableSort'

interface SortableTableHeaderProps {
  sortKey: string
  children: React.ReactNode
  sortConfig: SortConfig
  onSort: (key: string) => void
  className?: string
  sortable?: boolean
}

export default function SortableTableHeader({
  sortKey,
  children,
  sortConfig,
  onSort,
  className = '',
  sortable = true
}: SortableTableHeaderProps) {
  const isActive = sortConfig.key === sortKey
  const direction = isActive ? sortConfig.direction : null

  const getSortIcon = () => {
    if (!sortable) return null

    if (direction === 'asc') {
      return <ChevronUp className="h-4 w-4" />
    } else if (direction === 'desc') {
      return <ChevronDown className="h-4 w-4" />
    } else {
      return <ChevronsUpDown className="h-4 w-4 opacity-50" />
    }
  }

  const baseClasses = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
  const sortableClasses = sortable ? "cursor-pointer hover:bg-gray-100 select-none transition-colors" : ""
  const activeClasses = isActive ? "bg-gray-100" : ""

  return (
    <th
      className={`${baseClasses} ${sortableClasses} ${activeClasses} ${className}`}
      onClick={sortable ? () => onSort(sortKey) : undefined}
    >
      <div className="flex items-center justify-between group">
        <span>{children}</span>
        {sortable && (
          <span className={`ml-2 flex-shrink-0 ${direction ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-500'}`}>
            {getSortIcon()}
          </span>
        )}
      </div>
    </th>
  )
}