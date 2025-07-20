import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';  // Para la autenticación
import logo from '../../assets/logo.svg';  // Importar el logo
import Footer from '../../layout/footer/Footer';  // Importar footer
import './Login.css';  // Archivo de estilo CSS

const Login = () => {
  const { login } = useAuth();  // Extraemos la función login del contexto
  const navigate = useNavigate();  // Hook para redirigir a otra página

  const [email, setEmail] = useState('');  // Estado para el email
  const [password, setPassword] = useState('');  // Estado para la contraseña
  const [errorMsg, setErrorMsg] = useState('');  // Mensaje de error si el login falla

  const handleSubmit = async (e) => {
    e.preventDefault();  // Prevenimos que la página se recargue

    setErrorMsg('');  // Limpiamos el mensaje de error al intentar hacer login

    // Intentamos hacer login con las credenciales del usuario
    const res = await login(email, password);
    if (res.success) {
      navigate('/dashboard');  // Si el login es exitoso, redirigimos al Dashboard
    } else {
      setErrorMsg(res.message);  // Si el login falla, mostramos el mensaje de error
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Lado izquierdo con el logo (Desktop) */}
        <div className="left-side">
          <div className="logo-section">
            <img src={logo} alt="RecipesAPI" className="logo-desktop" />
          </div>
        </div>

        {/* Lado derecho con el formulario */}
        <div className="right-side">
          {/* Logo para móvil */}
          <div className="logo-mobile-container">
            <img src={logo} alt="RecipesAPI" className="logo-mobile" />
          </div>
          
          {/* Título para desktop */}
          <h2 className="title desktop-title">Iniciar sesión</h2>
          
          <form className="login-form" onSubmit={handleSubmit}>
            {errorMsg && <p className="error-message">{errorMsg}</p>}  {/* Mostramos el mensaje de error si existe */}

            <input
              type="email"
              id="email"
              name="email"
              placeholder="Correo electrónico"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Contraseña"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button type="submit" className="submit-btn">Iniciar sesión</button>
          </form>
        </div>
      </div>
      
      {/* Footer con estilos especiales para login */}
      <footer className="app-footer login-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-app-name">RecipesAPI</span>
            <span className="footer-version">v1.0.0</span>
          </div>
          
          <div className="footer-copyright">
            <span>© {new Date().getFullYear()} RecipesAPI. Todos los derechos reservados.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
