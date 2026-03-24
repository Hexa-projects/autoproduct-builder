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
  _hp?: string; // honeypot
  _ts?: number; // form open timestamp
}

// ── Validation constants ──
const SPAIN_PHONE_RE = /^(?:\+34|0034)?[6789]\d{8}$/;
const SPAIN_POSTAL_RE = /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/;
const TWO_WORDS_RE = /^\S+\s+\S+/;
const LETTERS_ONLY_RE = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙ\s\-'.]+$/;
const ADDRESS_NUMBER_RE = /\d+/;
const GIBBERISH_RE = /(.)\1{4,}/; // 5+ repeated chars
const CONSONANT_CLUSTER_RE = /[bcdfghjklmnpqrstvwxyz]{5,}/i; // 5+ consonants in a row

const BLOCKED_POSTAL_PREFIXES = ['35', '38', '07', '51', '52'];
const BLOCKED_KEYWORDS = [
  'canarias', 'canaria', 'tenerife', 'gran canaria', 'lanzarote',
  'fuerteventura', 'la palma', 'la gomera', 'el hierro',
  'baleares', 'balear', 'mallorca', 'menorca', 'ibiza', 'formentera',
  'ceuta', 'melilla',
];

const VALID_PROVINCES = new Set([
  'álava', 'albacete', 'alicante', 'almería', 'asturias', 'ávila', 'badajoz', 'barcelona',
  'burgos', 'cáceres', 'cádiz', 'cantabria', 'castellón', 'ciudad real', 'córdoba', 'cuenca',
  'gerona', 'granada', 'guadalajara', 'guipúzcoa', 'huelva', 'huesca', 'jaén', 'la coruña',
  'la rioja', 'león', 'lérida', 'lugo', 'madrid', 'málaga', 'murcia', 'navarra', 'orense',
  'palencia', 'pontevedra', 'salamanca', 'segovia', 'sevilla', 'soria', 'tarragona', 'teruel',
  'toledo', 'valencia', 'valladolid', 'vizcaya', 'zamora', 'zaragoza',
]);

const MIN_FORM_TIME_MS = 8_000; // minimum 8s to fill a real form

function isBlockedRegion(postalCode: string, city: string, province: string): boolean {
  const zip = postalCode.trim();
  if (BLOCKED_POSTAL_PREFIXES.some((p) => zip.startsWith(p))) return true;
  const lowerAll = `${city} ${province}`.toLowerCase();
  return BLOCKED_KEYWORDS.some((kw) => lowerAll.includes(kw));
}

function isGibberish(text: string): boolean {
  const lower = text.toLowerCase().replace(/\s/g, '');
  if (GIBBERISH_RE.test(lower)) return true;
  if (CONSONANT_CLUSTER_RE.test(lower)) return true;
  if (lower.length > 3 && new Set(lower).size <= 2) return true; // only 1-2 unique chars
  return false;
}

function sanitize(text: string): string {
  return text.replace(/[<>]/g, '').trim();
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  flags: string[];
}

function validateOrder(order: OrderPayload): ValidationResult {
  const flags: string[] = [];

  // Honeypot check (should be empty)
  if (order._hp && order._hp.trim().length > 0) {
    return { valid: false, error: 'Solicitud no válida.', flags: ['HONEYPOT_TRIGGERED'] };
  }

  // Time check (too fast = bot)
  if (order._ts) {
    const elapsed = Date.now() - order._ts;
    if (elapsed < MIN_FORM_TIME_MS) {
      return { valid: false, error: 'Por favor, completa el formulario correctamente.', flags: ['TOO_FAST'] };
    }
  }

  // Name validation
  const name = sanitize(order.customerName || '');
  if (!name || name.length < 2) return { valid: false, error: 'El nombre es obligatorio.', flags: ['MISSING_NAME'] };
  if (!TWO_WORDS_RE.test(name)) return { valid: false, error: 'Introduce nombre y apellido.', flags: ['INCOMPLETE_NAME'] };
  if (!LETTERS_ONLY_RE.test(name)) return { valid: false, error: 'El nombre contiene caracteres no válidos.', flags: ['INVALID_NAME_CHARS'] };
  if (isGibberish(name)) return { valid: false, error: 'El nombre no parece válido.', flags: ['GIBBERISH_NAME'] };

  // Phone validation
  const phone = (order.customerPhone || '').replace(/[\s\-().]/g, '');
  if (!phone) return { valid: false, error: 'El teléfono es obligatorio.', flags: ['MISSING_PHONE'] };
  if (!SPAIN_PHONE_RE.test(phone)) return { valid: false, error: 'Introduce un teléfono español válido (9 dígitos, empezando por 6, 7, 8 o 9).', flags: ['INVALID_PHONE'] };

  // Email validation (optional)
  if (order.customerEmail && order.customerEmail.trim()) {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(order.customerEmail.trim())) {
      flags.push('INVALID_EMAIL');
    }
  }

  // Address validation
  const address = sanitize(order.address || '');
  if (!address || address.length < 5) return { valid: false, error: 'La dirección es demasiado corta.', flags: ['SHORT_ADDRESS'] };
  if (!ADDRESS_NUMBER_RE.test(address)) return { valid: false, error: 'La dirección debe incluir número de calle/portal.', flags: ['NO_ADDRESS_NUMBER'] };
  if (isGibberish(address)) return { valid: false, error: 'La dirección no parece válida.', flags: ['GIBBERISH_ADDRESS'] };

  // City validation
  const city = sanitize(order.city || '');
  if (!city || city.length < 2) return { valid: false, error: 'La ciudad es obligatoria.', flags: ['MISSING_CITY'] };
  if (!LETTERS_ONLY_RE.test(city)) return { valid: false, error: 'La ciudad contiene caracteres no válidos.', flags: ['INVALID_CITY_CHARS'] };
  if (isGibberish(city)) return { valid: false, error: 'La ciudad no parece válida.', flags: ['GIBBERISH_CITY'] };

  // Postal code validation
  const postalCode = (order.postalCode || '').trim();
  if (!SPAIN_POSTAL_RE.test(postalCode)) return { valid: false, error: 'El código postal no es válido (5 dígitos, España).', flags: ['INVALID_POSTAL'] };

  // Province validation
  const province = sanitize(order.province || '');
  if (!province || province.length < 2) return { valid: false, error: 'La provincia es obligatoria.', flags: ['MISSING_PROVINCE'] };
  if (!VALID_PROVINCES.has(province.toLowerCase())) {
    flags.push('UNKNOWN_PROVINCE');
  }

  // Blocked regions
  if (isBlockedRegion(postalCode, city, province)) {
    return { valid: false, error: 'Lo sentimos, actualmente no realizamos envíos a Canarias, Baleares, Ceuta ni Melilla.', flags: ['BLOCKED_REGION'] };
  }

  // Items validation
  if (!order.items?.length) return { valid: false, error: 'El pedido no tiene productos.', flags: ['NO_ITEMS'] };
  for (const item of order.items) {
    if (!item.title || item.quantity < 1) return { valid: false, error: 'Producto no válido en el pedido.', flags: ['INVALID_ITEM'] };
    const price = parseFloat(item.price);
    if (isNaN(price) || price <= 0) return { valid: false, error: 'Precio de producto no válido.', flags: ['INVALID_PRICE'] };
  }

  // Total sanity check
  if (!order.total || order.total <= 0) return { valid: false, error: 'El total del pedido no es válido.', flags: ['INVALID_TOTAL'] };

  // External order ID
  if (!order.externalOrderId?.trim()) return { valid: false, error: 'Falta el identificador de pedido.', flags: ['MISSING_EXTERNAL_ID'] };

  return { valid: true, flags };
}

