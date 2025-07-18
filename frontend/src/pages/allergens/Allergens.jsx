// src/pages/allergens/Allergens.jsx
import React, { useEffect, useState, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import { FaEdit, FaTrash } from 'react-icons/fa';
import api from '../../api/axios';
import Modal from '../../components/modal/Modal';
import './Allergens.css';

export default function Allergens() {
  const [allergens, setAllergens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  // Modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentAllergen, setCurrentAllergen] = useState(null);
  const [editedName, setEditedName] = useState('');

  // Fetch
  const fetchAllergens = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/allergens');
      setAllergens(data);
    } catch {
      setError('Error al obtener alérgenos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllergens();
  }, []);

  // Notifications
  const notify = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 3000);
  };

  // Create
  const handleAdd = async e => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api.post('/allergens', { name: newName.trim() });
      notify('Alérgeno creado correctamente', 'success');
      setNewName('');
      fetchAllergens();
    } catch (err) {
      notify(err.response?.data?.message || 'Error al crear', 'error');
    }
  };

  // Open Edit Modal
  const openEditModal = row => {
    setCurrentAllergen(row);
    setEditedName(row.name);
    setIsEditOpen(true);
  };

  // Confirm Edit
  const confirmEdit = async () => {
    if (!editedName.trim()) return;
    try {
      await api.put(`/allergens/${currentAllergen.allergen_id}`, { name: editedName.trim() });
      notify('Alérgeno actualizado', 'success');
      fetchAllergens();
    } catch {
      notify('Error al actualizar', 'error');
    } finally {
      setIsEditOpen(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = row => {
    setCurrentAllergen(row);
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    try {
      await api.delete(`/allergens/${currentAllergen.allergen_id}`);
      notify('Alérgeno eliminado', 'success');
      fetchAllergens();
    } catch {
      notify('Error al eliminar', 'error');
    } finally {
      setIsDeleteOpen(false);
    }
  };

  // Columns
  const columns = useMemo(() => [
    { name: 'Nombre', selector: row => row.name, sortable: true, grow: 2 },
    {
      name: 'Acciones',
      cell: row => (
        <div className="table-actions">
          <button className="icon-btn edit-icon" onClick={() => openEditModal(row)} title="Editar">
            <FaEdit />
          </button>
          <button className="icon-btn delete-icon" onClick={() => openDeleteModal(row)} title="Eliminar">
            <FaTrash />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '150px'
    }
  ], []);

  // Filtered data
  const filtered = useMemo(
    () => allergens.filter(a => a.name.toLowerCase().includes(filterText.toLowerCase())),
    [allergens, filterText]
  );

  return (
    <div className="allergens-container">
      <div className="allergens-content">
        <h2>Lista de alérgenos</h2>

        {message && (
          <div className={`notification ${messageType}`}>
            {message}
          </div>
        )}
        {error && <p className="error">{error}</p>}

        {/* Subheader: búsqueda + formulario */}
        <div className="subheader">
        <input
          type="text"
          placeholder="Buscar alérgeno..."
          className="search-input"
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
        />
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
      </div>

      {/* DataTable with prop filtering */}
      <StyleSheetManager shouldForwardProp={prop => isPropValid(prop)}>
        <DataTable
          className="allergens-table"
          columns={columns}
          data={filtered}
          progressPending={loading}
          progressComponent={
            <div className="loading-overlay">
              <div className="loading-text">
              Cargando...
              </div>
            </div>
          }
          noDataComponent="No hay alérgenos para mostrar"
          pagination
          paginationPerPage={15}
          paginationComponentOptions={{
            rowsPerPageText: 'Filas por página',
            rangeSeparatorText: 'de',
            noRowsPerPage: false,
            selectAllRowsItem: true,
            selectAllRowsItemText: 'Todos'
          }}
          highlightOnHover
          pointerOnHover
          selectableRows={false}
          noHeader
        />
      </StyleSheetManager>

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
      </div>
    </div>
  );
}
