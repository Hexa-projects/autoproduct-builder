import { Truck, Banknote, ShieldCheck } from 'lucide-react';

const items = [
  { icon: Truck, text: 'Envío rápido España' },
  { icon: Banknote, text: 'Pago Contra Reembolso' },
  { icon: ShieldCheck, text: 'Paga al recibir' },
];

export function TrustBar() {
  return (
    <div className="bg-accent text-accent-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-4 py-2 sm:gap-8">
        {items.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-1.5 shrink-0">
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[11px] font-semibold sm:text-xs">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}