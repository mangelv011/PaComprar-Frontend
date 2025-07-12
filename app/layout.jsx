import './globals.css'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import { AuthProvider } from '../contexts/AuthContext';

export const metadata = {
  title: 'Pacomprar',
  description: 'Aplicación de subastas',
}

// Componente cliente separado para manejar el estado de autenticación
function Providers({ children }) {
  'use client';
  return <AuthProvider>{children}</AuthProvider>;
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="layout-container">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}