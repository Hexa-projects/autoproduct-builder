import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import { trackAuthEvent } from '@/lib/tracking';

export default function RecoverPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { trackAuthEvent('recover_view'); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Introduce un email válido');
      return;
    }
    setLoading(true);
    trackAuthEvent('recover_submit');
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/account/reset-password`,
    });
    setLoading(false);
    setSent(true);
  };

  return (
    <Layout>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
        <h1 className="mb-2 text-center text-2xl font-bold text-foreground">Recuperar contraseña</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Te enviaremos un enlace para restablecer tu contraseña
        </p>

        {sent ? (
          <div className="rounded-lg border bg-card p-6 text-center">
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-accent" />
            <p className="font-medium text-foreground">¡Revisa tu bandeja de entrada!</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Si el email existe en nuestro sistema, te hemos enviado instrucciones para restablecer tu contraseña.
            </p>
            <Link to="/account/login">
              <Button variant="outline" className="mt-6">Volver al inicio de sesión</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="tu@email.com"
                value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                className={error ? 'border-destructive' : ''} />
              {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : 'Enviar enlace de recuperación'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/account/login" className="hover:text-foreground transition-colors">
                ← Volver al inicio de sesión
              </Link>
            </p>
          </form>
        )}

        <div className="mt-8 flex justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Datos protegidos</span>
        </div>
      </div>
    </Layout>
  );
}