async function notifyTelegram(order: OrderPayload, orderRef: string, flags: string[]) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
  if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY || !CHAT_ID) {
    throw new Error('Faltan credenciales de Telegram.');
  }

  const now = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  const phone = (order.customerPhone || '').replace(/[\s\-().]/g, '');

  const itemLines = order.items.map(
    (item) => `  • ${escapeHtml(item.title)}${item.variant ? ` (${escapeHtml(item.variant)})` : ''}${item.sku ? ` [${escapeHtml(item.sku)}]` : ''} × ${item.quantity} → €${(parseFloat(item.price) * item.quantity).toFixed(2)}`
  ).join('\n');

  const flagLine = flags.length > 0 ? `\n⚠️ <b>Alertas:</b> ${flags.join(', ')}\n` : '';

  const msg =
    `🛒 <b>NUEVO PEDIDO COD</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📅 ${now}\n` +
    `🔖 Ref: <b>${escapeHtml(orderRef)}</b>\n${flagLine}\n` +
    `👤 <b>Cliente:</b> ${escapeHtml(sanitize(order.customerName))}\n` +
    `📞 <b>Teléfono:</b> ${escapeHtml(phone)}\n` +
    `${order.customerEmail ? `📧 <b>Email:</b> ${escapeHtml(order.customerEmail.trim())}\n` : ''}` +
    `\n📦 <b>Dirección de envío:</b>\n` +
    `${escapeHtml(sanitize(order.address))}\n` +
    `${escapeHtml(order.postalCode.trim())} ${escapeHtml(sanitize(order.city))}\n` +
    `${escapeHtml(sanitize(order.province))}, España\n\n` +
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

    // ── Full server-side validation ──
    const validation = validateOrder(order);
    if (!validation.valid) {
      console.warn(`[order] REJECTED: ${validation.flags.join(', ')} | Name: ${(order.customerName || '').slice(0, 20)} | Phone: ${(order.customerPhone || '').slice(0, 6)}***`);
      return json({ success: false, error: validation.error }, 400);
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

    // Rate limit: max 3 orders from same phone in last hour
    const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
    const cleanPhone = (order.customerPhone || '').replace(/[\s\-().]/g, '');
    const { count: recentCount } = await supabase
      .from('cod_orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_phone', cleanPhone)
      .gte('created_at', oneHourAgo);

    if (recentCount !== null && recentCount >= 3) {
      console.warn(`[order] RATE_LIMITED: phone ${cleanPhone.slice(0, 6)}*** has ${recentCount} orders in last hour`);
      return json({ success: false, error: 'Has realizado demasiados pedidos recientemente. Inténtalo más tarde.' }, 429);
    }

    // Send to Telegram
    const orderRef = order.externalOrderId.slice(-8).toUpperCase();
    await notifyTelegram(order, orderRef, validation.flags);
    console.log(`[order] OK: ${orderRef} | ${cleanPhone.slice(0, 6)}*** | €${order.total.toFixed(2)} | flags: ${validation.flags.join(',') || 'none'}`);

    // Save to DB
    await supabase.from('cod_orders').insert({
      customer_name: sanitize(order.customerName),
      customer_phone: cleanPhone,
      customer_email: order.customerEmail?.trim() || null,
      address: sanitize(order.address),
      city: sanitize(order.city),
      postal_code: order.postalCode.trim(),
      province: sanitize(order.province),
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
