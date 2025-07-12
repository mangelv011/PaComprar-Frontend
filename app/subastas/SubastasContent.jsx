'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './styles.module.css';
import AuctionItem from '../../components/AuctionItem/AuctionItem';
import { useAuthFetch } from '../../hooks/useAuthFetch';
import { API_BASE_URL, API_ROUTES } from '../../config/apiConfig';

/**
 * Componente principal para mostrar y filtrar las subastas disponibles
 * Permite búsqueda por nombre, filtrado por categoría y rango de precios
 */
export default function SubastasContent() {
  // Hooks para gestionar navegación y parámetros de URL
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Estado para los filtros de búsqueda (inicializados desde URL)
  const [filters, setFilters] = useState({
    categoria: searchParams.get('categoria') || '',
    precio_min: searchParams.get('precio_min') || '',
    precio_max: searchParams.get('precio_max') || '',
    search: searchParams.get('search') || ''
  });
  
  // Estados para subastas, categorías y manejo de carga/errores
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  // Hook personalizado para peticiones autenticadas
  const { authFetch, loading: fetchLoading, error: fetchError } = useAuthFetch();
  
  /**
   * Carga las categorías de subastas al iniciar el componente
   */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(API_ROUTES.AUCTION_CATEGORIES);
        if (!response.ok) {
          throw new Error('Error al cargar categorías');
        }
        const data = await response.json();
        
        // Manejar diferentes formatos de respuesta
        if (Array.isArray(data)) {
          // Los datos son directamente un array
          setCategories(data);
        } else if (data && data.results && Array.isArray(data.results)) {
          // Los datos son un objeto con propiedad results
          setCategories(data.results);
        } else {
          console.warn('Formato de respuesta de categorías inesperado:', data);
          setCategories([]);
        }
      } catch (err) {
        console.error('Error al cargar categorías:', err);
        setCategories([]);
      }
    };
    
    fetchCategories();
  }, []);
  
  /**
   * Normaliza y valida URLs de imágenes, usando imagen por defecto si es necesario
   * @param {string} imageUrl - URL de la imagen a validar
   * @returns {string} - URL validada o imagen por defecto
   */
  const getSafeImageUrl = (imageUrl) => {
    // Si no hay URL, usar imagen por defecto
    if (!imageUrl) return '/images/default-auction.jpg';
    
    // Si ya es una ruta local, usarla directamente
    if (imageUrl.startsWith('/')) return imageUrl;
    
    try {
      // Intentar corregir URLs sin protocolo
      if (imageUrl && !imageUrl.match(/^https?:\/\//)) {
        if (imageUrl.includes('.')) {
          imageUrl = 'https://' + imageUrl;
        }
      }
      return imageUrl;
    } catch (err) {
      // Manejo adicional para URLs problemáticas
      if (imageUrl && typeof imageUrl === 'string') {
        if (!imageUrl.match(/^https?:\/\//)) {
          if (imageUrl.startsWith('./') || imageUrl.startsWith('../') || !imageUrl.includes('://')) {
            return imageUrl;
          }
        }
      }
      return '/images/default-auction.jpg';
    }
  };

  /**
   * Actualiza la URL con los filtros aplicados
   * @param {Object} currentFilters - Filtros actuales a aplicar
   */
  const updateUrlWithFilters = (currentFilters) => {
    const params = new URLSearchParams();
    
    // Añadir solo los filtros con valor
    if (currentFilters.categoria) params.append('categoria', currentFilters.categoria);
    if (currentFilters.precio_min) params.append('precio_min', currentFilters.precio_min);
    if (currentFilters.precio_max) params.append('precio_max', currentFilters.precio_max);
    if (currentFilters.search) params.append('search', currentFilters.search);
    
    // Actualizar URL del navegador sin recargar página
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/subastas${newUrl}`, { shallow: true });
  };

  /**
   * Maneja cambios en los controles de filtrado
   * @param {Object} e - Evento del control de formulario
   */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    // Validación especial para campos de precio
    if ((name === 'precio_min' || name === 'precio_max') && value !== '') {
      if (isNaN(value) || Number(value) < 0) {
        return; // Ignorar valores inválidos
      }
    }
    
    // Actualizar filtros y URL
    const updatedFilters = {
      ...filters,
      [name]: value
    };
    
    setFilters(updatedFilters);
    updateUrlWithFilters(updatedFilters);
  };

  /**
   * Restablece todos los filtros a sus valores por defecto
   */
  const resetFilters = () => {
    const emptyFilters = {
      categoria: '',
      precio_min: '',
      precio_max: '',
      search: ''
    };
    
    setFilters(emptyFilters);
    router.replace('/subastas', { shallow: true });
  };

  /**
   * Carga las subastas filtradas cuando cambian los filtros
   */
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        
        // Construir parámetros de consulta desde filtros
        const queryParams = new URLSearchParams();
        
        if (filters.categoria) queryParams.append('categoria', filters.categoria);
        if (filters.precio_min && !isNaN(filters.precio_min) && Number(filters.precio_min) >= 0) {
          queryParams.append('precio_min', filters.precio_min);
        }
        if (filters.precio_max && !isNaN(filters.precio_max) && Number(filters.precio_max) >= 0) {
          queryParams.append('precio_max', filters.precio_max);
        }
        if (filters.search) queryParams.append('search', filters.search);
        
        // Construir URL completa
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const url = `${API_ROUTES.AUCTIONS}${queryString}`;
        
        // Realizar petición autenticada
        const data = await authFetch(url, { method: 'GET' });
        
        // Transformar datos para el formato esperado por AuctionItem
        const mappedAuctions = (data || []).map(auction => {
          return {
            id: auction.id,
            title: auction.titulo,
            description: auction.descripcion,
            currentBid: parseFloat(auction.precio_actual || auction.precio_inicial),
            buyNowPrice: parseFloat(auction.precio_actual || auction.precio_inicial) * 1.3, // Precio "comprar ahora" = precio actual + 30%
            imageUrl: getSafeImageUrl(auction.imagen),
            seller: auction.usuario_nombre || `Usuario ${auction.usuario}`,
            category: auction.categoria.toString(),
            endDate: auction.fecha_cierre
          };
        });
        
        setAuctions(mappedAuctions);
        setError(null);
      } catch (err) {
        console.error('Error al cargar subastas:', err);
        setError(err.message);
        setAuctions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuctions();
  }, [filters, authFetch]);

  /**
   * Sincroniza los filtros con los parámetros de la URL cuando cambian externamente
   */
  useEffect(() => {
    const search = searchParams.get('search');
    if (search && search !== filters.search) {
      setFilters(prev => ({
        ...prev,
        search: search
      }));
    }
  }, [searchParams]);

  return (
    <div className={styles.subastasContent}>
      {/* Panel de filtros */}
      <div className={styles.filtersContainer}>
        <input
          type="text"
          placeholder="Buscar por nombre"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          className={styles.searchInput}
        />
        <select 
          name="categoria" 
          value={filters.categoria} 
          onChange={handleFilterChange}
          className={styles.filterSelect}
        >
          <option value="">Todas las categorías</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.nombre}
            </option>
          ))}
        </select>
        <div className={styles.priceFilters}>
          <input
            type="number"
            min="0"
            placeholder="Precio mínimo"
            name="precio_min"
            value={filters.precio_min}
            onChange={handleFilterChange}
            className={styles.priceInput}
          />
          <input
            type="number"
            min="0"
            placeholder="Precio máximo"
            name="precio_max"
            value={filters.precio_max}
            onChange={handleFilterChange}
            className={styles.priceInput}
          />
        </div>
        <button 
          onClick={resetFilters} 
          className={styles.resetButton}
          disabled={!filters.categoria && !filters.precio_min && !filters.precio_max && !filters.search}
        >
          Limpiar filtros
        </button>
      </div>

      {/* Contador de resultados */}
      <div className={styles.resultsCount}>
        <p>Se encontraron {auctions.length} subastas</p>
      </div>

      {/* Visualización de resultados */}
      {loading || fetchLoading ? (
        <div className={styles.loading}>Cargando subastas...</div>
      ) : error || fetchError ? (
        <div className={styles.error}>{error || fetchError}</div>
      ) : (
        <div className={styles.auctionsGrid}>
          {auctions.length > 0 ? (
            auctions.map(auction => (
              <AuctionItem 
                key={auction.id} 
                auction={auction}
              />
            ))
          ) : (
            <p className={styles.noResults}>No se encontraron subastas con estos filtros</p>
          )}
        </div>
      )}
    </div>
  );
}
