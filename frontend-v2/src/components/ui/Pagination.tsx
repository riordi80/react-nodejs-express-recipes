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
  // Generar array de páginas a mostrar para desktop
  const generateDesktopPages = () => {
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

  // Generar array de páginas a mostrar para mobile (compact design)
  const generateMobilePages = () => {
    const pages: (number | 'ellipsis')[] = []
    
    // En mobile solo mostramos la página actual y adyacentes sin first/last
    const startPage = Math.max(1, currentPage - 0) // siblingCount = 0 para mobile
    const endPage = Math.min(totalPages, currentPage + 0)
    
    // Añadir páginas del rango (solo página actual)
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    return pages
  }

  const desktopPages = generateDesktopPages()
  const mobilePages = generateMobilePages()

  const buttonClasses = 'inline-flex items-center justify-center px-3 py-2 text-sm font-medium border transition-colors'
  const activeClasses = 'bg-orange-600 text-white border-orange-600'
  const inactiveClasses = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
  const disabledClasses = 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'

  const renderPageNumbers = (pages: (number | 'ellipsis')[]) => {
    return pages.map((page, index) => {
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
    })
  }

  return (
    <>
      {/* Desktop Version */}
      <nav className={clsx('hidden sm:flex items-center justify-center space-x-1', className)}>
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
            <span className="ml-1">Anterior</span>
          </button>
        )}

        {/* Desktop Page numbers */}
        {renderPageNumbers(desktopPages)}

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
            <span className="mr-1">Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </nav>

      {/* Mobile Version - Compact */}
      <nav className={clsx('flex sm:hidden items-center justify-center space-x-1', className)}>
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
          </button>
        )}

        {/* Mobile Page numbers - Only current page */}
        {renderPageNumbers(mobilePages)}

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
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </nav>
    </>
  )
}

export default Pagination