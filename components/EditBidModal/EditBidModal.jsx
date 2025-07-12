'use client';

import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

/**
 * Modal para editar una puja existente
 * Permite al usuario incrementar el monto de su puja anterior
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.bid - Datos de la puja a editar
 * @param {Object} props.auctionDetail - Detalles de la subasta
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onUpdate - Función para actualizar la puja
 */
export default function EditBidModal({ bid, auctionDetail, onClose, onUpdate }) {
  // Estado para el nuevo monto de la puja
  const [newAmount, setNewAmount] = useState('');
  // Estado para mensajes de error
  const [error, setError] = useState('');
  // Estado para indicar proceso de envío
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar el formulario con el monto actual de la puja
  useEffect(() => {
    if (bid) {
      setNewAmount(bid.cantidad.toString());
    }
  }, [bid]);

  /**
   * Maneja el envío del formulario para actualizar la puja
   * @param {Object} e - Evento de formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Validación básica del monto
    if (!newAmount || isNaN(newAmount) || parseFloat(newAmount) <= 0) {
      setError('Por favor, introduce una cantidad válida.');
      return;
    }

    // 2. El nuevo monto debe ser mayor que el actual
    if (parseFloat(newAmount) <= parseFloat(bid.cantidad)) {
      setError('La nueva puja debe ser superior a la actual.');
      return;
    }

    // 3. Si tenemos detalles de la subasta, validar contra el precio actual
    if (auctionDetail && auctionDetail.precio_actual) {
      const minimumAmount = parseFloat(auctionDetail.precio_actual) * 1.05;
      if (parseFloat(newAmount) < minimumAmount) {
        setError(`La nueva puja debe ser al menos un 5% superior al precio actual (${formatPrice(minimumAmount)}).`);
        return;
      }
    }

    // 4. Enviar la actualización
    try {
      setIsSubmitting(true);
      await onUpdate(parseFloat(newAmount));
      onClose(); // Cerrar modal tras éxito
    } catch (err) {
      setError(err.message || 'Error al actualizar la puja.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Formatea un precio en formato de moneda EUR
   * @param {number} price - Precio a formatear
   * @returns {string} - Precio formateado (ej: "100,00 €")
   */
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // Si no hay puja seleccionada, no mostrar modal
  if (!bid) return null;

  // Obtener título de la subasta de los detalles si están disponibles
  const auctionTitle = auctionDetail ? auctionDetail.titulo : `Subasta #${bid.subasta}`;
  
  // Obtener precio actual de la subasta
  const currentAuctionPrice = auctionDetail ? auctionDetail.precio_actual : parseFloat(bid.cantidad);
  
  // Calcular monto mínimo para la siguiente puja (5% más que el precio actual)
  const minimumBidAmount = currentAuctionPrice * 1.05;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {/* Cabecera del modal */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Editar Puja</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        
        {/* Contenido del modal */}
        <div className={styles.modalBody}>
          {/* Información de la subasta */}
          <p>
            Estás editando tu puja para: 
            <strong>{auctionTitle}</strong>
          </p>
          
          {/* Información de pujas */}
          <div className={styles.bidInfo}>
            <p className={styles.currentBid}>
              <span className={styles.bidLabel}>Tu puja actual:</span>
              <span className={styles.bidValue}>{formatPrice(bid.cantidad)}</span>
            </p>
            
            {auctionDetail && (
              <p className={styles.currentPrice}>
                <span className={styles.bidLabel}>Precio actual de la subasta:</span>
                <span className={styles.priceValue}>{formatPrice(currentAuctionPrice)}</span>
              </p>
            )}
          </div>
          
          {/* Mensajes de error */}
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          {/* Formulario de edición */}
          <form onSubmit={handleSubmit} className={styles.editForm}>
            <div className={styles.formGroup}>
              <label htmlFor="newAmount">Nueva cantidad (€):</label>
              <input
                id="newAmount"
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                min={minimumBidAmount.toFixed(2)}
                step="0.01"
                className={styles.formInput}
                required
                autoFocus
              />
              <small className={styles.bidHint}>
                Mínimo: {formatPrice(minimumBidAmount)}
              </small>
            </div>
            
            {/* Botones de acción */}
            <div className={styles.formActions}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelButton}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Actualizando...' : 'Actualizar Puja'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
