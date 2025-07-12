'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthFetch } from '../../../hooks/useAuthFetch';
import { API_ROUTES } from '../../../config/apiConfig';
import styles from './styles.module.css';
import PasswordChangeForm from '../../../components/PasswordChangeForm/PasswordChangeForm';

export default function UserProfilePage() {
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    municipality: '',
    locality: ''
  });
  
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  
  const { authFetch } = useAuthFetch();
  
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const data = await authFetch(API_ROUTES.USER_PROFILE);
        setProfileData(data);
        setOriginalData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('No se pudo cargar la información del perfil. Por favor, intente de nuevo más tarde.');
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [authFetch]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const updatedProfile = await authFetch(API_ROUTES.USER_PROFILE, {
        method: 'PATCH',
        body: JSON.stringify({
          username: profileData.username,
          email: profileData.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          birth_date: profileData.birth_date,
          municipality: profileData.municipality || '',
          locality: profileData.locality || ''
        })
      });
      
      setProfileData(updatedProfile);
      setOriginalData(updatedProfile);
      setSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Error al actualizar el perfil. Por favor, verifique los datos e intente de nuevo.');
    } finally {
      setSaving(false);
    }
  };
  
  const hasChanges = () => {
    return JSON.stringify(profileData) !== JSON.stringify(originalData);
  };
  
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando información del perfil...</p>
      </div>
    );
  }
  
  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileCard}>
        <h1 className={styles.title}>Mi Perfil</h1>
        
        {error && (
          <div className={styles.error}>{error}</div>
        )}
        
        {success && (
          <div className={styles.success}>Perfil actualizado con éxito</div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Nombre de usuario</label>
              <input
                type="text"
                id="username"
                name="username"
                value={profileData.username}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="first_name">Nombre</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={profileData.first_name}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="last_name">Apellidos</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={profileData.last_name}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="birth_date">Fecha de nacimiento</label>
              <input
                type="date"
                id="birth_date"
                name="birth_date"
                value={profileData.birth_date}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="municipality">Municipio</label>
              <input
                type="text"
                id="municipality"
                name="municipality"
                value={profileData.municipality || ''}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="locality">Localidad</label>
              <input
                type="text"
                id="locality"
                name="locality"
                value={profileData.locality || ''}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => {
                setProfileData(originalData);
                setError(null);
              }}
              disabled={!hasChanges() || saving}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className={styles.saveButton}
              disabled={!hasChanges() || saving}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
      
      <div className={styles.profileCard}>
        <h2 className={styles.subtitle}>Cambiar Contraseña</h2>
        <PasswordChangeForm />
      </div>
    </div>
  );
}
