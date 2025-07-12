import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <p>&copy; Pacomprar. O Pavender. Lo que quiera usted hacer.</p>
      <nav className="footer__nav">
        <Link href="/" className="footer__link">Inicio</Link>
        <Link href="/login" className="footer__link">Inicio de Sesión</Link>
        <Link href="/registro" className="footer__link">Registrarse</Link>
      </nav>
    </footer>
  );
}
