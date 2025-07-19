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
  } = usePageState('/allergens');

  // Local state for forms and modals
  const [newName, setNewName] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentAllergen, setCurrentAllergen] = useState(null);
  const [editedName, setEditedName] = useState('');

  // Create handler
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    const success = await createItem({ name: newName.trim() });
    if (success) {
      setNewName('');
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

  // Custom add form component
  const addForm = (
    <form className="add-form" onSubmit={handleAdd}>
      <input
        type="text"
        placeholder="Nuevo alérgeno"
        className="input-field"
        value={newName}
        onChange={e => setNewName(e.target.value)}
      />
      <button type="submit" className="btn add">Añadir</button>
    </form>
  );

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
        searchPlaceholder="Buscar alérgeno..."
        noDataMessage="No hay alérgenos para mostrar"
        actions={addForm}
        onRowClicked={openEditModal}
      />

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
          <button className="btn add" onClick={confirmEdit}>
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
