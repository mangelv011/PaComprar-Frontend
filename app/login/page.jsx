'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css'; 
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('Intentando iniciar sesión con:', { username, password });
      
      // Usar la función login del contexto de autenticación
      await login(username, password);
      
      console.log('Login exitoso');
      router.push('/');
    } catch (error) {
      console.error('Error durante login:', error);
      
      // Comprobamos si hay errores de validación para mostrarlos de forma amigable
      if (error.validationErrors) {
        const errorMessages = [];
        
        Object.entries(error.validationErrors).forEach(([field, messages]) => {
          const fieldName = getFieldDisplayName(field);
          
          if (Array.isArray(messages)) {
            messages.forEach(message => {
              errorMessages.push(`${fieldName}: ${formatErrorMessage(message)}`);
            });
          } else if (typeof messages === 'string') {
            errorMessages.push(`${fieldName}: ${formatErrorMessage(messages)}`);
          }
        });
        
        if (errorMessages.length > 0) {
          setError(errorMessages.join('\n'));
        } else {
          setError('Error en el inicio de sesión. Por favor, verifica tus credenciales.');
        }
      } else {
        setError('Error en el inicio de sesión. Por favor, verifica tus credenciales.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Función para obtener nombre legible de los campos
  const getFieldDisplayName = (field) => {
    const fieldNames = {
      username: 'Nombre de usuario',
      email: 'Email',
      password: 'Contraseña',
      non_field_errors: 'Error',
      detail: 'Detalle'
    };
    
    return fieldNames[field] || field;
  };
  
  // Función para formatear mensajes de error
  const formatErrorMessage = (message) => {
    // Traducción de mensajes comunes de error
    const translations = {
      'A user with that username already exists.': 'Este nombre de usuario ya está en uso.',
      'This password is too common.': 'Esta contraseña es demasiado común.',
      'Unable to log in with provided credentials.': 'No se puede iniciar sesión con las credenciales proporcionadas.',
      'This field may not be blank.': 'Este campo no puede estar vacío.',
      'No active account found with the given credentials': 'No se encontró una cuenta activa con las credenciales proporcionadas.'
    };
    
    return translations[message] || message;
  };

  return (
    <main className={styles.loginMain}>
      <div className={styles.loginContainer}>
        <h1>Iniciar Sesión</h1>
        
        {error && (
          <div className={styles.error}>
            {error.split('\n').map((line, index) => (
              <div key={index} className={styles.errorLine}>{line}</div>
            ))}
          </div>
        )}
        
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre de usuario"
            className={styles.loginFormInput}
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            className={styles.loginFormInput}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            type="submit" 
            className={styles.loginFormSubmit}
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Ingresar'}
          </button>
        </form>
        
        <div className={styles.loginLinks}>
          <Link href="/registro" className={styles.loginLinksLink}>Crear cuenta nueva</Link>
        </div>
        
      </div>
    </main>
  );
}
