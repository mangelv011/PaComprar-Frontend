'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthFetch } from '../../../hooks/useAuthFetch';
import { API_ROUTES } from '../../../config/apiConfig';
import styles from './styles.module.css';

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_new_password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const router = useRouter();
  const { authFetch } = useAuthFetch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePassword = (password) => {
    // At least 8 characters and contain letters and numbers
    const regEx = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regEx.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (formData.new_password !== formData.confirm_new_password) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (!validatePassword(formData.new_password)) {
      setError('La nueva contraseña debe tener al menos 8 caracteres y contener letras y números');
      return;
    }
    
    // Prepare data to send
    const passwordData = {
      old_password: formData.old_password,
      new_password: formData.new_password
    };

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await authFetch(API_ROUTES.CHANGE_PASSWORD, {
        method: 'POST',
        body: JSON.stringify(passwordData)
      });
      
      setSuccess('Contraseña actualizada correctamente');
      
      // Clear the form
      setFormData({
        old_password: '',
        new_password: '',
        confirm_new_password: ''
      });
      
      // Redirect after a timeout
      setTimeout(() => {
        router.push('/usuario');
      }, 3000);
      
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      
      if (typeof err === 'object' && err !== null && err.message) {
        try {
          // Try to parse the message as JSON
          const errorData = JSON.parse(err.message);
          const errorMessages = [];
          
          Object.entries(errorData).forEach(([field, messages]) => {
            const fieldName = getFieldDisplayName(field);
            
            if (Array.isArray(messages)) {
              messages.forEach(msg => {
                errorMessages.push(`${fieldName}: ${msg}`);
              });
            } else if (typeof messages === 'string') {
              errorMessages.push(`${fieldName}: ${messages}`);
            }
          });
          
          setError(errorMessages.join('\n'));
        } catch (e) {
          // If can't parse, use message as is
          setError(`Error: ${err.message}`);
        }
      } else {
        setError('Error al cambiar la contraseña');
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldDisplayName = (field) => {
    const fieldNames = {
      old_password: 'Contraseña actual',
      new_password: 'Nueva contraseña',
      confirm_new_password: 'Confirmar nueva contraseña',
      non_field_errors: 'Error'
    };
    
    return fieldNames[field] || field;
  };

  return (
    <div className={styles.passwordContainer}>
      <div className={styles.passwordBox}>
        <h2 className={styles.title}>Cambiar Contraseña</h2>
        
        {error && (
          <div className={styles.error}>
            {error.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        )}
        
        {success && (
          <div className={styles.success}>{success}</div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="old_password">Contraseña actual*</label>
            <input
              type="password"
              id="old_password"
              name="old_password"
              value={formData.old_password}
              onChange={handleChange}
              required
              className={styles.input}
              placeholder="Introduce tu contraseña actual"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="new_password">Nueva contraseña*</label>
            <input
              type="password"
              id="new_password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              required
              className={styles.input}
              placeholder="Mínimo 8 caracteres, incluye letras y números"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="confirm_new_password">Confirmar nueva contraseña*</label>
            <input
              type="password"
              id="confirm_new_password"
              name="confirm_new_password"
              value={formData.confirm_new_password}
              onChange={handleChange}
              required
              className={styles.input}
              placeholder="Repite la nueva contraseña"
            />
          </div>
          
          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => router.push('/usuario')}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
