import { Truck, Banknote, ShieldCheck } from 'lucide-react';

const items = [
  { icon: Truck, text: 'Envío rápido España' },
  { icon: Banknote, text: 'Pago Contra Reembolso' },
  { icon: ShieldCheck, text: 'Paga al recibir' },
];

export function TrustBar() {
  return (
    <div className="bg-accent text-accent-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-3 py-2 overflow-x-auto sm:gap-8 sm:px-4">
        {items.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-1 shrink-0">
            <Icon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
            <span className="text-[10px] font-semibold whitespace-nowrap sm:text-xs">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
