import React, { useState } from 'react';
import { useSettings } from '../../../context/SettingsContext';

const SystemSection = () => {
  const { settings, updateSetting } = useSettings();
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSettingChange = (key, value) => {
    updateSetting(key, value);
    setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };
  return (
    <div className="settings-section">
      <h2>Configuración del Sistema</h2>
      <p>Configura las opciones generales de la aplicación</p>

      {message.text && (
        <div className={`notification ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-group">
        <h3>Configuración Regional</h3>
        <div className="description">
          Configura el formato de datos según tu región
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Unidades de medida</h4>
            <p>Sistema de medidas predeterminado</p>
          </div>
          <div className="settings-item-control">
            <select 
              className="settings-select"
              value={settings.units}
              onChange={(e) => handleSettingChange('units', e.target.value)}
            >
              <option value="metric">Métrico (gramos, litros)</option>
              <option value="imperial">Imperial (onzas, libras)</option>
            </select>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Formato de fecha</h4>
            <p>Cómo se muestran las fechas en la aplicación</p>
          </div>
          <div className="settings-item-control">
            <select 
              className="settings-select"
              value={settings.dateFormat}
              onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
            >
              <option value="dd/mm/yyyy">DD/MM/YYYY</option>
              <option value="mm/dd/yyyy">MM/DD/YYYY</option>
              <option value="yyyy-mm-dd">YYYY-MM-DD</option>
            </select>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Moneda</h4>
            <p>Moneda predeterminada para precios</p>
          </div>
          <div className="settings-item-control">
            <select 
              className="settings-select"
              value={settings.currency}
              onChange={(e) => handleSettingChange('currency', e.target.value)}
            >
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dólar ($)</option>
              <option value="GBP">Libra (£)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h3>Configuración de Datos</h3>
        <div className="description">
          Opciones para la gestión de datos de la aplicación
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Tamaño de página</h4>
            <p>Número de elementos por página en las tablas</p>
          </div>
          <div className="settings-item-control">
            <select 
              className="settings-select"
              value={settings.pageSize}
              onChange={(e) => handleSettingChange('pageSize', parseInt(e.target.value))}
            >
              <option value="10">10 elementos</option>
              <option value="25">25 elementos</option>
              <option value="50">50 elementos</option>
              <option value="100">100 elementos</option>
            </select>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Búsqueda automática</h4>
            <p>Buscar automáticamente mientras escribes</p>
          </div>
          <div className="settings-item-control">
            <div 
              className={`settings-toggle ${settings.autoSearch ? 'active' : ''}`}
              onClick={() => handleSettingChange('autoSearch', !settings.autoSearch)}
            ></div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SystemSection;