import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, ShieldCheck, Headphones, Package } from 'lucide-react';
import { trackAuthEvent } from '@/lib/tracking';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => { trackAuthEvent('login_view'); }, []);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Introduce tu email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email no válido';
    if (!password) e.password = 'Introduce tu contraseña';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    trackAuthEvent('login_submit');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      if (error.message.includes('Invalid login')) {
        setErrors({ password: 'Email o contraseña incorrectos' });
      } else {
        toast.error('Error al iniciar sesión. Inténtalo de nuevo.');
      }
      return;
    }
    trackAuthEvent('login_success');
    toast.success('¡Bienvenido de nuevo!');
    navigate('/account');
  };

  return (
    <Layout>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
        <h1 className="mb-2 text-center text-2xl font-bold text-foreground">Iniciar sesión</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Accede a tu cuenta para gestionar tus pedidos
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email" type="email" autoComplete="email" placeholder="tu@email.com"
              value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                placeholder="••••••••" value={password}
                onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
          </div>

          <div className="text-right">
            <Link to="/account/recover" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando…</> : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link to="/account/register" className="font-medium text-foreground hover:underline">
            Crear cuenta
          </Link>
        </p>

        {/* Trust badges */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Datos protegidos</span>
          <span className="flex items-center gap-1"><Headphones className="h-3.5 w-3.5" /> Soporte en español</span>
          <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" /> Gestiona tus pedidos</span>
        </div>
      </div>
    </Layout>
  );
}
