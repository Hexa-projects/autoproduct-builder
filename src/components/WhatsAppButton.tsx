import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '34612345678'; // Replace with actual number
const MESSAGE = '¡Hola! Me gustaría hacer un pedido con pago contra reembolso.';

export function WhatsAppButton() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-3 z-[55] flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 active:scale-95 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
    </a>
  );
}
