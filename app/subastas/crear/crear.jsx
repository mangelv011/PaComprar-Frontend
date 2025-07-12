"use client"; 

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './styles.module.css'; 
import { useAuthFetch } from '../../../hooks/useAuthFetch';
import { API_ROUTES } from '../../../config/apiConfig';

export default function CreateAuctionPage() {
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

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const router = useRouter();
    const { currentUser } = useAuth();
    const {authFetch} = useAuthFetch();

    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
      if (authChecked) {
        if (!currentUser) {
          console.log('User not authenticated, redirecting to login');
          router.push('/login');
        }
      }
    }, [currentUser, router, authChecked]);

    useEffect(() => {
      setAuthChecked(true);
    }, []);

    useEffect(() => {
      const fetchCategories = async () => {
        try {
          const response = await fetch(API_ROUTES.AUCTION_CATEGORIES);
          const data = await response.json();
          
          // Check the structure of received data
          console.log("Datos de categorías recibidos:", data);
          
          // Handle both array response and object with results property
          let processedCategories = [];
          
          if (Array.isArray(data)) {
            // Data is directly an array
            processedCategories = data.map(cat => ({
              id: cat.id,
              name: cat.nombre // Map "nombre" to "name"
            }));
          } else if (data && data.results && Array.isArray(data.results)) {
            // Data is an object with results property
            processedCategories = data.results.map(cat => ({
              id: cat.id,
              name: cat.nombre
            }));
          }
          
          setCategories(processedCategories);
          
          if (processedCategories.length === 0) {
            console.warn('No se encontraron categorías o formato inesperado.');
          }
        } catch (error) {
          console.error('Error al obtener categorías:', error);
          // In case of error, provide some default categories
          setCategories([
            {id: 1, name: "Categoría por defecto"}
          ]);
        }
      };
    
      fetchCategories();
    }, []);

    const handleChange = (e) => {
        const {name, value} = e.target
        setFormData({
            ...formData,
            [name]: value
        })
    }

    const validateForm = () => {
        if (!formData.title.trim()) return 'Title is required';
        if (!formData.description.trim()) return 'Description is required';
        if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) 
          return 'A valid price is required';
        if (!formData.closing_date) return 'Closing date is required';
        if (new Date(formData.closing_date) <= new Date()) 
          return 'Closing date must be in the future';
        if (!formData.stock || isNaN(formData.stock) || parseInt(formData.stock) <= 0)
          return 'A valid stock quantity is required';
        if (!formData.category) return 'Category is required';
        
        if (formData.rating && (isNaN(formData.rating) || 
            parseFloat(formData.rating) < 0 || parseFloat(formData.rating) > 5)) {
          return 'Rating must be between 0 and 5';
        }
        
        return null;
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
      
        const validationError = validateForm();
        if (validationError) {
          setError(validationError);
          return;
        }
      
      // Format the data according to the required API field names
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
        
        const response = await authFetch(API_ROUTES.AUCTIONS, {
          method: 'POST',
          body: JSON.stringify(auctionData),
        });

          if (response.error || response.detail || response.status >= 400) {
            throw new Error(
              JSON.stringify(response.error || response.detail || response)
            );
          }
  
          // We already have JSON data, use directly
          const result = response;
          setSuccess('Subasta creada exitosamente!');
          
          setTimeout(() => {
            router.push(`/subastas/${result.id}`);
          }, 2000);

      } catch (err) {
        console.error('Error al crear subasta:', err);
        setError(`Error al crear la subasta: ${err.message}`);
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

    if (categories.length === 0 && !loading) {
        return (
            <div className={styles.error}>
                No se pudieron cargar las categorías. Por favor, inténtalo de nuevo más tarde.
            </div>
        );
    }

    return (
        <div className={styles.auctionFormContainer}>
          <div className={styles.auctionFormBox}>
            <h2 className={styles.title}>Crear Nueva Subasta</h2>
            
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
                  onClick={() => router.push('/subastas')}
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
                  {loading ? 'Creando...' : 'Crear Subasta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );

}