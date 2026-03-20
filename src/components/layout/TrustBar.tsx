import { Truck, RotateCcw, ShieldCheck } from 'lucide-react';

const items = [
  { icon: Truck, text: 'Envío rápido en 24–48h' },
  { icon: RotateCcw, text: 'Devolución fácil 30 días' },
  { icon: ShieldCheck, text: 'Pago 100% seguro' },
];

export function TrustBar() {
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-2 text-xs font-medium sm:gap-10 sm:text-sm">
        {items.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{text}</span>
            <span className="sm:hidden">{text.split(' ').slice(0, 2).join(' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
