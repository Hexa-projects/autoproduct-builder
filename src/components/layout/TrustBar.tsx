import { RotateCcw, CreditCard, MapPin, Truck } from 'lucide-react';

const items = [
  { icon: RotateCcw, text: 'Devolución gratuita en 30 días' },
  { icon: CreditCard, text: 'Pago a plazos disponible' },
  { icon: MapPin, text: 'Envío a toda España e Islas' },
  { icon: Truck, text: 'Entrega en 2–5 días laborables' },
];

// Double the items for seamless loop
const scrollItems = [...items, ...items];

export function TrustBar() {
  return (
    <div className="bg-foreground text-background overflow-hidden">
      <div className="relative flex whitespace-nowrap py-2">
        <div className="animate-marquee flex items-center gap-10 px-4">
          {scrollItems.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium sm:text-sm">{text}</span>
            </div>
          ))}
        </div>
        <div className="animate-marquee2 absolute top-0 flex items-center gap-10 px-4 py-2">
          {scrollItems.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium sm:text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
