import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

const footerLinks = {
  Tienda: [
    { label: 'Colecciones', to: '/colecciones' },
    { label: 'Ofertas', to: '/colecciones/ofertas' },
    { label: 'Novedades', to: '/colecciones' },
  ],
  Ayuda: [
    { label: 'Contacto', to: '/contacto' },
    { label: 'Envíos y entregas', to: '/envios' },
    { label: 'Devoluciones', to: '/devoluciones' },
  ],
  Legal: [
    { label: 'Aviso legal', to: '/legal' },
    { label: 'Política de privacidad', to: '/privacidad' },
    { label: 'Términos y condiciones', to: '/terminos' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <img src={logo} alt="Revolución Fit" className="mb-4 h-8" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Equipamiento fitness de calidad para mejorar tu rendimiento y comodidad en cada entrenamiento.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="rounded border px-2 py-1 text-[10px] font-semibold text-muted-foreground">VISA</span>
              <span className="rounded border px-2 py-1 text-[10px] font-semibold text-muted-foreground">MC</span>
              <span className="rounded border px-2 py-1 text-[10px] font-semibold text-muted-foreground">PAYPAL</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Revolución Fit. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
