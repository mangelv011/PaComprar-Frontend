/**
 * Configuración centralizada de la API
 * Este archivo permite cambiar fácilmente la URL base de la API
 * modificando solo este valor en un único lugar.
 */

// URL base para todas las llamadas a la API
export const API_BASE_URL = 'https://pacomprarserver.onrender.com/api';

/**
 * Construye una URL completa para la API
 * @param {string} path - Ruta relativa de la API (sin barra inicial)
 * @returns {string} URL completa
 */
export const getApiUrl = (path) => {
  // Asegurarse de que path no comienza con barra y la URL base no termina con barra
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

/**
 * Rutas específicas de la API
 * Centraliza los endpoints comunes para facilitar cambios
 */
export const API_ROUTES = {
  // Autenticación
  LOGIN: getApiUrl('token/'),
  LOGOUT: getApiUrl('usuarios/log-out/'),
  REFRESH_TOKEN: getApiUrl('token/refresh/'),
  REGISTER: 'https://das-p2-backend.onrender.com/api/users/register/', // Nota: usa un dominio diferente
  USER_PROFILE: getApiUrl('usuarios/profile/'),
  CHANGE_PASSWORD: getApiUrl('usuarios/change-password/'),
  
  // Subastas
  AUCTIONS: getApiUrl('subastas/'),
  AUCTION_BY_ID: (id) => getApiUrl(`subastas/${id}/`),
  AUCTION_CATEGORIES: getApiUrl('subastas/categorias/'),
  MY_AUCTIONS: getApiUrl('misSubastas/'),
  
  // Pujas
  MY_BIDS: getApiUrl('misPujas/'),
  AUCTION_BIDS: (auctionId) => getApiUrl(`subastas/${auctionId}/pujas/`),
  BID_BY_ID: (auctionId, bidId) => getApiUrl(`subastas/${auctionId}/pujas/${bidId}/`),
  
  // Comentarios
  AUCTION_COMMENTS: (auctionId) => getApiUrl(`subastas/${auctionId}/comentarios/`),
  COMMENT_BY_ID: (auctionId, commentId) => getApiUrl(`subastas/${auctionId}/comentarios/${commentId}/`),
  
  // Valoraciones
  AUCTION_RATINGS: (auctionId) => getApiUrl(`subastas/${auctionId}/ratings/`),
  RATING_BY_ID: (auctionId, ratingId) => getApiUrl(`subastas/${auctionId}/ratings/${ratingId}/`),
};

export default {
  API_BASE_URL,
  getApiUrl,
  API_ROUTES
};