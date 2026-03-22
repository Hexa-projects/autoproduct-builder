const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

interface OrderItem {
  title: string;
  variant: string;
  quantity: number;
  price: number;
}

interface OrderData {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
    if (!TELEGRAM_API_KEY) throw new Error('TELEGRAM_API_KEY is not configured');

    const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
    if (!CHAT_ID) throw new Error('TELEGRAM_CHAT_ID is not configured');

    const order: OrderData = await req.json();

    // Validate required fields
    if (!order.customerName || !order.customerPhone || !order.address || !order.city || !order.postalCode || !order.province) {
      return new Response(
        JSON.stringify({ success: false, error: 'Faltan campos obligatorios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.items || order.items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'El pedido no tiene productos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build Telegram message
    const itemLines = order.items.map(
      (item) => `  • ${item.title}${item.variant ? ` (${item.variant})` : ''} × ${item.quantity} → €${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    const now = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });

    const message = `🛒 <b>NUEVO PEDIDO COD</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📅 ${now}\n\n` +
      `👤 <b>Cliente:</b> ${escapeHtml(order.customerName)}\n` +
      `📞 <b>Teléfono:</b> ${escapeHtml(order.customerPhone)}\n` +
      `${order.customerEmail ? `📧 <b>Email:</b> ${escapeHtml(order.customerEmail)}\n` : ''}` +
      `\n📦 <b>Dirección de envío:</b>\n` +
      `${escapeHtml(order.address)}\n` +
      `${escapeHtml(order.postalCode)} ${escapeHtml(order.city)}, ${escapeHtml(order.province)}\n\n` +
      `🛍️ <b>Productos:</b>\n${itemLines}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💰 Subtotal: €${order.subtotal.toFixed(2)}\n` +
      `🚚 Envío: €${order.shippingCost.toFixed(2)}\n` +
      `<b>💶 TOTAL A COBRAR: €${order.total.toFixed(2)}</b>\n` +
      `${order.notes ? `\n📝 <b>Notas:</b> ${escapeHtml(order.notes)}` : ''}`;

    const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Telegram API call failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    // Also save to Supabase cod_orders table
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('cod_orders').insert({
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_email: order.customerEmail || null,
      address: order.address,
      city: order.city,
      postal_code: order.postalCode,
      province: order.province,
      notes: order.notes || null,
      items: order.items,
      subtotal: order.subtotal,
      shipping_cost: order.shippingCost,
      total: order.total,
      status: 'pending',
    });

    console.log('Order sent to Telegram and saved to DB');

    return new Response(
      JSON.stringify({ success: true, messageId: data.result?.message_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
