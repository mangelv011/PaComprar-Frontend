'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_ROUTES } from '../config/apiConfig';

// Creación del contexto para la autenticación
const AuthContext = createContext();

/**
 * Proveedor de autenticación que gestiona el estado del usuario y métodos relacionados
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export const AuthProvider = ({ children }) => {
  // Estado para almacenar los datos del usuario actual
  const [currentUser, setCurrentUser] = useState(null);
  // Estado para controlar procesos de carga
  const [loading, setLoading] = useState(false);
  // Estado para manejar errores
  const [error, setError] = useState(null);

  // Efecto para cargar el usuario desde localStorage al iniciar
  useEffect(() => {
    // Recupera los datos del usuario almacenados localmente
    const user = JSON.parse(localStorage.getItem('pacomprarUser') || 'null');
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  /**
   * Inicia sesión de usuario
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} - Datos del usuario autenticado
   */
  const login = async (username, password) => {
    // Prepara credenciales de autenticación
    const credentials = { username, password };
    
    try {
      // 1. Solicita token de acceso
      const tokenResponse = await fetch(API_ROUTES.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
  
      if (!tokenResponse.ok) {
        throw new Error('Login failed');
      }
  
      // 2. Obtiene los tokens de acceso y refresco
      const tokenData = await tokenResponse.json();

      // 3. Obtiene datos del perfil del usuario usando el token
      const profileResponse = await fetch(API_ROUTES.USER_PROFILE, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!profileResponse.ok) {
        throw new Error('No se pudo obtener el perfil de usuario');
      }
      
      // 4. Combina tokens con datos del perfil
      const profileData = await profileResponse.json();
      const completeUser = {
        ...tokenData,
        ...profileData
      };
      
      // 5. Guarda datos del usuario y actualiza estado
      localStorage.setItem('pacomprarUser', JSON.stringify(completeUser));
      setCurrentUser(completeUser);
      return completeUser;
      
    } catch (error) {
      console.error('Error en el proceso de login:', error);
      throw error;
    }
  };

  /**
   * Cierra la sesión del usuario actual
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      // 1. Recupera datos del usuario y tokens
      const currentUser = JSON.parse(localStorage.getItem('pacomprarUser') || '{}');
      const token = currentUser?.access || '';
      const refreshToken = currentUser?.refresh || '';

      // 2. Si hay tokens, intenta hacer logout en la API
      if (token && refreshToken) {
        try {
          await fetch(API_ROUTES.LOGOUT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ refresh: refreshToken })
          });
        } catch (apiError) {
          // Continúa con el logout local aunque falle el API
          console.log('API logout call failed, but continuing with local logout');
        }
      }
    } finally {
      // 3. Siempre elimina los datos locales y resetea el estado
      localStorage.removeItem('pacomprarUser');
      setCurrentUser(null);
    }
  };

  /**
   * Obtiene los datos de perfil del usuario actual
   * @returns {Promise<Object>} Datos del perfil de usuario
   */
  const getUserProfile = async () => {
    try {
      setError(null);
      
      // 1. Verifica si hay un usuario autenticado
      if (!currentUser) {
        throw new Error('No hay sesión activa');
      }
      
      // 2. Solicita el perfil del usuario
      const response = await fetch(API_ROUTES.USER_PROFILE, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentUser.access}`,
          'Content-Type': 'application/json'
        }
      });
      
      // 3. Maneja errores de respuesta
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada o inválida');
        }
        throw new Error('Error al obtener el perfil de usuario');
      }
      
      // 4. Devuelve los datos del perfil
      return await response.json();
    } catch (error) {
      // 5. Gestiona y propaga el error
      setError(error.message);
      throw error;
    }
  };
  
  /**
   * Actualiza los datos de perfil del usuario
   * @param {Object} userData - Datos actualizados del usuario
   * @returns {Promise<Object>} Datos actualizados del perfil
   */
  const updateUserProfile = async (userData) => {
    try {
      setError(null);
      
      // 1. Verifica si hay un usuario autenticado
      if (!currentUser) {
        throw new Error('No hay sesión activa');
      }
      
      // 2. Envía los datos actualizados
      const response = await fetch(API_ROUTES.USER_PROFILE, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.access}`
        },
        body: JSON.stringify(userData)
      });
      
      // 3. Maneja errores de respuesta
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      
      // 4. Devuelve los datos actualizados
      return await response.json();
    } catch (error) {
      // 5. Gestiona y propaga el error
      setError(error.message);
      throw error;
    }
  };

  // Proporciona el contexto y sus valores a los componentes hijos
  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      loading, 
      error, 
      login, 
      logout, 
      getUserProfile, 
      updateUserProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook personalizado para acceder al contexto de autenticación
 * @returns {Object} El contexto de autenticación
 */
export const useAuth = () => {
  return useContext(AuthContext);
};
