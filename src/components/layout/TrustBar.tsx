import { RotateCcw, CreditCard, MapPin, Truck } from 'lucide-react';

const items = [
  { icon: Truck, text: 'Envío 2–5 días' },
  { icon: RotateCcw, text: 'Devolución 30 días' },
  { icon: CreditCard, text: 'Pago seguro' },
  { icon: MapPin, text: 'España e Islas' },
];

export function TrustBar() {
  return (
    <div className="bg-foreground text-background">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-2 sm:gap-10">
        {items.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-1.5 shrink-0">
            <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="text-[11px] font-medium sm:text-xs">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
