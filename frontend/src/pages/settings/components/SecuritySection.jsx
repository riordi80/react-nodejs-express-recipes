import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Modal from '../../../components/modal/Modal';
import api from '../../../api/axios';

const SecuritySection = () => {
  const { user } = useAuth();
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSummary, setAuditSummary] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [logsFilter, setLogsFilter] = useState({
    action: '',
    table_name: '',
    days: '7'
  });

  // Estados para políticas de contraseñas
  const [passwordPolicy, setPasswordPolicy] = useState({
    password_min_length: '8',
    password_require_special: false,
    password_require_numbers: true
  });

  // Estados para políticas de sesiones
  const [sessionPolicy, setSessionPolicy] = useState({
    session_timeout: '120',
    session_auto_close: false
  });

  const [settingsLoading, setSettingsLoading] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchPasswordPolicy();
      fetchSessionPolicy();
    }
  }, [isAdmin]);

  const fetchPasswordPolicy = async () => {
    try {
      const response = await api.get('/settings/password-policy');
      setPasswordPolicy({
        password_min_length: response.data.password_min_length,
        password_require_special: response.data.password_require_special === 'true',
        password_require_numbers: response.data.password_require_numbers === 'true'
      });
    } catch (error) {
      console.error('Error fetching password policy:', error);
    }
  };

  const fetchSessionPolicy = async () => {
    try {
      const response = await api.get('/settings/session-policy');
      setSessionPolicy({
        session_timeout: response.data.session_timeout,
        session_auto_close: response.data.session_auto_close === 'true'
      });
    } catch (error) {
      console.error('Error fetching session policy:', error);
    }
  };

  const handlePasswordPolicyChange = (field, value) => {
    setPasswordPolicy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSessionPolicyChange = (field, value) => {
    setSessionPolicy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const savePasswordPolicy = async () => {
    try {
      setSettingsLoading(true);
      await api.put('/settings/password-policy', passwordPolicy);
      setMessage({ type: 'success', text: 'Política de contraseñas actualizada correctamente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Error al actualizar política de contraseñas: ' + (error.response?.data?.message || error.message)
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSessionPolicy = async () => {
    try {
      setSettingsLoading(true);
      await api.put('/settings/session-policy', sessionPolicy);
      setMessage({ type: 'success', text: 'Política de sesiones actualizada correctamente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Error al actualizar política de sesiones: ' + (error.response?.data?.message || error.message)
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchAuditLogs = async (filterOverride = null) => {
    if (!isAdmin) return;
    
    const currentFilter = filterOverride || logsFilter;
    
    try {
      setLogsLoading(true);
      
      const [logsResponse, summaryResponse] = await Promise.all([
        api.get('/audit/logs', {
          params: {
            limit: 100,
            action: currentFilter.action || null,
            table_name: currentFilter.table_name || null
          }
        }),
        api.get('/audit/summary', {
          params: { days: currentFilter.days }
        })
      ]);
      
      setAuditLogs(logsResponse.data.logs);
      setAuditSummary(summaryResponse.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error al cargar los logs de auditoría: ' + (error.response?.data?.message || error.message)
      });
    } finally {
      setLogsLoading(false);
    }
  };

  const handleShowLogs = async () => {
    if (!isAdmin) {
      setMessage({ 
        type: 'error', 
        text: 'No tienes permisos para ver los logs de seguridad' 
      });
      return;
    }
    
    setShowLogsModal(true);
    await fetchAuditLogs();
  };


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setLogsFilter(prev => {
      const newFilter = {
        ...prev,
        [name]: value
      };
      // Aplicar filtros automáticamente después de actualizar el estado
      setTimeout(() => fetchAuditLogs(newFilter), 0);
      return newFilter;
    });
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create': return '#10b981';
      case 'update': return '#f59e0b';
      case 'delete': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  return (
    <div className="settings-section">
      <h2>Configuración de Seguridad</h2>
      <p>Gestiona la seguridad y privacidad de la aplicación</p>

      {message.text && (
        <div className={`notification ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-group">
        <h3>Políticas de Sesión</h3>
        <div className="description">
          Configura el comportamiento de las sesiones de usuario
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Tiempo de expiración</h4>
            <p>Tiempo antes de que expire una sesión inactiva</p>
          </div>
          <div className="settings-item-control">
            <select 
              className="settings-select"
              value={sessionPolicy.session_timeout}
              onChange={(e) => handleSessionPolicyChange('session_timeout', e.target.value)}
              disabled={!isAdmin}
            >
              <option value="30">30 minutos</option>
              <option value="60">1 hora</option>
              <option value="120">2 horas</option>
              <option value="240">4 horas</option>
              <option value="480">8 horas</option>
            </select>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Cerrar sesión automáticamente</h4>
            <p>Cerrar sesión cuando se cierre el navegador</p>
          </div>
          <div className="settings-item-control">
            <div 
              className={`settings-toggle ${sessionPolicy.session_auto_close ? 'active' : ''}`}
              onClick={() => isAdmin && handleSessionPolicyChange('session_auto_close', !sessionPolicy.session_auto_close)}
              style={{ cursor: isAdmin ? 'pointer' : 'not-allowed', opacity: isAdmin ? 1 : 0.5 }}
            ></div>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h3>Políticas de Contraseña</h3>
        <div className="description">
          Configura los requisitos para las contraseñas
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Longitud mínima</h4>
            <p>Número mínimo de caracteres</p>
          </div>
          <div className="settings-item-control">
            <select 
              className="settings-select"
              value={passwordPolicy.password_min_length}
              onChange={(e) => handlePasswordPolicyChange('password_min_length', e.target.value)}
              disabled={!isAdmin}
            >
              <option value="6">6 caracteres</option>
              <option value="8">8 caracteres</option>
              <option value="10">10 caracteres</option>
              <option value="12">12 caracteres</option>
            </select>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Requerir caracteres especiales</h4>
            <p>Obligar el uso de símbolos en las contraseñas</p>
          </div>
          <div className="settings-item-control">
            <div 
              className={`settings-toggle ${passwordPolicy.password_require_special ? 'active' : ''}`}
              onClick={() => isAdmin && handlePasswordPolicyChange('password_require_special', !passwordPolicy.password_require_special)}
              style={{ cursor: isAdmin ? 'pointer' : 'not-allowed', opacity: isAdmin ? 1 : 0.5 }}
            ></div>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Requerir números</h4>
            <p>Obligar el uso de números en las contraseñas</p>
          </div>
          <div className="settings-item-control">
            <div 
              className={`settings-toggle ${passwordPolicy.password_require_numbers ? 'active' : ''}`}
              onClick={() => isAdmin && handlePasswordPolicyChange('password_require_numbers', !passwordPolicy.password_require_numbers)}
              style={{ cursor: isAdmin ? 'pointer' : 'not-allowed', opacity: isAdmin ? 1 : 0.5 }}
            ></div>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h3>Registro de Actividad</h3>
        <div className="description">
          Configura qué actividades se registran en el sistema
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Registrar inicios de sesión</h4>
            <p>Guardar registro de todos los inicios de sesión</p>
          </div>
          <div className="settings-item-control">
            <div className="settings-toggle active"></div>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Registrar cambios de datos</h4>
            <p>Guardar registro de modificaciones importantes</p>
          </div>
          <div className="settings-item-control">
            <div className="settings-toggle active"></div>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button 
          className="settings-button"
          onClick={async () => {
            await savePasswordPolicy();
            await saveSessionPolicy();
          }}
          disabled={!isAdmin || settingsLoading}
        >
          {settingsLoading ? 'Guardando...' : 'Guardar configuración'}
        </button>
        <button 
          className="settings-button secondary"
          onClick={handleShowLogs}
          disabled={!isAdmin}
        >
          Ver logs de seguridad
        </button>
      </div>

      {/* Modal de Logs de Seguridad */}
      <Modal 
        isOpen={showLogsModal} 
        title="Logs de Seguridad" 
        onClose={() => setShowLogsModal(false)}
        fullscreenMobile={true}
      >
        <div className="audit-logs-modal">
              {/* Filtros */}
              <div className="audit-filters">
                <div className="filter-group">
                  <label>Acción:</label>
                  <select 
                    name="action" 
                    value={logsFilter.action} 
                    onChange={handleFilterChange}
                    className="settings-select"
                  >
                    <option value="">Todas</option>
                    <option value="create">Crear</option>
                    <option value="update">Actualizar</option>
                    <option value="delete">Eliminar</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Tabla:</label>
                  <select 
                    name="table_name" 
                    value={logsFilter.table_name} 
                    onChange={handleFilterChange}
                    className="settings-select"
                  >
                    <option value="">Todas</option>
                    <option value="USERS">Usuarios</option>
                    <option value="RECIPES">Recetas</option>
                    <option value="INGREDIENTS">Ingredientes</option>
                    <option value="SUPPLIERS">Proveedores</option>
                    <option value="MENUS">Menús</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Período:</label>
                  <select 
                    name="days" 
                    value={logsFilter.days} 
                    onChange={handleFilterChange}
                    className="settings-select"
                  >
                    <option value="1">Último día</option>
                    <option value="7">Última semana</option>
                    <option value="30">Último mes</option>
                    <option value="90">Últimos 3 meses</option>
                  </select>
                </div>
              </div>

              {/* Resumen */}
              {auditSummary && (
                <div className="audit-summary">
                  <h4>Resumen de Actividad ({auditSummary.period_days} días)</h4>
                  <div className="summary-cards">
                    <div className="summary-card">
                      <h5>Por Acción</h5>
                      <div className="summary-items">
                        {auditSummary.summary.by_action.map(item => (
                          <div key={item.action} className="summary-item">
                            <span 
                              className="action-badge" 
                              style={{ backgroundColor: getActionColor(item.action) }}
                            >
                              {item.action}
                            </span>
                            <span className="count">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="summary-card">
                      <h5>Por Tabla</h5>
                      <div className="summary-items">
                        {auditSummary.summary.by_table.map(item => (
                          <div key={item.table_name} className="summary-item">
                            <span className="table-name">{item.table_name}</span>
                            <span className="count">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de Logs */}
              <div className="audit-logs-container">
                {logsLoading ? (
                  <div className="loading">Cargando logs...</div>
                ) : auditLogs.length > 0 ? (
                  <div className="audit-logs-table">
                    <div className="audit-logs-header">
                      <div className="col-timestamp">Fecha</div>
                      <div className="col-user">Usuario</div>
                      <div className="col-action">Acción</div>
                      <div className="col-table">Tabla</div>
                      <div className="col-details">Detalles</div>
                    </div>
                    
                    <div className="audit-logs-body">
                      {auditLogs.map(log => (
                        <div key={log.audit_id} className="audit-log-row">
                          <div className="col-timestamp">
                            {formatDate(log.timestamp)}
                          </div>
                          <div className="col-user">
                            <div className="user-info">
                              <strong>{log.user_name || 'Sistema'}</strong>
                              <small>{log.user_email}</small>
                            </div>
                          </div>
                          <div className="col-action">
                            <span 
                              className="action-badge" 
                              style={{ backgroundColor: getActionColor(log.action) }}
                            >
                              {log.action}
                            </span>
                          </div>
                          <div className="col-table">
                            {log.table_name}
                          </div>
                          <div className="col-details">
                            {log.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="no-logs">No hay logs para mostrar</div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn cancel" 
                  onClick={() => setShowLogsModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
      </Modal>
    </div>
  );
};

export default SecuritySection;