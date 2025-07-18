import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';  // Para la autenticación
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
    <div className="login-container">
      {/* Lado izquierdo con la imagen */}
      <div className="left-side">
        {/* 
        <img
          src="https://source.unsplash.com/random"
          alt="Background"
          className="background-image"
        />
         */}
      </div>

      {/* Lado derecho con el formulario */}
      <div className="right-side">
        <h2 className="title">Iniciar sesión</h2>
        
        {errorMsg && <p className="error-message">{errorMsg}</p>}  {/* Mostramos el mensaje de error si existe */}

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Correo electrónico"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            required
          />

          <button type="submit" className="submit-btn">Iniciar sesión</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
