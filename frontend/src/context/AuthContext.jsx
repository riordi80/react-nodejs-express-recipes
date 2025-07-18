import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Esperar un momento para que axios configure la URL correcta
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const res = await api.get('/me'); // el backend revisa la cookie
        setUser(res.data.user);
        setIsAuthenticated(true);
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/login', { email, password }); // backend envía cookie
      
      // Obtener datos del usuario de la respuesta del login
      if (response.data.user) {
        setUser(response.data.user);
      }
      
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión',
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout'); // backend borra la cookie
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, checkingAuth, user, setUser, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
