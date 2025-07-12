'use client';

import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.homeContainer}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Bienvenido a Pacomprar</h1>
        <p className={styles.subtitle}>Tu plataforma de subastas online</p>
        <Link href="/subastas" className={styles.ctaButton}>
          Ver subastas
        </Link>
      </div>

      <div className={styles.featuredSections}>
        <div className={styles.section}>
          <h2>Subastas Destacadas</h2>
          <p>Encuentra artículos interesantes con los mejores precios</p>
          <div className={styles.categories}>
            <span className={styles.category}>Electrónica</span>
            <span className={styles.category}>Hogar</span>
            <span className={styles.category}>Moda</span>
            <span className={styles.category}>Deportes</span>
          </div>
        </div>
        
        <div className={styles.section}>
          <h2>¿Cómo funciona?</h2>
          <ol className={styles.steps}>
            <li>Regístrate en nuestra plataforma</li>
            <li>Busca productos que te interesen</li>
            <li>Realiza tu puja</li>
            <li>¡Gana la subasta y recibe tu producto!</li>
          </ol>
          <Link href="/registro" className={styles.registerLink}>
            Crear una cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
