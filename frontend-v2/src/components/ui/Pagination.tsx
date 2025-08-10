'use client'

import React from 'react'
import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showPrevNext?: boolean
  showFirstLast?: boolean
  siblingCount?: number
  className?: string
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showPrevNext = true,
  showFirstLast = true,
  siblingCount = 1,
  className
}: PaginationProps) => {
  // Generar array de páginas a mostrar
  const generatePages = () => {
    const pages: (number | 'ellipsis')[] = []
    
    // Siempre mostrar primera página
    if (showFirstLast) {
      pages.push(1)
    }
    
    // Calcular rango de páginas alrededor de la actual
    const startPage = Math.max(showFirstLast ? 2 : 1, currentPage - siblingCount)
    const endPage = Math.min(showFirstLast ? totalPages - 1 : totalPages, currentPage + siblingCount)
    
    // Añadir ellipsis si hay gap después de la primera página
    if (showFirstLast && startPage > 2) {
      pages.push('ellipsis')
    }
    
    // Añadir páginas del rango
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    // Añadir ellipsis si hay gap antes de la última página
    if (showFirstLast && endPage < totalPages - 1) {
      pages.push('ellipsis')
    }
    
    // Siempre mostrar última página
    if (showFirstLast && totalPages > 1) {
      pages.push(totalPages)
    }
    
    return pages
  }

  const pages = generatePages()

  const buttonClasses = 'inline-flex items-center justify-center px-3 py-2 text-sm font-medium border transition-colors'
  const activeClasses = 'bg-orange-600 text-white border-orange-600'
  const inactiveClasses = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
  const disabledClasses = 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'

  return (
    <nav className={clsx('flex items-center justify-center space-x-1', className)}>
      {/* Previous button */}
      {showPrevNext && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={clsx(
            buttonClasses,
            'rounded-l-md',
            currentPage <= 1 ? disabledClasses : inactiveClasses
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Anterior</span>
        </button>
      )}

      {/* Page numbers */}
      {pages.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex items-center justify-center px-3 py-2 text-sm text-gray-700"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          )
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={clsx(
              buttonClasses,
              currentPage === page ? activeClasses : inactiveClasses
            )}
          >
            {page}
          </button>
        )
      })}

      {/* Next button */}
      {showPrevNext && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={clsx(
            buttonClasses,
            'rounded-r-md',
            currentPage >= totalPages ? disabledClasses : inactiveClasses
          )}
        >
          <span className="hidden sm:inline mr-1">Siguiente</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </nav>
  )
}

export default Pagination