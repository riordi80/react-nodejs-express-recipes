import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Modal from '../../../components/modal/Modal';
import Loading from '../../../components/Loading';
import api from '../../../api/axios';

const UsersSection = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'chef',
    password: '',
    is_active: true
  });

  // Verificar si el usuario actual es admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Error al cargar los usuarios' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', formData);
      setMessage({ type: 'success', text: 'Usuario creado correctamente' });
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al crear usuario' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: formData.role,
        is_active: formData.is_active
      };
      
      await api.put(`/users/${selectedUser.user_id}`, updateData);
      setMessage({ type: 'success', text: 'Usuario actualizado correctamente' });
      setShowEditModal(false);
      resetForm();
      fetchUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al actualizar usuario' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/users/${selectedUser.user_id}`);
      setMessage({ type: 'success', text: 'Usuario eliminado correctamente' });
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al eliminar usuario' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      role: 'chef',
      password: '',
      is_active: true
    });
    setSelectedUser(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (userToEdit) => {
    setSelectedUser(userToEdit);
    setFormData({
      first_name: userToEdit.first_name,
      last_name: userToEdit.last_name,
      email: userToEdit.email,
      role: userToEdit.role,
      password: '',
      is_active: userToEdit.is_active
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (userToDelete) => {
    setSelectedUser(userToDelete);
    setShowDeleteModal(true);
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'admin': 'Administrador',
      'chef': 'Chef',
      'inventory_manager': 'Gestor de Inventario',
      'waiter': 'Camarero',
      'supplier_manager': 'Gestor de Proveedores'
    };
    return roleNames[role] || role;
  };

  if (!isAdmin) {
    return (
      <div className="settings-section">
        <h2>Gestión de Usuarios</h2>
        <div className="access-denied">
          <p>No tienes permisos para acceder a esta sección.</p>
          <p>Solo los administradores pueden gestionar usuarios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-section">
      <h2>Gestión de Usuarios</h2>
      <p>Administra los usuarios del sistema y sus permisos</p>

      {message.text && (
        <div className={`notification ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-group">
        <h3>Usuarios Activos</h3>
        <div className="description">
          Lista de usuarios registrados en el sistema
        </div>

        <div className="users-table">
          <div className="users-header">
            <button className="settings-button" onClick={openCreateModal}>
              + Añadir Usuario
            </button>
          </div>

          {loading ? (
            <Loading message="Cargando usuarios..." size="medium" inline />
          ) : (
            <div className="users-list">
              {users.map(userData => (
                <div key={userData.user_id} className="user-item">
                  <div className="user-info">
                    <h4>{userData.first_name} {userData.last_name}</h4>
                    <p>{userData.email}</p>
                    {!userData.is_active && <span className="inactive-badge">Inactivo</span>}
                  </div>
                  <div className="user-role">
                    <span className="role-badge">{getRoleDisplayName(userData.role)}</span>
                  </div>
                  <div className="user-actions">
                    <button 
                      className="settings-button secondary"
                      onClick={() => openEditModal(userData)}
                    >
                      Editar
                    </button>
                    <button 
                      className="settings-button danger"
                      onClick={() => openDeleteModal(userData)}
                      disabled={userData.user_id === user.user_id}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="settings-group">
        <h3>Roles y Permisos</h3>
        <div className="description">
          Configura los permisos para cada rol del sistema
        </div>

        <div className="roles-config">
          <div className="role-config-item">
            <h4>Administrador</h4>
            <p>Acceso completo al sistema</p>
            <div className="permissions">
              <span className="permission-badge">Usuarios</span>
              <span className="permission-badge">Recetas</span>
              <span className="permission-badge">Ingredientes</span>
              <span className="permission-badge">Proveedores</span>
              <span className="permission-badge">Inventario</span>
              <span className="permission-badge">Configuración</span>
            </div>
          </div>

          <div className="role-config-item">
            <h4>Chef</h4>
            <p>Gestión de recetas y menús</p>
            <div className="permissions">
              <span className="permission-badge">Recetas</span>
              <span className="permission-badge">Menús</span>
              <span className="permission-badge">Ingredientes</span>
            </div>
          </div>

          <div className="role-config-item">
            <h4>Gestor de Inventario</h4>
            <p>Gestión de inventario y stock</p>
            <div className="permissions">
              <span className="permission-badge">Inventario</span>
              <span className="permission-badge">Ingredientes</span>
              <span className="permission-badge">Proveedores</span>
            </div>
          </div>

          <div className="role-config-item">
            <h4>Gestor de Proveedores</h4>
            <p>Gestión de proveedores y pedidos</p>
            <div className="permissions">
              <span className="permission-badge">Proveedores</span>
              <span className="permission-badge">Pedidos</span>
              <span className="permission-badge">Ingredientes</span>
            </div>
          </div>

          <div className="role-config-item">
            <h4>Camarero</h4>
            <p>Visualización de menús y recetas</p>
            <div className="permissions">
              <span className="permission-badge">Menús</span>
              <span className="permission-badge">Recetas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear usuario */}
      <Modal 
        isOpen={showCreateModal} 
        title="Crear Nuevo Usuario" 
        onClose={() => setShowCreateModal(false)}
        fullscreenMobile={true}
      >
        <form onSubmit={handleCreateUser}>
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="settings-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Apellidos</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="settings-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="settings-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="settings-input"
                    minLength="6"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Rol</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="settings-select"
                  >
                    <option value="chef">Chef</option>
                    <option value="admin">Administrador</option>
                    <option value="inventory_manager">Gestor de Inventario</option>
                    <option value="waiter">Camarero</option>
                    <option value="supplier_manager">Gestor de Proveedores</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    Usuario activo
                  </label>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn cancel" onClick={() => setShowCreateModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn add">
                    Crear Usuario
                  </button>
                </div>
            </form>
      </Modal>

      {/* Modal para editar usuario */}
      <Modal 
        isOpen={showEditModal} 
        title="Editar Usuario" 
        onClose={() => setShowEditModal(false)}
        fullscreenMobile={true}
      >
        <form onSubmit={handleEditUser}>
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="settings-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Apellidos</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="settings-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="settings-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Rol</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="settings-select"
                  >
                    <option value="chef">Chef</option>
                    <option value="admin">Administrador</option>
                    <option value="inventory_manager">Gestor de Inventario</option>
                    <option value="waiter">Camarero</option>
                    <option value="supplier_manager">Gestor de Proveedores</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    Usuario activo
                  </label>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn cancel" onClick={() => setShowEditModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn edit">
                    Actualizar Usuario
                  </button>
                </div>
            </form>
      </Modal>

      {/* Modal para eliminar usuario */}
      <Modal 
        isOpen={showDeleteModal} 
        title="Eliminar Usuario" 
        onClose={() => setShowDeleteModal(false)}
      >
        <p>¿Estás seguro de que deseas eliminar al usuario?</p>
        <div className="user-details">
          <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>
          <br />
          <span>{selectedUser?.email}</span>
        </div>
        <p className="warning">Esta acción no se puede deshacer.</p>
        <div className="modal-actions">
          <button className="btn cancel" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </button>
          <button className="btn delete" onClick={handleDeleteUser}>
            Eliminar Usuario
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default UsersSection;