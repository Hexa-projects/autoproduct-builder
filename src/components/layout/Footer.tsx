import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { Truck, RotateCcw, Banknote, Phone } from 'lucide-react';

const footerLinks = {
  Categorías: [
    { label: 'Soporte y Postura', to: '/colecciones/soporte-postura' },
    { label: 'Recuperación', to: '/colecciones/recuperacion' },
    { label: 'Accesorios Gym', to: '/colecciones/accesorios' },
    { label: 'Todos los productos', to: '/colecciones' },
  ],
  Ayuda: [
    { label: 'Mi cuenta', to: '/account' },
    { label: 'Contacto', to: '/contacto' },
    { label: 'Envíos y entregas', to: '/envios' },
    { label: 'Devoluciones', to: '/devoluciones' },
    { label: 'Preguntas frecuentes', to: '/faq' },
  ],
  Legal: [
    { label: 'Aviso legal', to: '/legal' },
    { label: 'Privacidad', to: '/privacidad' },
    { label: 'Términos', to: '/terminos' },
    { label: 'Cookies', to: '/cookies' },
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
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-5 sm:grid-cols-4 sm:gap-4 sm:py-6">
          {trustItems.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 sm:gap-2">
              <Icon className="h-4 w-4 shrink-0 text-background/70 sm:h-5 sm:w-5" />
              <span className="text-[11px] font-medium sm:text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <img src={logo} alt="Revolución Fit" className="mb-3 h-7 brightness-0 invert sm:h-8 sm:mb-4" />
            <p className="text-xs leading-relaxed text-background/70 max-w-xs sm:text-sm">
              Equipamiento fitness con pago contra reembolso. Recibes primero, pagas después.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-background/50 sm:mb-3 sm:text-sm">
                {title}
              </h3>
              <ul className="space-y-1.5 sm:space-y-2">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-xs text-background/70 transition-colors hover:text-background sm:text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-background/10 pt-5 flex flex-col items-center gap-1 text-[10px] text-background/50 sm:flex-row sm:justify-between sm:text-xs sm:pt-6 sm:mt-10">
          <span>© {new Date().getFullYear()} Revolución Fit. Todos los derechos reservados.</span>
          <span>IVA incluido en todos los precios.</span>
        </div>
      </div>
    </footer>
  );
}
