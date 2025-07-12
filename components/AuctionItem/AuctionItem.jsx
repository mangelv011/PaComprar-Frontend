'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaRegClock, FaUser } from 'react-icons/fa';
import styles from './styles.module.css';

/**
 * Componente que representa una tarjeta de subasta individual en el listado
 * Muestra información resumida y enlaces a la página detallada
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.auction - Datos de la subasta a mostrar
 */
export default function AuctionItem({ auction }) {
  // Estado para manejar errores de carga de imagen
  const [imageError, setImageError] = useState(false);
  
  // Si no hay datos de subasta, mostrar mensaje de error
  if (!auction) {
    return (
      <div className={styles.errorContainer}>
        <p>Subasta no disponible</p>
      </div>
    );
  }
  
  // Construir la URL para la página de detalle
  const auctionUrl = `/subastas/${auction.id}`;
  
  // Crear objeto con valores seguros (con valores por defecto para evitar errores)
  const safeAuction = {
    id: auction.id || 'unknown',
    title: auction.title || 'Producto sin nombre',
    description: auction.description || 'Sin descripción disponible',
    currentBid: typeof auction.currentBid === 'number' ? auction.currentBid : 0,
    buyNowPrice: auction.buyNowPrice,
    seller: auction.seller || 'Vendedor anónimo',
    category: auction.category || 'otros',
    endDate: auction.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  // Determinar imagen a mostrar (usar la por defecto si hay error o no hay imagen)
  const imageToShow = imageError ? 
    '/images/default-auction.jpg' : 
    (auction.imageUrl || '/images/default-auction.jpg');
  
  /**
   * Formatea un precio en formato de moneda EUR
   * @param {number} price - Precio a formatear
   * @returns {string} Precio formateado (ej: "100,00 €")
   */
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };
  
  /**
   * Calcula y formatea el tiempo restante hasta la fecha de cierre
   * @param {string} endDate - Fecha de cierre en formato ISO
   * @returns {string} Tiempo restante formateado
   */
  const getTimeRemaining = (endDate) => {
    const total = new Date(endDate) - new Date();
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    
    // Si ya pasó la fecha de cierre
    if (total <= 0) {
      return "Finalizada";
    }
    
    // Formato condicional según el tiempo restante
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    return `${minutes}m`;
  };

  return (
    <div className={styles.auctionCard}>
      {/* Sección de imagen con enlace */}
      <Link href={auctionUrl} className={styles.imageLink}>
        <div className={styles.imageContainer}>
          <Image 
            src={imageToShow}
            alt={safeAuction.title}
            width={300}
            height={200}
            className={styles.image}
            onError={() => setImageError(true)}
          />
          {/* Etiqueta de compra directa (si está disponible) */}
          {safeAuction.buyNowPrice && (
            <div className={styles.buyNowBadge}>
              Comprar ya: {formatPrice(safeAuction.buyNowPrice)}
            </div>
          )}
        </div>
      </Link>
      
      {/* Sección de contenido */}
      <div className={styles.content}>
        {/* Título con enlace */}
        <Link href={auctionUrl} className={styles.titleLink}>
          <h3 className={styles.title}>{safeAuction.title}</h3>
        </Link>
        
        {/* Descripción truncada */}
        <p className={styles.description}>
          {safeAuction.description.length > 80
            ? `${safeAuction.description.substring(0, 80)}...`
            : safeAuction.description}
        </p>
        
        {/* Fila de precio y tiempo restante */}
        <div className={styles.priceRow}>
          <div className={styles.currentPrice}>
            {formatPrice(safeAuction.currentBid)}
          </div>
          
          <div className={styles.timeLeft}>
            <FaRegClock className={styles.clockIcon} />
            {getTimeRemaining(safeAuction.endDate)}
          </div>
        </div>
        
        {/* Información del vendedor */}
        <div className={styles.sellerInfo}>
          <FaUser className={styles.userIcon} />
          <span className={styles.sellerName}>{safeAuction.seller}</span>
        </div>
      </div>
    </div>
  );
}
