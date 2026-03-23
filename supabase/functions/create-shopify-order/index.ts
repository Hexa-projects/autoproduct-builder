const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Types ──────────────────────────────────────────────────────

interface LineItem {
  title: string;
  variantId: string; // Shopify GID
  quantity: number;
  price: string; // e.g. "29.99"
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
  externalOrderId: string; // idempotency key
  notes?: string;
}

// ── Blocked regions (postal-code prefixes + city/province keywords) ──

const BLOCKED_POSTAL_PREFIXES = [
  '35', // Las Palmas (Canarias)
  '38', // Santa Cruz de Tenerife (Canarias)
  '07', // Baleares
  '51', // Ceuta
  '52', // Melilla
];

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

// ── Helpers ────────────────────────────────────────────────────

function extractNumericId(gid: string): string {
  // "gid://shopify/ProductVariant/12345" → "12345"
  const parts = gid.split('/');
  return parts[parts.length - 1];
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { first: parts[0] || 'Cliente', last: '.' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Shopify Admin API helper with retry ────────────────────────

const SHOPIFY_DOMAIN = 't5mqfi-s1.myshopify.com';
const API_VERSION = '2025-07';

type ShopifyTokenCandidate = {
  token: string;
  source: string;
};

function getShopifyTokenCandidates(): ShopifyTokenCandidate[] {
  const candidates: ShopifyTokenCandidate[] = [];
  const seenTokens = new Set<string>();

  const pushCandidate = (token: string | undefined, source: string) => {
    const normalized = token?.trim();
    if (!normalized || seenTokens.has(normalized)) return;
    seenTokens.add(normalized);
    candidates.push({ token: normalized, source });
  };

  // Preferred: explicit Admin API token
  pushCandidate(Deno.env.get('SHOPIFY_ACCESS_TOKEN'), 'SHOPIFY_ACCESS_TOKEN');

  // Fallback: user-scoped online access tokens (connector-managed)
  const envVars = Deno.env.toObject();
  for (const [key, value] of Object.entries(envVars)) {
    if (key.startsWith('SHOPIFY_ONLINE_ACCESS_TOKEN:user:')) {
      pushCandidate(value, key);
    }
  }

  return candidates;
}

function isShopifyAuthError(result: { status: number; data: any }): boolean {
  if (result.status === 401 || result.status === 403) return true;

  const errors = result.data?.errors;
  if (typeof errors === 'string') {
    const normalized = errors.toLowerCase();
    return (
      normalized.includes('invalid api key') ||
      normalized.includes('access token') ||
      normalized.includes('wrong password')
    );
  }

  return false;
}

async function shopifyAdmin(
  path: string,
  method: string,
  body: unknown,
  accessToken: string,
  retries = 3,
): Promise<{ ok: boolean; status: number; data: any }> {
  const url = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}${path}`;
  let lastError: any;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      // Rate limited → back off
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
        console.warn(`[shopify] 429 rate limited, retrying in ${retryAfter}s`);
        await sleep(retryAfter * 1000);
        continue;
      }

      // Server error → retry
      if (res.status >= 500) {
        console.warn(`[shopify] ${res.status} server error, attempt ${attempt + 1}`);
        await sleep(Math.pow(2, attempt) * 1000);
        lastError = data;
        continue;
      }

      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      lastError = err;
      console.warn(`[shopify] Network error attempt ${attempt + 1}:`, err);
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }

  throw new Error(`Shopify API failed after ${retries} retries: ${JSON.stringify(lastError)}`);
}

// ── Telegram notification (detailed) ───────────────────────────

async function notifyTelegram(order: OrderPayload, shopifyOrderName: string) {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
    const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
    if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY || !CHAT_ID) return;

    const now = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });

    const itemLines = order.items.map(
      (item) => `  • ${escapeHtml(item.title)}${item.sku ? ` (${escapeHtml(item.sku)})` : ''} × ${item.quantity} → €${(parseFloat(item.price) * item.quantity).toFixed(2)}`
    ).join('\n');

    const msg =
      `🛒 <b>NUEVO PEDIDO COD</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📅 ${now}\n` +
      `🔖 Pedido: <b>${escapeHtml(shopifyOrderName)}</b>\n\n` +
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
      `${order.notes ? `📝 <b>Notas:</b> ${escapeHtml(order.notes)}\n` : ''}` +
      `🔗 <a href="https://${SHOPIFY_DOMAIN}/admin/orders">Ver en Shopify</a>`;

    await fetch('https://connector-gateway.lovable.dev/telegram/sendMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'HTML' }),
    });
  } catch (err) {
    console.warn('[telegram] notification failed (non-critical):', err);
  }
}

// ── Main handler ───────────────────────────────────────────────

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
    // ── Env vars ──
    const shopifyTokenCandidates = getShopifyTokenCandidates();
    if (!shopifyTokenCandidates.length) {
      throw new Error('No Shopify Admin token configured. Set SHOPIFY_ACCESS_TOKEN (Admin API token shpat_) or reconnect Shopify.');
    }

    const configuredAdminToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN')?.trim();
    if (configuredAdminToken && !configuredAdminToken.startsWith('shpat_')) {
      console.warn('[shopify] SHOPIFY_ACCESS_TOKEN does not start with shpat_. It may be invalid for Admin API orders.');
    }

    const order: OrderPayload = await req.json();

    // ── Validation ──
    if (!order.customerPhone?.trim()) {
      return json({ success: false, error: 'El teléfono es obligatorio.' }, 400);
    }
    if (!order.address?.trim() || !order.city?.trim() || !order.province?.trim()) {
      return json({ success: false, error: 'La dirección está incompleta (calle, ciudad y provincia son obligatorios).' }, 400);
    }
    if (!order.postalCode?.trim()) {
      return json({ success: false, error: 'El código postal es obligatorio.' }, 400);
    }
    if (!order.items?.length) {
      return json({ success: false, error: 'El pedido no tiene productos.' }, 400);
    }
    if (!order.externalOrderId?.trim()) {
      return json({ success: false, error: 'Falta el identificador de pedido (externalOrderId).' }, 400);
    }

    // ── Blocked regions ──
    if (isBlockedRegion(order.postalCode, order.city, order.province)) {
      return json(
        {
          success: false,
          error: 'Lo sentimos, actualmente no realizamos envíos a Canarias, Baleares, Ceuta ni Melilla.',
        },
        400,
      );
    }

    // ── Idempotency: check if order already exists ──
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: existingOrder } = await supabase
      .from('cod_orders')
      .select('id, status, notes')
      .eq('notes', `external:${order.externalOrderId}`)
      .maybeSingle();

    if (existingOrder) {
      console.log(`[idempotency] Order ${order.externalOrderId} already exists, skipping.`);
      return json({ success: true, duplicate: true, orderId: existingOrder.id });
    }

    // ── Build Shopify order payload ──
    const { first, last } = splitName(order.customerName);
    const now = new Date().toISOString();

    const lineItems = order.items.map((item) => ({
      variant_id: parseInt(extractNumericId(item.variantId), 10),
      quantity: item.quantity,
      price: item.price,
      title: item.title,
      requires_shipping: true,
    }));

    const shopifyPayload = {
      order: {
        line_items: lineItems,
        customer: {
          first_name: first,
          last_name: last,
          phone: order.customerPhone.trim(),
          ...(order.customerEmail ? { email: order.customerEmail.trim() } : {}),
        },
        shipping_address: {
          first_name: first,
          last_name: last,
          address1: order.address.trim(),
          city: order.city.trim(),
          province: order.province.trim(),
          zip: order.postalCode.trim(),
          country: 'ES',
          country_code: 'ES',
          phone: order.customerPhone.trim(),
        },
        billing_address: {
          first_name: first,
          last_name: last,
          address1: order.address.trim(),
          city: order.city.trim(),
          province: order.province.trim(),
          zip: order.postalCode.trim(),
          country: 'ES',
          country_code: 'ES',
          phone: order.customerPhone.trim(),
        },
        financial_status: 'pending',
        gateway: 'Cash on Delivery (COD)',
        tags: 'COD, LOVABLE, NUEVO_PEDIDO',
        note: `Pedido COD desde Lovable | ${now} | Ref: ${order.externalOrderId}`,
        send_receipt: false,
        send_fulfillment_receipt: false,
        inventory_behaviour: 'decrement_obeying_policy',
        shipping_lines: [
          {
            title: 'Envío Gratuito 24-48h',
            price: order.shippingCost.toFixed(2),
            code: 'FREE',
          },
        ],
      },
    };

    console.log('[shopify] Creating order…', {
      externalId: order.externalOrderId,
      items: order.items.length,
      total: order.total,
    });

    // ── Create order in Shopify (try available tokens) ──
    let result: { ok: boolean; status: number; data: any } | null = null;
    let tokenSourceUsed = '';

    for (const candidate of shopifyTokenCandidates) {
      console.log(`[shopify] Creating order using token source: ${candidate.source}`);
      const attempt = await shopifyAdmin('/orders.json', 'POST', shopifyPayload, candidate.token);

      if (attempt.ok) {
        result = attempt;
        tokenSourceUsed = candidate.source;
        break;
      }

      result = attempt;

      if (isShopifyAuthError(attempt)) {
        console.warn(`[shopify] Auth failed with ${candidate.source}, trying next token if available.`);
        continue;
      }

      break;
    }

    if (!result) {
      throw new Error('Shopify request did not return a response.');
    }

    if (!result.ok) {
      console.error('[shopify] Order creation failed:', JSON.stringify(result.data));
      const errors = result.data?.errors;
      const errorMsg = typeof errors === 'string' ? errors : JSON.stringify(errors);
      const authHint = isShopifyAuthError(result)
        ? ' Verifica que el token sea Admin API (shpat_) con scope write_orders.'
        : '';
      
      // Save failed order to DB for tracking
      await supabase.from('cod_orders').insert({
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        customer_email: order.customerEmail || null,
        address: order.address,
        city: order.city,
        postal_code: order.postalCode,
        province: order.province,
        notes: `external:${order.externalOrderId} | SHOPIFY_ERROR: ${errorMsg}`,
        items: order.items as any,
        subtotal: order.subtotal,
        shipping_cost: order.shippingCost,
        total: order.total,
        status: 'failed',
      });

      return json(
        { success: false, error: `Error al crear el pedido en Shopify: ${errorMsg}${authHint}` },
        502,
      );
    }

    const shopifyOrder = result.data.order;
    const shopifyOrderId = shopifyOrder.id;
    const shopifyOrderName = shopifyOrder.name || `#${shopifyOrderId}`;

    console.log(`[shopify] Order created: ${shopifyOrderName} (${shopifyOrderId}) via ${tokenSourceUsed || 'unknown token source'}`);

    // ── Save to DB ──
    await supabase.from('cod_orders').insert({
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_email: order.customerEmail || null,
      address: order.address,
      city: order.city,
      postal_code: order.postalCode,
      province: order.province,
      notes: `external:${order.externalOrderId} | shopify:${shopifyOrderName}`,
      items: order.items as any,
      subtotal: order.subtotal,
      shipping_cost: order.shippingCost,
      total: order.total,
      status: 'pending',
    });

    // ── Telegram notification (minimal, non-blocking) ──
    notifyTelegram(order, shopifyOrderName);

    return json({
      success: true,
      shopifyOrderId,
      shopifyOrderName,
    });
  } catch (error) {
    console.error('[create-shopify-order] Unhandled error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return json({ success: false, error: errorMessage }, 500);
  }
});
