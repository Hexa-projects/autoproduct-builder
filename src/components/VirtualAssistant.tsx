import { useState } from 'react';
import { MessageCircle, X, ChevronRight, ArrowLeft, Banknote, Truck, RotateCcw, ShieldCheck, Phone, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface FAQ {
  question: string;
  answer: string;
  icon: typeof Banknote;
}

const FAQS: FAQ[] = [
  {
    question: '¿Cómo funciona el pago contra reembolso?',
    answer: 'Haces tu pedido sin pagar nada. Te contactamos para confirmar, enviamos el producto y pagas al repartidor cuando lo recibes en casa. Sin tarjeta ni pago anticipado.',
    icon: Banknote,
  },
  {
    question: '¿Cuánto tarda el envío?',
    answer: 'Procesamos tu pedido en menos de 1 hora y la entrega es en 2–5 días laborables en España peninsular. Recibirás un número de seguimiento.',
    icon: Truck,
  },
  {
    question: '¿Puedo devolver el producto?',
    answer: 'Sí. Tienes 30 días para devolver el producto sin coste y sin explicaciones. Te recogemos el paquete en tu domicilio.',
    icon: RotateCcw,
  },
  {
    question: '¿Tiene algún coste extra el contra reembolso?',
    answer: 'No, ninguno. El precio que ves es el precio final. Sin recargos, sin sorpresas. El envío también es gratuito.',
    icon: ShieldCheck,
  },
  {
    question: '¿Cómo confirman mi pedido?',
    answer: 'Te contactamos por teléfono o WhatsApp en menos de 24 horas para confirmar tu dirección y los detalles del envío.',
    icon: Phone,
  },
  {
    question: '¿Qué pasa si no estoy en casa?',
    answer: 'El repartidor intentará la entrega hasta 2 veces. También puedes indicar un horario preferido en las notas del pedido para que coincida con tu disponibilidad.',
    icon: Package,
  },
];

export function VirtualAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 right-3 z-[55] flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-110 active:scale-95 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
            aria-label="Abrir asistente virtual"
          >
            <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-3 z-[55] w-[calc(100vw-24px)] max-w-[360px] rounded-xl border bg-card shadow-2xl sm:bottom-6 sm:right-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-xl bg-accent px-4 py-3">
              <div className="flex items-center gap-2">
                {selectedFAQ && (
                  <button onClick={() => setSelectedFAQ(null)} className="mr-1">
                    <ArrowLeft className="h-4 w-4 text-accent-foreground" />
                  </button>
                )}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-foreground/20">
                  <MessageCircle className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-accent-foreground">Asistente virtual</p>
                  <div className="flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-foreground opacity-50" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-foreground" />
                    </span>
                    <span className="text-[10px] text-accent-foreground/80">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => { setIsOpen(false); setSelectedFAQ(null); }} className="rounded-full p-1 hover:bg-accent-foreground/10">
                <X className="h-5 w-5 text-accent-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                {!selectedFAQ ? (
                  <motion.div
                    key="faq-list"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Welcome message */}
                    <div className="mb-4 rounded-lg bg-muted/50 p-3">
                      <p className="text-xs leading-relaxed text-foreground">
                        👋 ¡Hola! Soy tu asistente virtual. Estoy aquí para resolver tus dudas sobre
                        pedidos, envíos y devoluciones. ¿En qué puedo ayudarte?
                      </p>
                    </div>

                    {/* FAQ buttons */}
                    <div className="space-y-2">
                      {FAQS.map((faq, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedFAQ(faq)}
                          className="flex w-full items-center gap-2.5 rounded-lg border p-3 text-left transition-colors hover:bg-muted/40 active:scale-[0.98]"
                        >
                          <faq.icon className="h-4 w-4 shrink-0 text-accent" />
                          <span className="flex-1 text-xs font-medium leading-snug">{faq.question}</span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="faq-answer"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Question bubble */}
                    <div className="mb-3 flex justify-end">
                      <div className="max-w-[85%] rounded-lg bg-accent/10 px-3 py-2">
                        <p className="text-xs font-medium">{selectedFAQ.question}</p>
                      </div>
                    </div>

                    {/* Answer bubble */}
                    <div className="mb-4 flex justify-start">
                      <div className="max-w-[90%] rounded-lg bg-muted/50 px-3 py-2.5">
                        <p className="text-xs leading-relaxed text-foreground">{selectedFAQ.answer}</p>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="space-y-2 rounded-lg border bg-accent/5 p-3">
                      <p className="text-[11px] text-muted-foreground">¿Listo para hacer tu pedido?</p>
                      <Button asChild size="sm" className="w-full gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 text-xs">
                        <Link to="/colecciones" onClick={() => { setIsOpen(false); setSelectedFAQ(null); }}>
                          <Banknote className="h-3.5 w-3.5" />
                          Ver productos
                        </Link>
                      </Button>
                    </div>

                    {/* Other questions */}
                    <button
                      onClick={() => setSelectedFAQ(null)}
                      className="mt-3 w-full text-center text-[11px] font-medium text-accent hover:underline"
                    >
                      ← Ver otras preguntas
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
