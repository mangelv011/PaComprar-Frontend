'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import styles from './styles.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { FaSearch } from 'react-icons/fa';

function SearchComponent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState(() => {
    if (pathname === '/subastas') {
      return searchParams.get('search') || '';
    }
    return '';
  });

  useEffect(() => {
    if (pathname === '/subastas') {
      const urlSearchTerm = searchParams.get('search') || '';
      setSearchTerm(urlSearchTerm);
    }
  }, [pathname, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (searchTerm.trim()) {
      router.push(`/subastas?search=${encodeURIComponent(searchTerm.trim())}`);
    } else if (pathname === '/subastas') {
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.delete('search');
      const newQuery = currentParams.toString() ? `?${currentParams.toString()}` : '';
      router.push(`/subastas${newQuery}`);
    }
  };

  return (
    <form className={styles.searchForm} onSubmit={handleSearch}>
      <input 
        type="text" 
        placeholder="Buscar subastas..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={styles.searchInput}
        aria-label="Buscar subastas"
      />
      <button type="submit" className={styles.searchButton} aria-label="Buscar">
        <FaSearch />
      </button>
    </form>
  );
}

function SearchFallback() {
  return (
    <form className={styles.searchForm}>
      <input 
        type="text" 
        placeholder="Cargando buscador..." 
        disabled
        className={styles.searchInput}
        aria-label="Buscar subastas"
      />
      <button type="submit" className={styles.searchButton} aria-label="Buscar" disabled>
        <FaSearch />
      </button>
    </form>
  );
}

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={styles.header}>
      <div className={styles.topHeader}>
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logoLink}>
            <Image 
              src="/images/paco_logo.png" 
              alt="Pacomprar Logo" 
              width={120} 
              height={40} 
              className={styles.logo}
              priority
            />
          </Link>
        </div>
        
        <Suspense fallback={<SearchFallback />}>
          <SearchComponent />
        </Suspense>
        
        <div className={styles.mobileMenuToggle} onClick={toggleMobileMenu}>
          <div className={`${styles.menuBar} ${mobileMenuOpen ? styles.open : ''}`}></div>
          <div className={`${styles.menuBar} ${mobileMenuOpen ? styles.open : ''}`}></div>
          <div className={`${styles.menuBar} ${mobileMenuOpen ? styles.open : ''}`}></div>
        </div>
      </div>
      
      <nav className={`${styles.navbar} ${mobileMenuOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.navLinks}>
          <Link href="/" className={pathname === '/' ? styles.activeLink : styles.navLink}>
            Inicio
          </Link>
          <Link href="/subastas" className={pathname === '/subastas' ? styles.activeLink : styles.navLink}>
            Subastas
          </Link>
        </div>

        <div className={styles.userActions}>
          {currentUser ? (
            <>
              <span className={styles.welcomeText}>Hola, {currentUser.username}</span>
              <div className={styles.userMenu}>
                <button className={styles.userMenuButton}>Mi cuenta</button>
                <div className={styles.userMenuDropdown}>
                  <Link href="/perfil" className={styles.dropdownItem}>
                    Mi Perfil
                  </Link>
                  <Link href="/usuario" className={styles.dropdownItem}>
                    Editar Perfil
                  </Link>
                  <Link href="/usuario/mis_pujas" className={styles.dropdownItem}>
                    Mis Pujas
                  </Link>
                  <Link href="/subastas/mis_subastas" className={styles.dropdownItem}>
                    Mis Subastas
                  </Link>
                  <button
                    onClick={handleLogout}
                    className={styles.dropdownItem}
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`${styles.actionButton} ${styles.primaryButton}`}
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/registro"
                className={`${styles.actionButton} ${styles.secondaryButton}`}
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
