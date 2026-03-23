const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface LineItem {
  title: string;
  variantId: string;
  variant?: string;
  quantity: number;
  price: string;
  sku?: string;
}

interface OrderPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  items: LineItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  externalOrderId: string;
  notes?: string;
}

const BLOCKED_POSTAL_PREFIXES = ['35', '38', '07', '51', '52'];
const BLOCKED_KEYWORDS = [
  'canarias', 'canaria', 'tenerife', 'gran canaria', 'lanzarote',
  'fuerteventura', 'la palma', 'la gomera', 'el hierro',
  'baleares', 'balear', 'mallorca', 'menorca', 'ibiza', 'formentera',
  'ceuta', 'melilla',
];

function isBlockedRegion(postalCode: string, city: string, province: string): boolean {
  const zip = postalCode.trim();
  if (BLOCKED_POSTAL_PREFIXES.some((p) => zip.startsWith(p))) return true;
  const lowerAll = `${city} ${province}`.toLowerCase();
  return BLOCKED_KEYWORDS.some((kw) => lowerAll.includes(kw));
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function notifyTelegram(order: OrderPayload, orderRef: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
  if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY || !CHAT_ID) {
    throw new Error('Faltan credenciales de Telegram (LOVABLE_API_KEY, TELEGRAM_API_KEY o TELEGRAM_CHAT_ID).');
  }

  const now = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });

  const itemLines = order.items.map(
    (item) => `  • ${escapeHtml(item.title)}${item.variant ? ` (${escapeHtml(item.variant)})` : ''}${item.sku ? ` [${escapeHtml(item.sku)}]` : ''} × ${item.quantity} → €${(parseFloat(item.price) * item.quantity).toFixed(2)}`
  ).join('\n');

  const msg =
    `🛒 <b>NUEVO PEDIDO COD</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📅 ${now}\n` +
    `🔖 Ref: <b>${escapeHtml(orderRef)}</b>\n\n` +
    `👤 <b>Cliente:</b> ${escapeHtml(order.customerName)}\n` +
    `📞 <b>Teléfono:</b> ${escapeHtml(order.customerPhone)}\n` +
    `${order.customerEmail ? `📧 <b>Email:</b> ${escapeHtml(order.customerEmail)}\n` : ''}` +
    `\n📦 <b>Dirección de envío:</b>\n` +
    `${escapeHtml(order.address)}\n` +
    `${escapeHtml(order.postalCode)} ${escapeHtml(order.city)}\n` +
    `${escapeHtml(order.province)}, España\n\n` +
    `🛍️ <b>Productos:</b>\n${itemLines}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💰 Subtotal: €${order.subtotal.toFixed(2)}\n` +
    `🚚 Envío: ${order.shippingCost === 0 ? 'GRATIS' : `€${order.shippingCost.toFixed(2)}`}\n` +
    `<b>💶 TOTAL A COBRAR: €${order.total.toFixed(2)}</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💳 Método: <b>Contrareembolso (COD)</b>\n` +
    `${order.notes ? `📝 <b>Notas:</b> ${escapeHtml(order.notes)}\n` : ''}`;

  const response = await fetch('https://connector-gateway.lovable.dev/telegram/sendMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': TELEGRAM_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'HTML' }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(`Telegram API error [${response.status}]: ${JSON.stringify(data)}`);
  }

  return await response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const order: OrderPayload = await req.json();

    // Validation
    if (!order.customerPhone?.trim()) return json({ success: false, error: 'El teléfono es obligatorio.' }, 400);
    if (!order.address?.trim() || !order.city?.trim() || !order.province?.trim()) return json({ success: false, error: 'La dirección está incompleta.' }, 400);
    if (!order.postalCode?.trim()) return json({ success: false, error: 'El código postal es obligatorio.' }, 400);
    if (!order.items?.length) return json({ success: false, error: 'El pedido no tiene productos.' }, 400);
    if (!order.externalOrderId?.trim()) return json({ success: false, error: 'Falta el identificador de pedido.' }, 400);

    // Blocked regions
    if (isBlockedRegion(order.postalCode, order.city, order.province)) {
      return json({ success: false, error: 'Lo sentimos, actualmente no realizamos envíos a Canarias, Baleares, Ceuta ni Melilla.' }, 400);
    }

    // Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Idempotency check
    const { data: existing } = await supabase
      .from('cod_orders')
      .select('id')
      .eq('notes', `external:${order.externalOrderId}`)
      .maybeSingle();

    if (existing) {
      return json({ success: true, duplicate: true, orderId: existing.id });
    }

    // Send to Telegram
    const orderRef = order.externalOrderId.slice(-8).toUpperCase();
    await notifyTelegram(order, orderRef);
    console.log(`[order] Telegram notification sent for ${orderRef}`);

    // Save to DB
    await supabase.from('cod_orders').insert({
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_email: order.customerEmail || null,
      address: order.address,
      city: order.city,
      postal_code: order.postalCode,
      province: order.province,
      notes: `external:${order.externalOrderId}`,
      items: order.items as any,
      subtotal: order.subtotal,
      shipping_cost: order.shippingCost,
      total: order.total,
      status: 'pending',
    });

    return json({ success: true, orderRef });
  } catch (error) {
    console.error('[create-shopify-order] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return json({ success: false, error: errorMessage }, 500);
  }
});
