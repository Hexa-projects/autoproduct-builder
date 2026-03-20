import { Layout } from '@/components/layout/Layout';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Mensaje enviado', { description: 'Te responderemos lo antes posible.' });
  };

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ScrollReveal>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.15' }}>
            Contacto
          </h1>
          <p className="mt-2 text-muted-foreground">
            ¿Tienes alguna pregunta? Escríbenos y te responderemos en menos de 24 horas.
          </p>
        </ScrollReveal>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <ScrollReveal delay={0.1}>
            <div className="space-y-6">
              {[
                { icon: Mail, label: 'Email', value: 'hola@revolucionfit.com' },
                { icon: Clock, label: 'Horario', value: 'Lun–Vie, 9:00–18:00' },
                { icon: MapPin, label: 'Ubicación', value: 'España / Portugal' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6">
              <Input placeholder="Tu nombre" required />
              <Input type="email" placeholder="Tu email" required />
              <Textarea placeholder="Tu mensaje..." rows={4} required />
              <Button type="submit" className="w-full active:scale-[0.97]">
                Enviar mensaje
              </Button>
            </form>
          </ScrollReveal>
        </div>
      </div>
    </Layout>
  );
}
