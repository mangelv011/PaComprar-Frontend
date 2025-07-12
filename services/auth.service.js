import { API_BASE_URL, API_ROUTES } from "../config/apiConfig";

class AuthService {
  async login(username, password) {
    try {
      const response = await fetch(API_ROUTES.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error de inicio de sesión');
      }

      const data = await response.json();
      
      localStorage.setItem('user', JSON.stringify({
        id: this.parseJwt(data.access).user_id,
        username: data.username,
        access: data.access,
        refresh: data.refresh
      }));
      
      return this.getCurrentUser();
    } catch (error) {
      console.error('Error en AuthService.login:', error);
      throw error;
    }
  }

  logout() {
    const user = this.getCurrentUser();
    
    if (user && user.refresh) {
      fetch(API_ROUTES.LOGOUT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: user.refresh })
      }).catch(error => console.error('Error en logout:', error));
    }
    localStorage.removeItem('user');
  }

  async register(userData) {
    const response = await fetch(API_ROUTES.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || 
        Object.values(errorData).flat().join(', ') || 
        'Error de registro'
      );
    }

    return response.json();
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }

  async refreshToken() {
    const user = this.getCurrentUser();
    
    if (!user || !user.refresh) {
      return null;
    }

    try {
      const response = await fetch(API_ROUTES.REFRESH_TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: user.refresh })
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const data = await response.json();
      
      const updatedUser = { ...user, access: data.access };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      console.error('Error al actualizar token:', error);
      this.logout();
      return null;
    }
  }
  parseJwt(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }

  isTokenExpired() {
    const user = this.getCurrentUser();
    if (!user || !user.access) return true;
    
    const decodedJwt = this.parseJwt(user.access);
    return decodedJwt.exp * 1000 < Date.now();
  }
}

export default new AuthService();