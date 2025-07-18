import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import { FaClock, FaFolder, FaExclamationTriangle } from 'react-icons/fa';

const DataSection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState({ type: '', text: '' });
  const [backupMessage, setBackupMessage] = useState({ type: '', text: '' });
  const [generalMessage, setGeneralMessage] = useState({ type: '', text: '' });
  const [backupSettings, setBackupSettings] = useState({
    auto_enabled: false,
    frequency: 'weekly',
    last_backup: null,
    last_backup_formatted: 'Nunca'
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showBackupsList, setShowBackupsList] = useState(false);
  const [backupsList, setBackupsList] = useState([]);
  const [backupStats, setBackupStats] = useState({});

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchBackupStatus();
    }
  }, [isAdmin]);

  const fetchBackupStatus = async () => {
    try {
      const response = await api.get('/data/backup/status');
      setBackupSettings(response.data);
    } catch (error) {
      console.error('Error fetching backup status:', error);
    }
  };

  const handleExport = async (type, format) => {
    if (!isAdmin) {
      setExportMessage({ type: 'error', text: 'No tienes permisos para exportar datos' });
      setTimeout(() => setExportMessage({ type: '', text: '' }), 5000);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/data/export/${type}?format=${format}`, {
        responseType: 'blob'
      });

      // Crear URL para descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Obtener nombre del archivo del header
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `${type}.${format}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setExportMessage({ type: 'success', text: `${type} exportado correctamente` });
      setTimeout(() => setExportMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setExportMessage({ 
        type: 'error', 
        text: `Error al exportar ${type}: ${error.response?.data?.message || error.message}` 
      });
      setTimeout(() => setExportMessage({ type: '', text: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupNow = async () => {
    if (!isAdmin) {
      setBackupMessage({ type: 'error', text: 'No tienes permisos para crear backups' });
      setTimeout(() => setBackupMessage({ type: '', text: '' }), 5000);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/data/backup', {
        responseType: 'blob'
      });

      // Crear URL para descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `backup_${new Date().toISOString().split('T')[0]}.json`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setBackupMessage({ type: 'success', text: 'Backup creado correctamente' });
      setTimeout(() => setBackupMessage({ type: '', text: '' }), 3000);
      
      // Actualizar estado del backup
      fetchBackupStatus();
    } catch (error) {
      setBackupMessage({ 
        type: 'error', 
        text: `Error al crear backup: ${error.response?.data?.message || error.message}` 
      });
      setTimeout(() => setBackupMessage({ type: '', text: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupSettingsChange = async (field, value) => {
    if (!isAdmin) return;

    try {
      const updatedSettings = {
        ...backupSettings,
        [field]: value
      };
      
      await api.put('/data/backup/settings', {
        auto_enabled: updatedSettings.auto_enabled,
        frequency: updatedSettings.frequency
      });

      setBackupSettings(updatedSettings);
      setBackupMessage({ type: 'success', text: 'Configuración de backup actualizada' });
      setTimeout(() => setBackupMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setBackupMessage({ 
        type: 'error', 
        text: `Error al actualizar configuración: ${error.response?.data?.message || error.message}` 
      });
      setTimeout(() => setBackupMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleResetApplication = async () => {
    if (!isAdmin) {
      setGeneralMessage({ type: 'error', text: 'No tienes permisos para restablecer la aplicación' });
      setTimeout(() => setGeneralMessage({ type: '', text: '' }), 5000);
      return;
    }

    try {
      setLoading(true);
      await api.post('/data/reset', {
        confirm: 'RESET_APPLICATION'
      });

      setGeneralMessage({ type: 'success', text: 'Aplicación restablecida correctamente' });
      setShowResetConfirm(false);
      
      // Recargar página después de 3 segundos
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      setGeneralMessage({ 
        type: 'error', 
        text: `Error al restablecer aplicación: ${error.response?.data?.message || error.message}` 
      });
      setTimeout(() => setGeneralMessage({ type: '', text: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  const fetchBackupsList = async () => {
    if (!isAdmin) return;
    
    try {
      const response = await api.get('/data/backup/list');
      setBackupsList(response.data.backups);
      setBackupStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching backups list:', error);
      setBackupMessage({ 
        type: 'error', 
        text: 'Error al cargar lista de backups' 
      });
      setTimeout(() => setBackupMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleShowBackupsList = async () => {
    setShowBackupsList(true);
    await fetchBackupsList();
  };

  const handleDownloadBackup = async (filename) => {
    if (!isAdmin) return;
    
    try {
      const response = await api.get(`/data/backup/download/${filename}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setBackupMessage({ type: 'success', text: 'Backup descargado correctamente' });
      setTimeout(() => setBackupMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setBackupMessage({ 
        type: 'error', 
        text: `Error al descargar backup: ${error.response?.data?.message || error.message}` 
      });
      setTimeout(() => setBackupMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleDeleteBackup = async (filename) => {
    if (!isAdmin) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el backup "${filename}"?`)) {
      return;
    }
    
    try {
      await api.delete(`/data/backup/${filename}`);
      setBackupMessage({ type: 'success', text: 'Backup eliminado correctamente' });
      setTimeout(() => setBackupMessage({ type: '', text: '' }), 3000);
      
      // Actualizar lista
      await fetchBackupsList();
    } catch (error) {
      setBackupMessage({ 
        type: 'error', 
        text: `Error al eliminar backup: ${error.response?.data?.message || error.message}` 
      });
      setTimeout(() => setBackupMessage({ type: '', text: '' }), 5000);
    }
  };

  return (
    <div className="settings-section">
      <h2>Gestión de Datos</h2>
      <p>Administra la importación, exportación y respaldo de datos</p>

      {generalMessage.text && (
        <div className={`notification ${generalMessage.type}`}>
          {generalMessage.text}
        </div>
      )}

      <div className="settings-group">
        <h3>Exportación de Datos</h3>
        <div className="description">
          Descarga tus datos en diferentes formatos
        </div>

        {exportMessage.text && (
          <div className={`notification ${exportMessage.type}`}>
            {exportMessage.text}
          </div>
        )}

        <div className="export-options">
          <div className="export-item">
            <div className="export-info">
              <h4>Exportar Recetas</h4>
              <p>Descargar todas las recetas con sus ingredientes</p>
            </div>
            <div className="export-actions">
              <button 
                className="settings-button secondary"
                onClick={() => handleExport('recipes', 'json')}
                disabled={!isAdmin || loading}
              >
                JSON
              </button>
              <button 
                className="settings-button secondary"
                onClick={() => handleExport('recipes', 'csv')}
                disabled={!isAdmin || loading}
              >
                CSV
              </button>
            </div>
          </div>

          <div className="export-item">
            <div className="export-info">
              <h4>Exportar Ingredientes</h4>
              <p>Descargar inventario de ingredientes</p>
            </div>
            <div className="export-actions">
              <button 
                className="settings-button secondary"
                onClick={() => handleExport('ingredients', 'json')}
                disabled={!isAdmin || loading}
              >
                JSON
              </button>
              <button 
                className="settings-button secondary"
                onClick={() => handleExport('ingredients', 'csv')}
                disabled={!isAdmin || loading}
              >
                CSV
              </button>
            </div>
          </div>

          <div className="export-item">
            <div className="export-info">
              <h4>Exportar Proveedores</h4>
              <p>Descargar información de proveedores</p>
            </div>
            <div className="export-actions">
              <button 
                className="settings-button secondary"
                onClick={() => handleExport('suppliers', 'json')}
                disabled={!isAdmin || loading}
              >
                JSON
              </button>
              <button 
                className="settings-button secondary"
                onClick={() => handleExport('suppliers', 'csv')}
                disabled={!isAdmin || loading}
              >
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h3>Importación de Datos</h3>
        <div className="description">
          Importa datos desde archivos externos
        </div>

        <div className="import-options">
          <div className="import-item">
            <div className="import-info">
              <h4>Importar Recetas</h4>
              <p>Subir recetas desde archivo JSON o CSV</p>
            </div>
            <div className="import-actions">
              <input type="file" accept=".json,.csv" className="file-input" />
              <button className="settings-button">
                Seleccionar archivo
              </button>
            </div>
          </div>

          <div className="import-item">
            <div className="import-info">
              <h4>Importar Ingredientes</h4>
              <p>Subir ingredientes desde archivo</p>
            </div>
            <div className="import-actions">
              <input type="file" accept=".json,.csv,.xlsx" className="file-input" />
              <button className="settings-button">
                Seleccionar archivo
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h3>Copias de Seguridad</h3>
        <div className="description">
          Gestiona las copias de seguridad de la aplicación
        </div>

        {backupMessage.text && (
          <div className={`notification ${backupMessage.type}`}>
            {backupMessage.text}
          </div>
        )}

        <div className="backup-info">
          <div className="backup-status">
            <h4>Última copia de seguridad</h4>
            <p>{backupSettings.last_backup_formatted}</p>
          </div>
          <div className="backup-actions">
            <button 
              className="settings-button"
              onClick={handleBackupNow}
              disabled={!isAdmin || loading}
            >
              {loading ? 'Creando...' : 'Crear copia ahora'}
            </button>
            <button 
              className="settings-button secondary"
              onClick={handleShowBackupsList}
              disabled={!isAdmin || loading}
            >
              Ver backups almacenados
            </button>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Copias automáticas</h4>
            <p>Crear copias de seguridad automáticamente</p>
          </div>
          <div className="settings-item-control">
            <div 
              className={`settings-toggle ${backupSettings.auto_enabled ? 'active' : ''}`}
              onClick={() => isAdmin && handleBackupSettingsChange('auto_enabled', !backupSettings.auto_enabled)}
              style={{ cursor: isAdmin ? 'pointer' : 'not-allowed', opacity: isAdmin ? 1 : 0.5 }}
            ></div>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Frecuencia de copias</h4>
            <p>Con qué frecuencia crear copias automáticas</p>
          </div>
          <div className="settings-item-control">
            <select 
              className="settings-select"
              value={backupSettings.frequency}
              onChange={(e) => handleBackupSettingsChange('frequency', e.target.value)}
              disabled={!isAdmin || !backupSettings.auto_enabled}
            >
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
              <option value="monthly">Mensualmente</option>
            </select>
          </div>
        </div>

        {backupSettings.auto_enabled && (
          <div className="backup-schedule-info">
            <div className="schedule-info-card">
              <h4><FaClock style={{ color: '#64748b' }} /> Horario de copias automáticas</h4>
              <div className="schedule-details">
                {backupSettings.frequency === 'daily' && (
                  <p>Las copias se crearán <strong>todos los días a las 2:00 AM</strong> (zona horaria: Europe/Madrid)</p>
                )}
                {backupSettings.frequency === 'weekly' && (
                  <p>Las copias se crearán <strong>todos los domingos a las 2:00 AM</strong> (zona horaria: Europe/Madrid)</p>
                )}
                {backupSettings.frequency === 'monthly' && (
                  <p>Las copias se crearán <strong>el día 1 de cada mes a las 2:00 AM</strong> (zona horaria: Europe/Madrid)</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="settings-group danger-zone">
        <h3>Zona Peligrosa</h3>
        <div className="description">
          Acciones irreversibles que afectan todos los datos
        </div>

        <div className="danger-actions">
          <div className="danger-item">
            <div className="danger-info">
              <h4>Restablecer aplicación</h4>
              <p>Eliminar todos los datos y volver a la configuración inicial</p>
            </div>
            <div className="danger-control">
              <button 
                className="settings-button danger"
                onClick={() => setShowResetConfirm(true)}
                disabled={!isAdmin || loading}
              >
                Restablecer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de reset */}
      {showResetConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3><FaExclamationTriangle style={{ color: '#ef4444' }} /> Confirmar Restablecimiento</h3>
              <button className="modal-close" onClick={() => setShowResetConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>ADVERTENCIA:</strong> Esta acción es irreversible.</p>
              <p>Se eliminarán todos los datos de:</p>
              <ul>
                <li>Recetas y sus ingredientes</li>
                <li>Ingredientes y proveedores</li>
                <li>Menús y categorías</li>
                <li>Movimientos de inventario</li>
                <li>Todos los usuarios excepto tu cuenta</li>
              </ul>
              <p>¿Estás seguro de que quieres continuar?</p>
            </div>
            <div className="modal-footer">
              <button 
                className="settings-button secondary" 
                onClick={() => setShowResetConfirm(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                className="settings-button danger" 
                onClick={handleResetApplication}
                disabled={loading}
              >
                {loading ? 'Restableciendo...' : 'Sí, restablecer aplicación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Lista de Backups */}
      {showBackupsList && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3><FaFolder style={{ color: '#64748b' }} /> Backups Almacenados</h3>
              <button className="modal-close" onClick={() => setShowBackupsList(false)}>×</button>
            </div>
            <div className="modal-body">
              {backupStats.total_backups > 0 && (
                <div className="backup-stats" style={{ 
                  background: '#f8fafc', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Estadísticas</h4>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#64748b' }}>
                    <span>Total: {backupStats.total_backups} backups</span>
                    <span>Tamaño: {backupStats.formatted_total_size}</span>
                  </div>
                </div>
              )}
              
              {backupsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <p>No hay backups almacenados</p>
                  <p style={{ fontSize: '14px' }}>Crea un backup manual o activa las copias automáticas</p>
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {backupsList.map((backup) => (
                    <div key={backup.filename} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      marginBottom: '8px',
                      background: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                          {backup.filename}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          {backup.formatted_date} • {backup.formatted_size}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="settings-button secondary"
                          onClick={() => handleDownloadBackup(backup.filename)}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          Descargar
                        </button>
                        <button 
                          className="settings-button danger"
                          onClick={() => handleDeleteBackup(backup.filename)}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="settings-button secondary" 
                onClick={() => setShowBackupsList(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSection;