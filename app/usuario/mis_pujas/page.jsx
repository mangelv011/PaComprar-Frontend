'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthFetch } from '../../../hooks/useAuthFetch';
import { API_ROUTES } from '../../../config/apiConfig';
import Link from 'next/link';
import { FaEdit, FaTrash } from 'react-icons/fa';
import EditBidModal from '../../../components/EditBidModal/EditBidModal';
import styles from './styles.module.css';

export default function MisPujasPage() {
  const [pujas, setPujas] = useState([]);
  const [auctionDetails, setAuctionDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBid, setSelectedBid] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const router = useRouter();
  const { authFetch } = useAuthFetch();
  
  // Function to fetch user bids
  const fetchPujas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await authFetch(API_ROUTES.MY_BIDS);
      
      // Sort bids from newest to oldest
      const ordenadas = data.sort((a, b) => 
        new Date(b.fecha_puja) - new Date(a.fecha_puja)
      );
      
      setPujas(ordenadas);
      
      // Get details for each auction
      await fetchAuctionDetails(ordenadas);
      
    } catch (err) {
      console.error('Error al cargar pujas:', err);
      setError('No se pudieron cargar tus pujas. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to get details for all auctions
  const fetchAuctionDetails = async (bids) => {
    const uniqueAuctionIds = [...new Set(bids.map(puja => puja.subasta))];
    const details = {};
    
    try {
      // Get auction details in parallel
      await Promise.all(uniqueAuctionIds.map(async (auctionId) => {
        try {
          const auctionData = await authFetch(API_ROUTES.AUCTION_BY_ID(auctionId));
          details[auctionId] = auctionData;
        } catch (error) {
          console.error(`Error al obtener detalles de la subasta ${auctionId}:`, error);
        }
      }));
      
      setAuctionDetails(details);
    } catch (err) {
      console.error('Error al obtener detalles de las subastas:', err);
    }
  };
  
  useEffect(() => {
    fetchPujas();
  }, [authFetch]);
  
  // Format price to euros
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };
  
  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Date not available';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Determine auction status using auction details
  const getAuctionStatus = (auctionId) => {
    const auction = auctionDetails[auctionId];
    
    if (!auction) {
      return { text: 'Unknown', className: styles.statusUnknown };
    }
    
    if (auction.estado_actual === 'cerrada' || new Date(auction.fecha_cierre) <= new Date()) {
      return { text: 'Ended', className: styles.statusEnded };
    } else {
      return { text: 'Active', className: styles.statusActive };
    }
  };
  
  // Check if a bid is winning
  const isPujaGanadora = (puja) => {
    const auction = auctionDetails[puja.subasta];
    
    if (!auction) return false;
    
    // Check if auction ended and this is highest bid
    const isEnded = new Date(auction.fecha_cierre) <= new Date();
    const isHighestBid = puja.cantidad >= auction.precio_actual;
    
    return isEnded && isHighestBid;
  };

  // Function to open edit modal
  const handleEdit = (bid) => {
    setSelectedBid(bid);
    setShowModal(true);
  };

  // Function to close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBid(null);
  };

  // Function to update a bid
  const handleUpdate = async (newAmount) => {
    try {
      await authFetch(API_ROUTES.BID_BY_ID(selectedBid.subasta, selectedBid.id), {
        method: 'PUT',
        body: JSON.stringify({ cantidad: newAmount }),
      });
      
      // Reload data after update
      await fetchPujas();
      
      // Show success message
      alert('Puja actualizada correctamente');
      
    } catch (error) {
      console.error('Error al actualizar puja:', error);
      throw new Error('No se pudo actualizar la puja. Por favor, inténtalo de nuevo.');
    }
  };

  // Function to delete a bid
  const handleDelete = async (bid) => {
    // Confirm before deleting
    if (!window.confirm(`¿Estás seguro de que quieres eliminar esta puja de ${formatPrice(bid.cantidad)}?`)) {
      return;
    }

    try {
      await authFetch(API_ROUTES.BID_BY_ID(bid.subasta, bid.id), {
        method: 'DELETE',
      });
      
      // Reload data after deletion
      await fetchPujas();
      
      // Show success message
      alert('Puja eliminada correctamente');
      
    } catch (error) {
      console.error('Error al eliminar puja:', error);
      alert('No se pudo eliminar la puja. Por favor, inténtalo de nuevo.');
    }
  };

  // Check if bid can be edited (only if auction is active)
  const canEditBid = (puja) => {
    const status = getAuctionStatus(puja.subasta);
    return status.text === 'Active';
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando tus pujas...</p>
      </div>
    );
  }

  return (
    <div className={styles.misPujasContainer}>
      <h1 className={styles.title}>Mis Pujas</h1>
      
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button 
            onClick={() => fetchPujas()} 
            className={styles.reloadButton}
          >
            Intentar nuevamente
          </button>
        </div>
      )}
      
      {!error && pujas.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No has realizado ninguna puja todavía.</p>
          <Link href="/subastas" className={styles.browseLink}>
            Explorar subastas disponibles
          </Link>
        </div>
      ) : (
        <div className={styles.pujasTable}>
          <div className={styles.tableHeader}>
            <div className={styles.headerCell}>Subasta</div>
            <div className={styles.headerCell}>Cantidad</div>
            <div className={styles.headerCell}>Fecha</div>
            <div className={styles.headerCell}>Estado</div>
            <div className={styles.headerCell}>Acciones</div>
          </div>
          
          {pujas.map((puja) => {
            const auction = auctionDetails[puja.subasta];
            const status = getAuctionStatus(puja.subasta);
            const isGanadora = isPujaGanadora(puja);
            const isActive = status.text === 'Activa';
            
            return (
              <div 
                key={puja.id} 
                className={`${styles.tableRow} ${isGanadora ? styles.winningBid : ''}`}
              >
                <div className={styles.cell}>
                  <Link href={`/subastas/${puja.subasta}`} className={styles.subastaLink}>
                    {auction ? auction.titulo : `Cargando subasta #${puja.subasta}...`}
                  </Link>
                  {isGanadora && (
                    <span className={styles.winningBadge}>¡Puja ganadora!</span>
                  )}
                </div>
                
                <div className={styles.cell}>
                  <span className={styles.bidAmount}>{formatPrice(puja.cantidad)}</span>
                  {auction && auction.precio_actual > puja.cantidad && (
                    <span className={styles.outbidIndicator}>Superada</span>
                  )}
                </div>
                
                <div className={styles.cell}>
                  {formatDateTime(puja.fecha_puja)}
                </div>
                
                <div className={styles.cell}>
                  <span className={status.className}>{status.text}</span>
                </div>
                
                <div className={styles.cell}>
                  <div className={styles.actionButtons}>
                    <Link href={`/subastas/${puja.subasta}`} className={styles.actionButton}>
                      Ver subasta
                    </Link>
                    
                    {isActive && (
                      <>
                        <button 
                          onClick={() => handleEdit(puja)} 
                          className={`${styles.iconButton} ${styles.editButton}`}
                          aria-label="Editar puja"
                          title="Editar puja"
                        >
                          <FaEdit />
                        </button>
                        
                        <button 
                          onClick={() => handleDelete(puja)} 
                          className={`${styles.iconButton} ${styles.deleteButton}`}
                          aria-label="Eliminar puja"
                          title="Eliminar puja"
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {showModal && (
        <EditBidModal 
          bid={selectedBid} 
          auctionDetail={auctionDetails[selectedBid?.subasta]}
          onClose={handleCloseModal} 
          onUpdate={handleUpdate} 
        />
      )}
    </div>
  );
}
