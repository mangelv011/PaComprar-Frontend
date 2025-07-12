'use client';

import { Suspense } from 'react';
import styles from './styles.module.css';
import AuctionItem from '../../components/AuctionItem/AuctionItem';
import SubastasContent from './SubastasContent';

// Componente de carga mientras se resuelve la suspense
function SubastasLoading() {
  return (
    <div className={styles.loading}>
      <div className={styles.spinner}></div>
      <p>Cargando subastas...</p>
    </div>
  );
}

export default function SubastasPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Subastas disponibles</h1>
      <Suspense fallback={<SubastasLoading />}>
        <SubastasContent />
      </Suspense>
    </div>
  );
}
