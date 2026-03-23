import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAMES = [
  'María G.', 'Carlos R.', 'Ana P.', 'Javier M.', 'Laura S.',
  'Pedro L.', 'Marta F.', 'Diego V.', 'Carmen A.', 'Andrés T.',
  'Lucía B.', 'Pablo D.', 'Elena H.', 'Roberto N.', 'Sofía C.',
];

const CITIES = [
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza',
  'Málaga', 'Bilbao', 'Murcia', 'Alicante', 'Córdoba',
];

const PRODUCTS = [
  'Rodillera Estabilizadora',
  'Masajeador de Rodilla',
  'Giroscopio de Mano',
  'Dilatador Nasal',
  'Calcetines Terapéuticos',
];

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomMinutes(): number {
  return Math.floor(Math.random() * 25) + 3;
}

export function SocialProofToast() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState({ name: '', city: '', product: '', minutes: 0 });

  useEffect(() => {
    const showNotification = () => {
      setData({
        name: random(NAMES),
        city: random(CITIES),
        product: random(PRODUCTS),
        minutes: randomMinutes(),
      });
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    };

    // First show after 8-15 seconds
    const firstDelay = (Math.random() * 7 + 8) * 1000;
    const firstTimer = setTimeout(() => {
      showNotification();
      // Then repeat every 25-45 seconds
      const interval = setInterval(showNotification, (Math.random() * 20 + 25) * 1000);
      return () => clearInterval(interval);
    }, firstDelay);

    return () => clearTimeout(firstTimer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30, x: 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.35 }}
          className="fixed bottom-20 left-3 z-[60] max-w-[280px] sm:bottom-6 sm:left-6 sm:max-w-xs"
        >
          <div className="flex items-start gap-2.5 rounded-lg border bg-card p-3 shadow-lg">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <ShoppingBag className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight">{data.name} de {data.city}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                Compró <span className="font-medium text-foreground">{data.product}</span>
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Hace {data.minutes} minutos
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
