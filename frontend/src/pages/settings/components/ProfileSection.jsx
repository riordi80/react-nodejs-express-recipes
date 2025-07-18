import React, { useState, useEffect } from 'react';
import { FaUser, FaCamera, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';

const ProfileSection = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    language: 'es',
    timezone: 'Europe/Madrid',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [preferencesMessage, setPreferencesMessage] = useState({ type: '', text: '' });
  const [passwordPolicy, setPasswordPolicy] = useState({
    password_min_length: '8',
    password_require_special: false,
    password_require_numbers: true
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        language: user.language || 'es',
        timezone: user.timezone || 'Europe/Madrid'
      }));
    }
    
    // Cargar políticas de contraseña
    fetchPasswordPolicy();
  }, [user]);

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
      // Mantener valores por defecto si hay error
    }
  };

  const validatePassword = (password) => {
    const minLength = parseInt(passwordPolicy.password_min_length);
    const errors = [];

    if (password.length < minLength) {
      errors.push(`La contraseña debe tener al menos ${minLength} caracteres`);
    }

    if (passwordPolicy.password_require_special) {
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      if (!hasSpecial) {
        errors.push('La contraseña debe incluir al menos un carácter especial');
      }
    }

    if (passwordPolicy.password_require_numbers) {
      const hasNumber = /\d/.test(password);
      if (!hasNumber) {
        errors.push('La contraseña debe incluir al menos un número');
      }
    }

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        language: formData.language,
        timezone: formData.timezone
      };

      const response = await api.put('/profile', updateData);
      
      setUser(response.data.user);
      setProfileMessage({ type: 'success', text: 'Información personal actualizada correctamente' });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setProfileMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al actualizar el perfil' 
      });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPreferencesMessage({ type: '', text: '' });

    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        language: formData.language,
        timezone: formData.timezone
      };

      const response = await api.put('/profile', updateData);
      
      setUser(response.data.user);
      setPreferencesMessage({ type: 'success', text: 'Preferencias actualizadas correctamente' });
      setTimeout(() => setPreferencesMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setPreferencesMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al actualizar las preferencias' 
      });
      setTimeout(() => setPreferencesMessage({ type: '', text: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPasswordMessage({ type: '', text: '' });

    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      setLoading(false);
      return;
    }

    // Validar contraseña según políticas configuradas
    const passwordErrors = validatePassword(formData.newPassword);
    if (passwordErrors.length > 0) {
      setPasswordMessage({ type: 'error', text: passwordErrors[0] });
      setLoading(false);
      return;
    }

    try {
      await api.put('/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      setPasswordMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setPasswordMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al cambiar la contraseña' 
      });
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="settings-section">
      <h2>Perfil del Usuario</h2>
      <p>Gestiona tu información personal y preferencias de cuenta</p>

      {/* Información del perfil */}
      <div className="settings-group">
        <h3>Información Personal</h3>
        <div className="description">
          Actualiza tu información básica de perfil
        </div>

        {profileMessage.text && (
          <div className={`notification ${profileMessage.type}`}>
            {profileMessage.text}
          </div>
        )}

        <form onSubmit={handleProfileUpdate}>
          <div className="settings-item">
            <div className="settings-item-info">
              <h4>Nombre</h4>
              <p>Tu nombre de pila</p>
            </div>
            <div className="settings-item-control">
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="settings-input"
                placeholder="Ingresa tu nombre"
                required
              />
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-info">
              <h4>Apellidos</h4>
              <p>Tus apellidos</p>
            </div>
            <div className="settings-item-control">
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="settings-input"
                placeholder="Ingresa tus apellidos"
                required
              />
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-info">
              <h4>Correo electrónico</h4>
              <p>Tu dirección de correo para iniciar sesión</p>
            </div>
            <div className="settings-item-control">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="settings-input"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-info">
              <h4>Rol actual</h4>
              <p>Tu rol en el sistema</p>
            </div>
            <div className="settings-item-control">
              <span className="role-badge">{user?.role || 'No definido'}</span>
            </div>
          </div>

          <div className="settings-actions">
            <button 
              type="submit" 
              className="settings-button"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>

      {/* Cambio de contraseña */}
      <div className="settings-group">
        <h3>Seguridad</h3>
        <div className="description">
          Cambia tu contraseña para mantener tu cuenta segura
        </div>

        {passwordMessage.text && (
          <div className={`notification ${passwordMessage.type}`}>
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange}>
          <div className="settings-item">
            <div className="settings-item-info">
              <h4>Contraseña actual</h4>
              <p>Ingresa tu contraseña actual</p>
            </div>
            <div className="settings-item-control">
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="settings-input"
                  placeholder="Contraseña actual"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-info">
              <h4>Nueva contraseña</h4>
              <p>
                Mínimo {passwordPolicy.password_min_length} caracteres
                {passwordPolicy.password_require_numbers && ', incluir números'}
                {passwordPolicy.password_require_special && ', incluir caracteres especiales'}
              </p>
            </div>
            <div className="settings-item-control">
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="settings-input"
                  placeholder="Nueva contraseña"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-info">
              <h4>Confirmar contraseña</h4>
              <p>Repite la nueva contraseña</p>
            </div>
            <div className="settings-item-control">
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="settings-input"
                  placeholder="Confirmar contraseña"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          </div>

          <div className="settings-actions">
            <button 
              type="submit" 
              className="settings-button"
              disabled={loading || !formData.currentPassword || !formData.newPassword}
            >
              {loading ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </div>

      {/* Preferencias */}
      <div className="settings-group">
        <h3>Preferencias</h3>
        <div className="description">
          Configura tus preferencias de la aplicación
        </div>

        {preferencesMessage.text && (
          <div className={`notification ${preferencesMessage.type}`}>
            {preferencesMessage.text}
          </div>
        )}

        <form onSubmit={handlePreferencesUpdate}>
          <div className="settings-item">
            <div className="settings-item-info">
              <h4>Idioma</h4>
              <p>Selecciona tu idioma preferido</p>
            </div>
            <div className="settings-item-control">
              <select 
                className="settings-select"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
              </select>
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-info">
              <h4>Zona horaria</h4>
              <p>Tu zona horaria local</p>
            </div>
            <div className="settings-item-control">
              <select 
                className="settings-select"
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
              >
                <option value="Europe/Madrid">Madrid (GMT+1)</option>
                <option value="Europe/London">London (GMT+0)</option>
                <option value="Europe/Paris">Paris (GMT+1)</option>
                <option value="Europe/Berlin">Berlin (GMT+1)</option>
                <option value="Europe/Rome">Rome (GMT+1)</option>
                <option value="America/New_York">New York (GMT-5)</option>
                <option value="America/Los_Angeles">Los Angeles (GMT-8)</option>
                <option value="America/Chicago">Chicago (GMT-6)</option>
                <option value="America/Mexico_City">Mexico City (GMT-6)</option>
                <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                <option value="Asia/Shanghai">Shanghai (GMT+8)</option>
                <option value="Australia/Sydney">Sydney (GMT+10)</option>
              </select>
            </div>
          </div>

          <div className="settings-actions">
            <button 
              type="submit" 
              className="settings-button"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar preferencias'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSection;