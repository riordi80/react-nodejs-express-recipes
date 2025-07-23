// src/pages/allergens/Allergens.jsx
import React, { useState, useMemo } from 'react';
import { FaTrash } from 'react-icons/fa';
import BasePage from '../../components/BasePage';
import Modal from '../../components/modal/Modal';
import { usePageState } from '../../hooks/usePageState';
import './Allergens.css';

export default function Allergens() {
  const {
    filteredData,
    loading,
    error,
    message,
    messageType,
    filterText,
    setFilterText,
    createItem,
    updateItem,
    deleteItem,
    notify,
  } = usePageState('/allergens');

  // Local state for forms and modals
  const [newName, setNewName] = useState('');
  const [hasInputError, setHasInputError] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentAllergen, setCurrentAllergen] = useState(null);
  const [editedName, setEditedName] = useState('');

  // Modal handlers
  const openCreateModal = () => {
    setNewName('');
    setHasInputError(false);
    setIsCreateOpen(true);
  };

  // Create handler
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setHasInputError(true);
      notify('Introduzca el nombre del alérgeno', 'error');
      // Reset input error after 3 seconds to match the message timeout
      setTimeout(() => setHasInputError(false), 3000);
      return;
    }
    
    setHasInputError(false);
    const success = await createItem({ name: newName.trim() });
    if (success) {
      setNewName('');
      setIsCreateOpen(false);
    }
  };

  // Edit handlers
  const openEditModal = (row) => {
    setCurrentAllergen(row);
    setEditedName(row.name);
    setIsEditOpen(true);
  };

  const confirmEdit = async () => {
    if (!editedName.trim()) return;
    
    const success = await updateItem(currentAllergen.allergen_id, { name: editedName.trim() });
    if (success) {
      setIsEditOpen(false);
      setCurrentAllergen(null);
      setEditedName('');
    }
  };

  // Delete handlers
  const openDeleteModal = (row) => {
    setCurrentAllergen(row);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    const success = await deleteItem(currentAllergen.allergen_id);
    if (success) {
      setIsDeleteOpen(false);
      setCurrentAllergen(null);
    }
  };

  // Table columns
  const columns = useMemo(() => [
    { name: 'Nombre', selector: row => row.name, sortable: true, grow: 2 },
    {
      name: 'Acciones',
      cell: row => (
        <div className="table-actions">
          <button className="icon-btn delete-icon" onClick={() => openDeleteModal(row)} title="Eliminar">
            <FaTrash />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '100px'
    }
  ], []);


  return (
    <>
      <BasePage
        title="Alérgenos"
        data={filteredData}
        columns={columns}
        loading={loading}
        error={error}
        message={message}
        messageType={messageType}
        filterText={filterText}
        onFilterChange={setFilterText}
        onAdd={openCreateModal}
        addButtonText="Añadir alérgeno"
        searchPlaceholder="Buscar alérgeno..."
        noDataMessage="No hay alérgenos para mostrar"
        onRowClicked={openEditModal}
        showSearch={true}
        filters={[]}
        enableMobileModal={true}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        title="Nuevo alérgeno"
        onClose={() => setIsCreateOpen(false)}
      >
        <form onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Nombre del alérgeno"
            className={`input-field ${hasInputError ? 'input-error' : ''}`}
            value={newName}
            onChange={e => {
              setNewName(e.target.value);
              if (hasInputError) setHasInputError(false);
            }}
            autoFocus
          />
          <div className="modal-actions">
            <button type="button" className="btn cancel" onClick={() => setIsCreateOpen(false)}>Cancelar</button>
            <button type="submit" className="btn add">Añadir</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        title="Editar alérgeno"
        onClose={() => setIsEditOpen(false)}
      >
        <input
          type="text"
          value={editedName}
          onChange={e => setEditedName(e.target.value)}
          className="input-field"
          style={{ width: '100%', marginBottom: '12px' }}
        />
        <div className="modal-actions">
          <button className="btn cancel" onClick={() => setIsEditOpen(false)}>
            Cancelar
          </button>
          <button className="btn edit" onClick={confirmEdit}>
            Guardar
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        title="Confirmar eliminación"
        onClose={() => setIsDeleteOpen(false)}
      >
        <p>
          ¿Seguro que deseas eliminar{' '}
          <strong>{currentAllergen?.name}</strong>?
        </p>
        <div className="modal-actions">
          <button className="btn cancel" onClick={() => setIsDeleteOpen(false)}>
            Cancelar
          </button>
          <button className="btn delete" onClick={confirmDelete}>
            Eliminar
          </button>
        </div>
      </Modal>
    </>
  );
}
