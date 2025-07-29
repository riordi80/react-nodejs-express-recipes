// src/pages/allergens/Allergens.jsx
import React, { useState, useMemo } from 'react';
import TableActions from '../../components/table/TableActions';
import BasePage from '../../components/base-page/BasePage';
import Modal from '../../components/modal/Modal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { FormField, FormInput } from '../../components/form/FormField';
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
        <TableActions
          row={row}
          onDelete={openDeleteModal}
          showDelete={true}
          deleteTitle="Eliminar alérgeno"
        />
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
        subtitle="Administra la información de alérgenos para tus recetas"
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
          <FormField label="Nombre del alérgeno" required>
            <FormInput
              value={newName}
              onChange={e => {
                setNewName(e.target.value);
                if (hasInputError) setHasInputError(false);
              }}
              placeholder="Escribe el nombre del alérgeno"
              hasError={hasInputError}
              autoFocus
            />
          </FormField>
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
        <FormField label="Nombre del alérgeno" required>
          <FormInput
            value={editedName}
            onChange={e => setEditedName(e.target.value)}
            placeholder="Escribe el nombre del alérgeno"
          />
        </FormField>
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
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar "${currentAllergen?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </>
  );
}
