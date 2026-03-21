import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollReveal } from '@/components/ScrollReveal';

const codFaqItems = [
  {
    q: '¿Tengo que pagar ahora?',
    a: 'No. No necesitas tarjeta ni pago anticipado. Solo pagas cuando recibes el producto en tu domicilio.',
  },
  {
    q: '¿Cómo se confirma mi pedido?',
    a: 'Después de hacer tu pedido, te contactamos por teléfono o WhatsApp para confirmar la dirección y los detalles del envío.',
  },
  {
    q: '¿En cuánto tiempo llega mi pedido?',
    a: 'Los pedidos se procesan en 24 horas y la entrega es en 2–5 días laborables en España peninsular.',
  },
  {
    q: '¿Puedo rechazar el pedido o devolverlo?',
    a: 'Sí. Si no estás satisfecho, tienes 30 días para devolver el producto. También puedes rechazar la entrega.',
  },
  {
    q: '¿Tiene coste extra el pago contra reembolso?',
    a: 'No. El precio que ves es el precio final. Sin recargos ni costes ocultos por pagar contra reembolso.',
  },
];

export function CODFaq({ className }: { className?: string }) {
  return (
    <div className={className}>
      <ScrollReveal>
        <h2
          className="text-center text-2xl font-bold tracking-tight sm:text-3xl"
          style={{ lineHeight: '1.1' }}
        >
          Preguntas frecuentes sobre Pago Contra Reembolso
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
          Resolvemos tus dudas para que compres con total tranquilidad.
        </p>
      </ScrollReveal>

      <div className="mx-auto mt-8 max-w-2xl">
        <Accordion type="single" collapsible>
          {codFaqItems.map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.04}>
              <AccordionItem value={`cod-faq-${i}`}>
                <AccordionTrigger className="text-sm font-semibold text-left">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            </ScrollReveal>
          ))}
        </Accordion>
      </div>
    </div>
  );
}