import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { Eye, Package, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface CodOrder {
  id: string;
  order_number: number;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address: string;
  city: string;
  postal_code: string;
  province: string;
  country: string;
  items: any[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_method: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  processing: { label: 'Procesando', variant: 'default' },
  shipped: { label: 'Enviado', variant: 'outline' },
  delivered: { label: 'Entregado', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

export default function OrdersPage() {
  const [selected, setSelected] = useState<CodOrder | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['cod-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cod_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CodOrder[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Pedidos COD</h1>
          <p className="text-sm text-muted-foreground">{orders?.length || 0} pedidos</p>
        </div>
      </div>

      {!orders?.length ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aún no hay pedidos.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(order => {
                const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">#{order.order_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{order.city}</TableCell>
                    <TableCell className="font-semibold tabular-nums text-sm">€{Number(order.total).toFixed(2)}</TableCell>
                    <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'dd/MM/yy HH:mm')}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pedido #{selected?.order_number}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <Section title="Cliente">
                <p><b>Nombre:</b> {selected.customer_name}</p>
                <p><b>Teléfono:</b> {selected.customer_phone}</p>
                {selected.customer_email && <p><b>Email:</b> {selected.customer_email}</p>}
              </Section>
              <Section title="Dirección">
                <p>{selected.address}</p>
                <p>{selected.city}, {selected.postal_code}</p>
                <p>{selected.province}, {selected.country}</p>
              </Section>
              <Section title="Productos">
                {selected.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>{item.title} {item.variantTitle && `(${item.variantTitle})`} ×{item.quantity}</span>
                    <span className="tabular-nums font-medium">€{(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </Section>
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span>€{Number(selected.total).toFixed(2)}</span>
              </div>
              {selected.notes && (
                <Section title="Notas">
                  <p>{selected.notes}</p>
                </Section>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold text-muted-foreground mb-1 text-xs uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  );
}
