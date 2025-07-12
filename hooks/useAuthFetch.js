'use client';

import { useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

/**
 * Hook personalizado para realizar peticiones HTTP autenticadas
 * Maneja automáticamente la inclusión de tokens y gestión de errores
 * @returns {Object} Métodos y estado para peticiones autenticadas
 */
export function useAuthFetch() {
  // Accedemos al contexto de autenticación
  const { currentUser } = useAuth();
  const router = useRouter();
  
  // Estado para controlar procesos de carga
  const [loading, setLoading] = useState(false);
  // Estado para manejar errores
  const [error, setError] = useState(null);

  /**
   * Realiza peticiones HTTP con autenticación mediante JWT
   * @param {string} url - URL a la que realizar la petición
   * @param {Object} options - Opciones de la petición fetch
   * @returns {Promise<Object>} Datos de la respuesta
   */
  const authFetch = useCallback(async (url, options = {}) => {
    // Iniciamos la petición
    setLoading(true);
    setError(null);
    
    try {
      // 1. Verificamos que exista un usuario autenticado
      if (!currentUser || !currentUser.access) {
        throw new Error('No hay sesión activa');
      }
      
      // 2. Obtenemos el token de acceso
      const token = currentUser.access;
      
      // 3. Preparamos las cabeceras con autenticación
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      };

      // 4. Realizamos la petición con autenticación
      const response = await fetch(url, {
        ...options,
        headers
      });

      // 5. Verificamos la respuesta
      if (response.status === 401) {
        throw new Error('Sesión expirada');
      }
      
      if (!response.ok) {
        // Intentamos extraer el mensaje de error de la respuesta
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || 
            (typeof errorData === 'object' ? Object.values(errorData).flat().join(', ') : '') || 
            `Error: ${response.status}`;
        } catch (e) {
          errorMessage = `Error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      // 6. Manejo especial para respuestas 204 No Content
      if (response.status === 204) {
        setLoading(false);
        return { success: true, status: 204 };
      }
      
      // 7. Procesamos la respuesta como JSON (si es necesario)
      if (options.parseJson !== false) {
        try {
          const data = await response.json();
          setLoading(false);
          return data;
        } catch (e) {
          console.warn('Error al procesar respuesta JSON:', e);
          setLoading(false);
          // Si hay un error parseando JSON, devolvemos un objeto con información de la respuesta
          return { success: true, status: response.status }; 
        }
      }
      
      // 8. Devolvemos la respuesta directa si no hay que procesar JSON
      setLoading(false);
      return response;
    } catch (error) {
      // 9. Manejamos errores generales
      setLoading(false);
      setError(error.message);
      
      // 10. Para errores de autenticación, redirigimos al login
      if (error.message === 'Sesión expirada' || error.message === 'No hay sesión activa') {
        alert('Tu sesión ha expirado, por favor inicia sesión nuevamente');
        router.push('/login');
      }
      
      // Propagamos el error para manejarlo en el componente
      throw error;
    }
  }, [currentUser, router]);

  // Devolvemos el método y los estados
  return { authFetch, loading, error };
}