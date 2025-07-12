'use client';

import React, { useState } from 'react';
import styles from './PasswordChangeForm.module.css';
import { useAuthFetch } from '../../hooks/useAuthFetch';
import { API_ROUTES } from '../../config/apiConfig';

export default function PasswordChangeForm() {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const { authFetch } = useAuthFetch();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateForm = () => {
    if (formData.new_password !== formData.confirm_password) {
      setError('Las contraseñas nuevas no coinciden.');
      return false;
    }
    
    if (formData.new_password.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await authFetch(API_ROUTES.CHANGE_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({
          old_password: formData.old_password,
          new_password: formData.new_password
        })
      });
      
      setSuccess(true);
      setFormData({
        old_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Error al cambiar la contraseña. Verifica que la contraseña actual sea correcta.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <div className={styles.error}>{error}</div>
      )}
      
      {success && (
        <div className={styles.success}>Contraseña cambiada con éxito</div>
      )}
      
      <div className={styles.formGroup}>
        <label htmlFor="old_password">Contraseña actual</label>
        <input
          type="password"
          id="old_password"
          name="old_password"
          value={formData.old_password}
          onChange={handleChange}
          className={styles.input}
          required
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="new_password">Nueva contraseña</label>
        <input
          type="password"
          id="new_password"
          name="new_password"
          value={formData.new_password}
          onChange={handleChange}
          className={styles.input}
          required
          minLength={8}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="confirm_password">Confirmar nueva contraseña</label>
        <input
          type="password"
          id="confirm_password"
          name="confirm_password"
          value={formData.confirm_password}
          onChange={handleChange}
          className={styles.input}
          required
        />
      </div>
      
      <button
        type="submit"
        className={styles.submitButton}
        disabled={loading}
      >
        {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
      </button>
    </form>
  );
}
