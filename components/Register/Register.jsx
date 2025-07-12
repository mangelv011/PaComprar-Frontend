'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import styles from './styles.module.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    locality: '',
    municipality: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validatePassword = (password) => {
    // At least 8 characters and contain letters and numbers
    const regEx = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regEx.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Local validations
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (!validatePassword(formData.password)) {
      setError('La contraseña debe tener al menos 8 caracteres y contener letras y números');
      return;
    }
    
    // Remove confirmPassword before sending
    const userData = {...formData};
    delete userData.confirmPassword;

    // Make sure birth_date has correct format (YYYY-MM-DD)
    if (userData.birth_date) {
      const date = new Date(userData.birth_date);
      if (isNaN(date.getTime())) {
        setError('Fecha de nacimiento inválida');
        return;
      }
      userData.birth_date = date.toISOString().split('T')[0];
    }

    try {
      setError('');
      setLoading(true);
      console.log('Enviando datos de registro:', userData);
      
      // Here we make API call
      const response = await fetch('https://das-p2-backend.onrender.com/api/users/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      // Get the response
      const responseText = await response.text();
      
      if (!response.ok) {
        // Process API errors
        try {
          const errorData = JSON.parse(responseText);
          const errorMessages = [];
          
          // Loop through the errors and translate them
          Object.entries(errorData).forEach(([field, messages]) => {
            const fieldName = getFieldDisplayName(field);
            if (Array.isArray(messages)) {
              messages.forEach(message => {
                errorMessages.push(`${fieldName}: ${translateErrorMessage(message)}`);
              });
            } else if (typeof messages === 'string') {
              errorMessages.push(`${fieldName}: ${translateErrorMessage(messages)}`);
            }
          });
          
          setError(errorMessages.join('\n'));
        } catch (e) {
          // If not JSON, show text as is
          setError(`Error en el registro: ${responseText}`);
        }
        return;
      }
      
      // Successful registration
      setSuccess('Registro exitoso. Ya puedes iniciar sesión.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Error durante el registro:', error);
      setError('Error de conexión. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to get readable field names
  const getFieldDisplayName = (field) => {
    const fieldNames = {
      username: 'Nombre de usuario',
      email: 'Email',
      password: 'Contraseña',
      first_name: 'Nombre',
      last_name: 'Apellidos',
      birth_date: 'Fecha de nacimiento',
      locality: 'Localidad',
      municipality: 'Municipio'
    };
    
    return fieldNames[field] || field;
  };
  
  // Function to translate common error messages
  const translateErrorMessage = (message) => {
    const translations = {
      'A user with that username already exists.': 'Este nombre de usuario ya está en uso',
      'Enter a valid email address.': 'Introduce una dirección de email válida',
      'This field may not be blank.': 'Este campo no puede estar vacío',
      'Date has wrong format. Use one of these formats instead: YYYY-MM-DD.': 'El formato de fecha debe ser AAAA-MM-DD',
      'This password is too common.': 'Esta contraseña es demasiado común',
      'This password is too short. It must contain at least 8 characters.': 'La contraseña es demasiado corta. Debe tener al menos 8 caracteres',
      "A user with that email already exists.": "Ya existe un usuario con ese email"
    };
    
    return translations[message] || message;
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerBox}>
        <h2 className={styles.title}>Registro de usuario</h2>
        
        {error && (
          <div className={styles.error}>
            {error.split('\n').map((line, index) => (
              <div key={index} className={styles.errorLine}>{line}</div>
            ))}
          </div>
        )}
        {success && <div className={styles.success}>{success}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Nombre de usuario*</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Elige un nombre de usuario único"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="email">Email*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="ejemplo@correo.com"
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="password">Contraseña*</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Mínimo 8 caracteres, letras y números"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirmar contraseña*</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Repite la contraseña"
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="first_name">Nombre*</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Tu nombre"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="last_name">Apellidos*</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Tus apellidos"
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="birth_date">Fecha de nacimiento* (AAAA-MM-DD)</label>
            <input
              type="date"
              id="birth_date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="locality">Localidad*</label>
              <input
                type="text"
                id="locality"
                name="locality"
                value={formData.locality}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Tu localidad"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="municipality">Municipio*</label>
              <input
                type="text"
                id="municipality"
                name="municipality"
                value={formData.municipality}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Tu municipio"
              />
            </div>
          </div>
          
          <div className={styles.termsContainer}>
            <label className={styles.termsLabel}>
              <input 
                type="checkbox" 
                required
                className={styles.checkbox} 
              />
              <span>He leído y acepto los <a href="/terminos" target="_blank" rel="noopener noreferrer">términos y condiciones</a> y la <a href="/privacidad" target="_blank" rel="noopener noreferrer">política de privacidad</a>.</span>
            </label>
          </div>
          
          <button 
            type="submit" 
            className={styles.registerButton} 
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        
        <div className={styles.loginLink}>
          ¿Ya tienes cuenta? <Link href="/login">Inicia sesión aquí</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
