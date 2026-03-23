import { useState, useEffect } from 'react';
import { Eye, TrendingUp, Clock, Flame } from 'lucide-react';

interface UrgencyIndicatorsProps {
  productHandle: string;
}

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash % 100) / 100;
}

export function UrgencyIndicators({ productHandle }: UrgencyIndicatorsProps) {
  const [viewerCount, setViewerCount] = useState(0);

  const rand = seededRandom(productHandle);
  const recentOrders = Math.floor(rand * 30) + 12;
  const stockLeft = Math.floor(rand * 8) + 3;

  useEffect(() => {
    const base = Math.floor(rand * 10) + 5;
    setViewerCount(base);
    const interval = setInterval(() => {
      setViewerCount((v) => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(3, Math.min(base + 8, v + change));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [productHandle]);

  return (
    <div className="space-y-1.5">
      {/* Live viewers */}
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
        </span>
        <Eye className="h-3 w-3 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">
          <strong className="text-foreground">{viewerCount} personas</strong> viendo esto ahora
        </span>
      </div>

      {/* Recent orders */}
      <div className="flex items-center gap-1.5">
        <TrendingUp className="h-3 w-3 text-accent" />
        <span className="text-[11px] text-muted-foreground">
          <strong className="text-foreground">{recentOrders} pedidos</strong> en las últimas 24h
        </span>
      </div>

      {/* Low stock */}
      {stockLeft <= 7 && (
        <div className="flex items-center gap-1.5">
          <Flame className="h-3 w-3 text-warning" />
          <span className="text-[11px] font-medium text-warning">
            ¡Solo quedan {stockLeft} unidades!
          </span>
        </div>
      )}

      {/* Limited time */}
      <div className="flex items-center gap-1.5">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">
          Pide antes de las <strong className="text-foreground">23:59</strong> y recibe en 2-5 días
        </span>
      </div>
    </div>
  );
}
