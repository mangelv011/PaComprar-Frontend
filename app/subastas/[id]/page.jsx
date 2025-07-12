'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './styles.module.css';
import { useAuth } from '../../../contexts/AuthContext';
import { useAuthFetch } from '../../../hooks/useAuthFetch';
import { API_ROUTES } from '../../../config/apiConfig';
import StarRating from '../../../components/StarRating/StarRating';
import CommentSection from '../../../components/Comments/Comments';

/**
 * Página de detalle de subasta
 * Muestra información completa de una subasta y permite realizar pujas
 */
const AuctionDetailPage = () => {
  // Parámetros de ruta y navegación
  const params = useParams();
  const router = useRouter();
  
  // Estado para datos de la subasta
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para pujas
  const [bidsHistory, setBidsHistory] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [highestBid, setHighestBid] = useState(0);
  
  // Estado para valoraciones
  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [idRating, setIdRating] = useState(null);
  
  // Estado para comentarios
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  
  // Estado auxiliar para UI
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Contextos y hooks personalizados
  const { currentUser } = useAuth();
  const { authFetch, loading: fetchLoading } = useAuthFetch();

  /**
   * Formatea un precio con formato de moneda EUR
   * @param {number} price - Precio a formatear
   * @returns {string} Precio formateado
   */
  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) {
      return 'No disponible';
    }
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  /**
   * Formatea una fecha en formato legible
   * @param {string} dateString - Fecha en formato ISO
   * @returns {string} Fecha formateada
   */
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Fecha no disponible';

    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Detecta cuando se completa la carga inicial
   */
  useEffect(() => {
    if (!loading && !fetchLoading && auction) {
      setIsInitialLoad(false);
    }
  }, [loading, fetchLoading, auction]);

  /**
   * Carga los comentarios de la subasta
   */
  const fetchComments = async () => {
    if (!params.id) return;

    try {
      setCommentsLoading(true);
      setCommentsError(null);

      const response = await authFetch(API_ROUTES.AUCTION_COMMENTS(params.id));

      // Procesar diferentes formatos de respuesta
      if (Array.isArray(response)) {
        setComments(response);
      } else if (response && response.results && Array.isArray(response.results)) {
        setComments(response.results);
      } else {
        console.warn('Formato de respuesta inesperado para comentarios:', response);
        setComments([]);
      }
    } catch (err) {
      console.error('Error al cargar comentarios:', err);
      setCommentsError('No se pudieron cargar los comentarios. Por favor, inténtelo de nuevo.');
    } finally {
      setCommentsLoading(false);
    }
  };

  /**
   * Actualiza la lista de comentarios cuando se añade uno nuevo
   * @param {Object} newComment - Nuevo comentario añadido
   * @param {Array} updatedComments - Lista completa de comentarios actualizada
   */
  const handleCommentAdded = (newComment, updatedComments) => {
    if (updatedComments) {
      setComments(updatedComments);
      return;
    }
    
    if (newComment) {
      setComments(prevComments => [newComment, ...prevComments]);
    }
  };

  /**
   * Carga los detalles de la subasta al iniciar
   */
  useEffect(() => {
    const fetchAuctionDetails = async () => {
      if (!params.id) {
        setError('ID de subasta no proporcionado');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // 1. Obtener datos básicos de la subasta
        const data = await authFetch(API_ROUTES.AUCTION_BY_ID(params.id));
        setAuction(data);
        
        // 2. Actualizar precio actual
        setCurrentPrice(parseFloat(data.precio_actual) || parseFloat(data.precio_inicial) || 0);

        // 3. Comprobar si el usuario ya ha valorado la subasta
        if (data.ratings && Array.isArray(data.ratings) && currentUser) {
          const userExistingRating = data.ratings.find(
            rating => String(rating.usuario) === String(currentUser.id)
          );

          if (userExistingRating) {
            setUserRating(userExistingRating.valor);
            setRatingSubmitted(true);
            setIdRating(userExistingRating.id);
          }
        }

        // 4. Procesar historial de pujas
        if (data.pujas && Array.isArray(data.pujas)) {
          setBidsHistory(data.pujas);

          if (data.pujas.length > 0) {
            // Encontrar la puja más alta
            const highestBidItem = data.pujas.reduce(
              (max, bid) => parseFloat(bid.cantidad) > parseFloat(max.cantidad) ? bid : max,
              data.pujas[0]
            );

            const highestAmount = parseFloat(highestBidItem.cantidad);
            setHighestBid(highestAmount);

            // Calcular mínimo para la siguiente puja (5% más)
            const minNextBid = (highestAmount * 1.05).toFixed(2);
            setBidAmount(minNextBid);
          } else {
            // Si no hay pujas, calcular desde el precio inicial
            const initialPrice = parseFloat(data.precio_inicial) || 0;
            const minNextBid = (initialPrice * 1.05).toFixed(2);
            setBidAmount(minNextBid);
          }
        }

        // 5. Cargar comentarios
        fetchComments();
        
      } catch (err) {
        console.error('Error al cargar detalles de la subasta:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionDetails();
  }, [params.id, authFetch, currentUser]);

  /**
   * Maneja el envío de una nueva puja
   * @param {Object} e - Evento del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!params.id) {
      setError('ID de subasta no proporcionado');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Enviar la puja
      const data = await authFetch(API_ROUTES.AUCTION_BIDS(params.id), {
        method: 'POST',
        body: JSON.stringify({ cantidad: bidAmount }),
      });

      // 2. Actualizar datos locales con la nueva puja
      const newBidAmount = parseFloat(data.cantidad);
      setCurrentPrice(newBidAmount);
      setHighestBid(newBidAmount);

      // 3. Calcular mínimo para siguiente puja
      const minNextBid = (newBidAmount * 1.05).toFixed(2);
      setBidAmount(minNextBid);

      // 4. Recargar datos actualizados de la subasta
      const auctionData = await authFetch(API_ROUTES.AUCTION_BY_ID(params.id));
      setAuction(auctionData);

      if (auctionData.pujas && Array.isArray(auctionData.pujas)) {
        setBidsHistory(auctionData.pujas);
      }

      // 5. Notificar al usuario
      alert(`¡Puja realizada con éxito! Tu puja: ${formatPrice(newBidAmount)}`);
      
    } catch (err) {
      console.error('Error al hacer puja:', err);
      setError(err.message);
      alert(`Error al hacer puja: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el envío o actualización de una valoración
   */
  const handleRatingSubmit = async () => {
    if (!currentUser || userRating === 0) {
      return;
    }

    try {
      setRatingLoading(true);
      setError(null);

      // Crear nueva valoración o actualizar existente
      if (!ratingSubmitted) {
        await authFetch(API_ROUTES.AUCTION_RATINGS(params.id), {
          method: 'POST',
          body: JSON.stringify({
            valor: userRating,
          }),
        });
      } else {
        await authFetch(API_ROUTES.RATING_BY_ID(params.id, idRating), {
          method: 'PUT',
          body: JSON.stringify({
            valor: userRating,
          }),
        });
      }

      setRatingSubmitted(true);

      // Actualizar datos de la subasta
      const updatedData = await authFetch(API_ROUTES.AUCTION_BY_ID(params.id));
      setAuction(updatedData);

      alert('¡Gracias por tu valoración!');
    } catch (err) {
      console.error('Error al enviar valoración:', err);
      setError('No se pudo enviar la valoración: ' + (err.message || 'Error desconocido'));
      alert('Error al enviar la valoración: ' + (err.message || 'Error desconocido'));
    } finally {
      setRatingLoading(false);
    }
  };

  // Renderizado condicional para estados de carga y error
  if (loading || fetchLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando detalles de la subasta...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Volver
        </button>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className={styles.errorContainer}>
        <p>No se encontró la subasta solicitada</p>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Volver
        </button>
      </div>
    );
  }

  // Variables derivadas de los datos de la subasta
  const isOwner = currentUser && auction?.usuario === currentUser.id;
  const title = auction?.titulo || 'Sin título';
  const description = auction?.descripcion || 'Sin descripción';
  const category = auction?.categoria_nombre || 'Sin categoría';
  const endDate = auction?.fecha_cierre || new Date().toISOString();
  const isAuctionEnded = new Date(endDate) < new Date();

  const precio_actual = parseFloat(auction?.precio_actual) || parseFloat(auction?.precio_inicial) || 0;
  const numBids = bidsHistory.length || 0;
  const buyNowPrice = (precio_actual * 1.3).toFixed(2); // Precio de "comprar ahora" = precio actual + 30%
  const minBidAmount = (precio_actual * 1.05).toFixed(2); // Puja mínima = precio actual + 5%

  const seller = auction?.usuario_nombre || 'Vendedor no disponible';
  const imageToShow = auction?.imagen || '/images/prod_img/default-product.jpg';

  return (
    <div className={styles.auctionDetailContainer}>
      {/* Botón de retroceso */}
      <button onClick={() => router.back()} className={styles.backButton}>
        ← Volver
      </button>

      {/* Cabecera de la subasta */}
      <div className={styles.auctionHeader}>
        <h1 className={styles.title}>{title}</h1>

        <div className={styles.ratingDisplay}>
          <StarRating value={parseFloat(auction?.valoracion) || 0} />
        </div>

        {/* Botón de edición (solo para propietario) */}
        {isOwner && (
          <button
            onClick={() => router.push(`/subastas/${params.id}/editar`)}
            className={styles.editButton}
          >
            ✏️ Editar Subasta
          </button>
        )}
      </div>

      {/* Barra de información: categoría y tiempo restante */}
      <div className={styles.infoBar}>
        <div className={styles.category}>Categoría: <strong>{category}</strong></div>
        <div className={styles.timeRemaining}>
          {isAuctionEnded ? (
            <span className={styles.endedBadge}>Subasta finalizada</span>
          ) : (
            <>Finaliza el: <strong>{formatDateTime(endDate)}</strong></>
          )}
        </div>
      </div>

      {/* Contenido principal: 2 columnas */}
      <div className={styles.mainContent}>
        {/* Columna izquierda: imagen, descripción, vendedor, historial */}
        <div className={styles.leftCol}>
          {/* Imagen del producto */}
          <div className={styles.productImageContainer}>
            <Image
              src={imageToShow}
              alt={title}
              width={500}
              height={350}
              className={styles.productImage}
              style={{
                objectFit: 'contain',
                width: '100%',
                height: 'auto'
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/prod_img/default-product.jpg';
              }}
              priority={true}
            />
          </div>

          {/* Descripción */}
          <div className={styles.descriptionBox}>
            <h3 className={styles.sectionTitle}>Descripción</h3>
            <p>{description}</p>
          </div>

          {/* Información del vendedor */}
          <div className={styles.sellerBox}>
            <h3 className={styles.sectionTitle}>Vendedor</h3>
            <div className={styles.sellerInfo}>
              <div className={styles.sellerAvatar}>👤</div>
              <div className={styles.sellerDetails}>
                <p className={styles.sellerName}>{seller}</p>
                {auction?.fecha_registro && (
                  <p className={styles.sellerSince}>
                    Miembro desde: {formatDateTime(auction.fecha_registro)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Historial de pujas */}
          <div className={styles.bidsHistoryBox}>
            <h3 className={styles.sectionTitle}>Historial de Pujas</h3>
            {Array.isArray(bidsHistory) && bidsHistory.length > 0 ? (
              <table className={styles.bidsTable}>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Cantidad</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {bidsHistory.map((bid) => (
                    <tr 
                      key={bid.id} 
                      className={currentUser && bid.pujador === currentUser.id ? styles.userBid : ''}
                    >
                      <td>{bid.pujador_nombre || `Usuario #${bid.pujador}`}</td>
                      <td>{formatPrice(bid.cantidad)}</td>
                      <td>{formatDateTime(bid.fecha_puja)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.noBids}>No hay pujas realizadas aún.</p>
            )}
          </div>

          {/* Sistema de valoraciones */}
          <div className={styles.ratingBox}>
            <h3 className={styles.sectionTitle}>Valora este producto</h3>

            {/* Condicionalmente mostrar opciones según estado de usuario */}
            {!currentUser ? (
              <p className={styles.loginRequired}>
                <a href="/login">Inicia sesión</a> para valorar este producto
              </p>
            ) : ratingSubmitted ? (
              <div className={styles.ratingSuccess}>
                <p>Tu valoracion actual:</p>
                <div className={styles.ratingDisplay}>
                  <StarRating
                    value={userRating}
                    readOnly={false}
                    onChange={(e, newValue) => {
                      setUserRating(newValue);
                    }}
                  />
                </div>
                <button
                  onClick={handleRatingSubmit}
                  disabled={ratingLoading}
                  className={styles.ratingButton}
                >
                  {ratingLoading ? 'Actualizando...' : 'Actualizar valoración'}
                </button>
              </div>
            ) : (
              <div className={styles.ratingForm}>
                <StarRating
                  value={userRating}
                  onChange={(e, newValue) => {
                    setUserRating(newValue);
                  }}
                  readOnly={ratingLoading}
                />
                <button
                  onClick={handleRatingSubmit}
                  disabled={!userRating || ratingLoading}
                  className={styles.ratingButton}
                >
                  {ratingLoading ? 'Enviando...' : 'Enviar Valoración'}
                </button>
              </div>
            )}
          </div>

          {/* Sección de comentarios */}
          <div className={styles.commentsSection}>
            <CommentSection
              auctionId={params.id}
              currentUser={currentUser}
              authFetch={authFetch}
              comments={comments}
              commentsLoading={commentsLoading}
              commentsError={commentsError}
              onCommentAdded={handleCommentAdded}
            />
          </div>
        </div>

        {/* Columna derecha: información de puja y formulario */}
        <div className={styles.rightCol}>
          <div className={styles.bidBox}>
            <h3 className={styles.sectionTitle}>Información de puja</h3>

            {/* Información de precios */}
            <div className={styles.priceInfo}>
              <p className={styles.priceRow}>
                <span className={styles.priceLabel}>Precio actual:</span>
                <span className={styles.priceValue}>{formatPrice(precio_actual)}</span>
              </p>

              <p className={styles.priceRow}>
                <span className={styles.priceLabel}>Pujas realizadas:</span>
                <span className={styles.bidCount}>{numBids}</span>
              </p>

              <p className={styles.priceRow}>
                <span className={styles.priceLabel}>Comprar ahora:</span>
                <span className={styles.buyNowPrice}>{formatPrice(buyNowPrice)}</span>
              </p>
            </div>

            {/* Formulario de puja (solo mostrado si la subasta está activa y el usuario no es propietario) */}
            {!isAuctionEnded && !isOwner ? (
              <form onSubmit={handleSubmit} className={styles.bidForm}>
                <div className={styles.inputGroup}>
                  <label htmlFor="bidAmount">Tu puja:</label>
                  <input
                    id="bidAmount"
                    type="number"
                    min={minBidAmount}
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className={styles.bidInput}
                    placeholder={`Mínimo ${formatPrice(minBidAmount)}`}
                    required
                  />
                  <small className={styles.bidInfo}>
                    La puja mínima es de {formatPrice(minBidAmount)}
                  </small>
                </div>

                {/* Botón de puja */}
                <button
                  type="submit"
                  className={styles.bidButton}
                  disabled={loading || !currentUser}
                >
                  {loading ? 'Procesando...' : 'Realizar Puja'}
                </button>

                {/* Botón de compra directa */}
                <button
                  type="button"
                  className={styles.buyNowButton}
                  disabled={loading || !currentUser}
                  onClick={() => {
                    if (currentUser) {
                      // Establecer monto de compra directa y confirmar
                      setBidAmount(buyNowPrice);
                      setTimeout(() => {
                        if (confirm(`¿Confirmar compra directa por ${formatPrice(buyNowPrice)}?`)) {
                          const event = { preventDefault: () => {} };
                          handleSubmit(event);
                        }
                      }, 100);
                    } else {
                      alert("Debes iniciar sesión para comprar");
                    }
                  }}
                >
                  Comprar Ahora por {formatPrice(buyNowPrice)}
                </button>

                {/* Mensaje para usuarios no autenticados */}
                {!currentUser && (
                  <p className={styles.loginRequired}>
                    <a href="/login">Inicia sesión</a> para participar en esta subasta
                  </p>
                )}
              </form>
            ) : (
              <div className={styles.notAvailable}>
                {isAuctionEnded ? (
                  <p>Esta subasta ha finalizado</p>
                ) : isOwner ? (
                  <p>No puedes pujar en tu propia subasta</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;
