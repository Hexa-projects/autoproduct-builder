import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { Truck, RotateCcw, ShieldCheck, Banknote, Phone } from 'lucide-react';

const footerLinks = {
  Categorías: [
    { label: 'Soporte y Postura', to: '/colecciones/soporte-postura' },
    { label: 'Recuperación', to: '/colecciones/recuperacion' },
    { label: 'Accesorios Gym', to: '/colecciones/accesorios' },
    { label: 'Todos los productos', to: '/colecciones' },
  ],
  Ayuda: [
    { label: 'Contacto', to: '/contacto' },
    { label: 'Envíos y entregas', to: '/envios' },
    { label: 'Devoluciones', to: '/devoluciones' },
    { label: 'Preguntas frecuentes', to: '/faq' },
  ],
  Legal: [
    { label: 'Aviso legal', to: '/legal' },
    { label: 'Política de privacidad', to: '/privacidad' },
    { label: 'Términos y condiciones', to: '/terminos' },
    { label: 'Política de cookies', to: '/cookies' },
  ],
};

const trustItems = [
  { icon: Banknote, text: 'Pago Contra Reembolso' },
  { icon: Truck, text: 'Envío 2–5 días' },
  { icon: RotateCcw, text: 'Devolución 30 días' },
  { icon: Phone, text: 'Atención en español' },
];

export function Footer() {
  return (
    <footer className="border-t bg-foreground text-background">
      {/* Trust strip */}
      <div className="border-b border-background/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-4">
          {trustItems.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="h-5 w-5 shrink-0 text-background/70" />
              <span className="text-xs font-medium sm:text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <img src={logo} alt="Revolución Fit" className="mb-4 h-8 brightness-0 invert" />
            <p className="text-sm leading-relaxed text-background/70 max-w-xs">
              Equipamiento fitness de calidad con pago contra reembolso. Compra sin riesgo: recibes primero, pagas después.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-background/50">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-background/70 transition-colors hover:text-background"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-background/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-background/50">
          <span>© {new Date().getFullYear()} Revolución Fit. Todos los derechos reservados.</span>
          <span>IVA incluido en todos los precios.</span>
        </div>
      </div>
    </footer>
  );
}