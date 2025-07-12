'use client';

import Link from 'next/link';
import styles from './page.module.css';

export default function NotFound() {
  return (
    <div className={styles.notFound}>
      <h1>404 - Página no encontrada</h1>
      <p>La página que estás buscando no existe.</p>
      <Link href="/" className={styles.ctaButton}>
        Volver a inicio
      </Link>
    </div>
  );
}
