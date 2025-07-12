"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from '../../crear/styles.module.css'; // Reusing create styles
import { useAuthFetch } from '../../../../hooks/useAuthFetch';
import { API_ROUTES } from '../../../../config/apiConfig';

export default function EditAuctionPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    rating: '',
    stock: '',
    brand: '',
    category: '',
    thumbnail: '',
    closing_date: ''
  });

  const [originalAuction, setOriginalAuction] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const params = useParams();
  const { currentUser } = useAuth();
  const { authFetch } = useAuthFetch();

  // Check authentication
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  // Load auction data and categories
  useEffect(() => {
    const fetchAuctionAndCategories = async () => {
      if (!params.id) {
        setError('ID de subasta no proporcionado');
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Load auction data
        const auctionData = await authFetch(API_ROUTES.AUCTION_BY_ID(params.id));
        console.log('Datos de la subasta:', auctionData);
        setOriginalAuction(auctionData);

        // Convert date format for datetime-local input
        let formattedDate = '';
        if (auctionData.fecha_cierre) {
          formattedDate = new Date(auctionData.fecha_cierre)
            .toISOString()
            .slice(0, 16); // format to yyyy-MM-ddThh:mm
        }

        // Fill the form
        setFormData({
          title: auctionData.titulo || '',
          description: auctionData.descripcion || '',
          price: auctionData.precio_inicial?.toString() || '',
          rating: auctionData.valoracion?.toString() || '',
          stock: auctionData.stock?.toString() || '',
          brand: auctionData.marca || '',
          category: auctionData.categoria?.toString() || '',
          thumbnail: auctionData.imagen || '',
          closing_date: formattedDate
        });

        // Check if current user is owner
        if (currentUser && auctionData.usuario !== currentUser.id) {
          setError('No tienes permiso para editar esta subasta');
          setTimeout(() => {
            router.push(`/subastas/${params.id}`);
          }, 2000);
          return;
        }

        // Load categories
        const categoriesResponse = await fetch(API_ROUTES.AUCTION_CATEGORIES);
        if (!categoriesResponse.ok) {
          throw new Error(`Error ${categoriesResponse.status}: ${categoriesResponse.statusText}`);
        }

        const categoriesData = await categoriesResponse.json();
        let processedCategories = [];

        // Manejar diferentes formatos de respuesta
        if (Array.isArray(categoriesData)) {
          // Los datos son directamente un array
          processedCategories = categoriesData.map(cat => ({
            id: cat.id,
            name: cat.nombre
          }));
        } else if (categoriesData && categoriesData.results && Array.isArray(categoriesData.results)) {
          // Los datos son un objeto con propiedad results
          processedCategories = categoriesData.results.map(cat => ({
            id: cat.id,
            name: cat.nombre
          }));
        } else {
          throw new Error('Formato de respuesta inesperado para categorías');
        }

        setCategories(processedCategories);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && params.id) {
      fetchAuctionAndCategories();
    }
  }, [currentUser, params.id, authFetch, router]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Validate form inputs
  const validateForm = () => {
    if (!formData.title.trim()) return 'El título es obligatorio';
    if (!formData.description.trim()) return 'La descripción es obligatoria';
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0)
      return 'El precio debe ser un número mayor que 0';
    if (!formData.closing_date) return 'La fecha de cierre es obligatoria';
    if (new Date(formData.closing_date) <= new Date())
      return 'La fecha de cierre debe ser futura';
    if (!formData.stock || isNaN(formData.stock) || parseInt(formData.stock) <= 0)
      return 'El stock debe ser un número entero mayor que 0';
    if (!formData.category) return 'La categoría es obligatoria';
    
    if (formData.rating && (isNaN(formData.rating) || 
        parseFloat(formData.rating) < 0 || parseFloat(formData.rating) > 5)) {
      return 'La valoración debe estar entre 0 y 5';
    }
    
    return null;
  };

  // Submit form handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    const auctionData = {
      titulo: formData.title,
      descripcion: formData.description,
      precio_inicial: parseFloat(formData.price),
      valoracion: formData.rating ? parseFloat(formData.rating) : 0,
      marca: formData.brand,
      imagen: formData.thumbnail,
      fecha_cierre: formData.closing_date,
      categoria: formData.category,
      stock: parseInt(formData.stock),
    };
  
    try {
      setLoading(true);
      setError('');
      
      const response = await authFetch(API_ROUTES.AUCTION_BY_ID(params.id), {
        method: 'PUT', // Usamos PUT para actualizar toda la subasta
        body: JSON.stringify(auctionData),
      });

      if (response.error || response.detail || response.status >= 400) {
        throw new Error(
          JSON.stringify(response.error || response.detail || response)
        );
      }

      setSuccess('¡Subasta actualizada exitosamente!');
      
      setTimeout(() => {
        router.push(`/subastas/${params.id}`);
      }, 2000);
    } catch (err) {
      console.error('Error al actualizar la subasta:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        Cargando datos, por favor espera...
      </div>
    );
  }

  if (error && error.includes('No tienes permiso')) {
    return (
      <div className={styles.error}>
        {error}
        <p>Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className={styles.auctionFormContainer}>
      <div className={styles.auctionFormBox}>
        <h2 className={styles.title}>Editar Subasta</h2>
        
        {error && (
          <div className={styles.error}>
            {error.split('\n').map((line, index) => (
              <div key={index} className={styles.errorLine}>{line}</div>
            ))}
          </div>
        )}
        {success && <div className={styles.success}>{success}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Título*</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="description">Descripción*</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              className={styles.textarea}
              rows="4"
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="price">Precio de salida*</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="stock">Stock*</label>
              <input
                type="number"
                min="1"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="brand">Marca*</label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="rating">Valoración (0-5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                id="rating"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="category">Categoría*</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className={styles.select}
              >
                <option value="">Seleccione una categoría</option>
                {Array.isArray(categories) && categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name || `Categoría ${category.id}`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="closing_date">Fecha de cierre*</label>
              <input
                type="datetime-local"
                id="closing_date"
                name="closing_date"
                value={formData.closing_date}
                onChange={handleChange}
                required
                className={styles.input}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="thumbnail">URL de la imagen</label>
            <input
              type="url"
              id="thumbnail"
              name="thumbnail"
              value={formData.thumbnail}
              onChange={handleChange}
              className={styles.input}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>
          
          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => router.push(`/subastas/${params.id}`)}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
