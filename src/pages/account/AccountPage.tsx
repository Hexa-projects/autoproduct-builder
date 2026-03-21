import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, LogOut, User, Package, Lock, Eye, EyeOff } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente de confirmación', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export default function AccountPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [tab, setTab] = useState<'orders' | 'profile' | 'security'>('orders');

  // Security tab state
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/account/login');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setLoadingOrders(true);
      const { data } = await supabase
        .from('cod_orders')
        .select('*')
        .or(`customer_email.eq.${user.email}`)
        .order('created_at', { ascending: false })
        .limit(20);
      setOrders(data || []);
      setLoadingOrders(false);
    };
    fetchOrders();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Sesión cerrada');
    navigate('/');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) { toast.error('Mínimo 8 caracteres'); return; }
    if (newPw !== confirmPw) { toast.error('Las contraseñas no coinciden'); return; }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSavingPw(false);
    if (error) { toast.error('Error al cambiar la contraseña'); return; }
    toast.success('Contraseña actualizada');
    setNewPw(''); setConfirmPw('');
  };

  if (authLoading || !user) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente';

  const tabs = [
    { key: 'orders' as const, label: 'Mis pedidos', icon: Package },
    { key: 'profile' as const, label: 'Mi perfil', icon: User },
    { key: 'security' as const, label: 'Seguridad', icon: Lock },
  ];

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">¡Hola, {displayName}!</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1" /> Cerrar sesión
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-secondary/50 p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <t.icon className="h-4 w-4" /> <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Orders */}
        {tab === 'orders' && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Mis pedidos</CardTitle></CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : orders.length === 0 ? (
                <div className="py-8 text-center">
                  <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Aún no tienes pedidos</p>
                  <Link to="/colecciones"><Button variant="outline" className="mt-4">Ver productos</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(o => {
                    const status = STATUS_MAP[o.status] || { label: o.status, color: 'bg-muted text-muted-foreground' };
                    return (
                      <div key={o.id} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">Pedido #{o.order_number}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>{status.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{new Date(o.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          <span className="font-medium text-foreground">{Number(o.total).toFixed(2)} €</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Profile */}
        {tab === 'profile' && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Mi perfil</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs">Nombre</Label>
                <p className="font-medium">{user.user_metadata?.full_name || '—'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Email</Label>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Teléfono</Label>
                <p className="font-medium">{user.user_metadata?.phone || '—'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security */}
        {tab === 'security' && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Cambiar contraseña</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                <div>
                  <Label htmlFor="newPw">Nueva contraseña</Label>
                  <div className="relative">
                    <Input id="newPw" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres" value={newPw} onChange={e => setNewPw(e.target.value)} className="pr-10" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPw">Confirmar contraseña</Label>
                  <Input id="confirmPw" type="password" autoComplete="new-password" placeholder="Repite la contraseña"
                    value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                </div>
                <Button type="submit" disabled={savingPw}>
                  {savingPw ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : 'Guardar contraseña'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
