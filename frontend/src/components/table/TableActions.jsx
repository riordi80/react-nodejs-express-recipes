import React from 'react';
import { FaTrash, FaEdit, FaBan, FaUndo, FaEye } from 'react-icons/fa';

/**
 * Componente reutilizable para acciones de tabla
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.row - Fila de datos actual
 * @param {Function} props.onEdit - Callback para editar (opcional)
 * @param {Function} props.onDelete - Callback para eliminar (opcional)
 * @param {Function} props.onView - Callback para ver detalles (opcional)
 * @param {Function} props.onActivate - Callback para activar/desactivar (opcional)
 * @param {boolean} props.showEdit - Mostrar botón de editar (default: false)
 * @param {boolean} props.showDelete - Mostrar botón de eliminar (default: true)
 * @param {boolean} props.showView - Mostrar botón de ver (default: false)
 * @param {boolean} props.showActivate - Mostrar botón de activar/desactivar (default: false)
 * @param {string} props.deleteTitle - Título del botón eliminar (default: "Eliminar")
 * @param {string} props.editTitle - Título del botón editar (default: "Editar")
 * @param {string} props.viewTitle - Título del botón ver (default: "Ver detalles")
 * @param {string} props.activateField - Campo que determina si está activo (default: "is_available")
 * @param {string} props.activateTitle - Título del botón activar (default: "Reactivar")
 * @param {string} props.deactivateTitle - Título del botón desactivar (default: "Desactivar")
 * @returns {JSX.Element} Componente de acciones de tabla
 */
export default function TableActions({
  row,
  onEdit,
  onDelete,
  onView,
  onActivate,
  showEdit = false,
  showDelete = true,
  showView = false,
  showActivate = false,
  deleteTitle = "Eliminar",
  editTitle = "Editar",
  viewTitle = "Ver detalles",
  activateField = "is_available",
  activateTitle = "Reactivar",
  deactivateTitle = "Desactivar"
}) {
  const isActive = row[activateField];

  return (
    <div className="table-actions">
      {/* Botón Ver */}
      {showView && onView && (
        <button 
          className="icon-btn view-icon" 
          onClick={() => onView(row)}
          title={viewTitle}
        >
          <FaEye />
        </button>
      )}

      {/* Botón Editar */}
      {showEdit && onEdit && (
        <button 
          className="icon-btn edit-icon" 
          onClick={() => onEdit(row)}
          title={editTitle}
        >
          <FaEdit />
        </button>
      )}

      {/* Botón Eliminar */}
      {showDelete && onDelete && (
        <button 
          className="icon-btn delete-icon" 
          onClick={() => onDelete(row)}
          title={deleteTitle}
        >
          <FaTrash />
        </button>
      )}

      {/* Botón Activar/Desactivar */}
      {showActivate && onActivate && (
        <>
          {isActive ? (
            <button 
              className="icon-btn delete-icon" 
              onClick={() => onActivate(row)}
              title={deactivateTitle}
            >
              <FaBan />
            </button>
          ) : (
            <button 
              className="icon-btn activate-icon" 
              onClick={() => onActivate(row)}
              title={activateTitle}
              style={{ background: '#10b981' }}
            >
              <FaUndo />
            </button>
          )}
        </>
      )}
    </div>
  );
}