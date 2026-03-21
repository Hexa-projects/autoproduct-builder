import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, ShieldCheck, Headphones, Package } from 'lucide-react';
import { trackAuthEvent } from '@/lib/tracking';

interface FormData {
  firstName: string; lastName: string; email: string; phone: string;
  password: string; confirmPassword: string; terms: boolean;
}

const initial: FormData = { firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', terms: false };

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(initial);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => { trackAuthEvent('register_view'); }, []);

  const set = (key: keyof FormData, value: string | boolean) => {
    setForm(p => ({ ...p, [key]: value }));
    setErrors(p => ({ ...p, [key]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.firstName.trim()) e.firstName = 'Nombre obligatorio';
    if (!form.lastName.trim()) e.lastName = 'Apellidos obligatorios';
    if (!form.email.trim()) e.email = 'Email obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email no válido';
    if (!form.password) e.password = 'Contraseña obligatoria';
    else if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    if (!form.terms) e.terms = 'Debes aceptar los términos';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    trackAuthEvent('register_submit');

    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          full_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          phone: form.phone.trim() || undefined,
        },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        setErrors({ email: 'Este email ya está registrado' });
      } else {
        toast.error('Error al crear la cuenta. Inténtalo de nuevo.');
      }
      return;
    }
    trackAuthEvent('register_success');
    toast.success('¡Cuenta creada con éxito! Bienvenido/a.');
    navigate('/account');
  };

  const Field = ({ id, label, type = 'text', autoComplete, placeholder, value, onChange, error, optional, children }: any) => (
    <div>
      <Label htmlFor={id}>{label}{optional && <span className="text-muted-foreground font-normal"> (opcional)</span>}</Label>
      {children || (
        <Input id={id} type={type} autoComplete={autoComplete} placeholder={placeholder}
          value={value} onChange={onChange} className={error ? 'border-destructive' : ''} />
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );

  return (
    <Layout>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
        <h1 className="mb-2 text-center text-2xl font-bold text-foreground">Crear cuenta</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Crea tu cuenta y gestiona tus pedidos fácilmente
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field id="firstName" label="Nombre" autoComplete="given-name" placeholder="Juan"
              value={form.firstName} onChange={(e: any) => set('firstName', e.target.value)} error={errors.firstName} />
            <Field id="lastName" label="Apellidos" autoComplete="family-name" placeholder="García"
              value={form.lastName} onChange={(e: any) => set('lastName', e.target.value)} error={errors.lastName} />
          </div>

          <Field id="email" label="Email" type="email" autoComplete="email" placeholder="tu@email.com"
            value={form.email} onChange={(e: any) => set('email', e.target.value)} error={errors.email} />

          <Field id="phone" label="Teléfono" type="tel" autoComplete="tel" placeholder="612 345 678"
            value={form.phone} onChange={(e: any) => set('phone', e.target.value)} error={errors.phone} optional />

          <Field id="password" label="Contraseña" error={errors.password}>
            <div className="relative">
              <Input id="password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                placeholder="Mínimo 8 caracteres" value={form.password}
                onChange={(e: any) => set('password', e.target.value)}
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPw ? 'Ocultar' : 'Mostrar'}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Field id="confirmPassword" label="Confirmar contraseña" error={errors.confirmPassword}>
            <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Repite la contraseña"
              value={form.confirmPassword} onChange={(e: any) => set('confirmPassword', e.target.value)}
              className={errors.confirmPassword ? 'border-destructive' : ''} />
          </Field>

          <div className="flex items-start gap-2">
            <Checkbox id="terms" checked={form.terms} onCheckedChange={v => set('terms', !!v)} className="mt-0.5" />
            <Label htmlFor="terms" className="text-sm font-normal leading-snug">
              Acepto la{' '}
              <Link to="/privacidad" className="underline hover:text-foreground">política de privacidad</Link> y{' '}
              <Link to="/terminos" className="underline hover:text-foreground">términos y condiciones</Link>
            </Label>
          </div>
          {errors.terms && <p className="text-xs text-destructive -mt-2">{errors.terms}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando cuenta…</> : 'Crear mi cuenta'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link to="/account/login" className="font-medium text-foreground hover:underline">Iniciar sesión</Link>
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Datos protegidos</span>
          <span className="flex items-center gap-1"><Headphones className="h-3.5 w-3.5" /> Soporte en español</span>
          <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" /> Gestiona tus pedidos</span>
        </div>
      </div>
    </Layout>
  );
}
