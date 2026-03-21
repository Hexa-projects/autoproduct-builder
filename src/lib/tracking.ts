/**
 * Meta Pixel + UTM tracking utilities for Revolución Fit.
 *
 * - Persists UTMs from landing to checkout.
 * - Fires standard Meta events with deduplication via event_id.
 * - Safe no-ops when fbq is unavailable.
 */

// ─── UTM persistence ───────────────────────────────────────────────

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const UTM_STORAGE_KEY = 'rf_utm';

export function captureUTMs() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utms: Record<string, string> = {};
    let found = false;
    UTM_KEYS.forEach((k) => {
      const v = params.get(k);
      if (v) { utms[k] = v; found = true; }
    });
    if (found) sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utms));
  } catch { /* SSR / storage blocked */ }
}

export function getStoredUTMs(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

// ─── Event helpers ──────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function fbq(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const pixel = (window as any).fbq;
  if (typeof pixel !== 'function') return;

  const eventId = uid();
  pixel('track', eventName, { ...params, eventID: eventId });
}

function fbqCustom(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const pixel = (window as any).fbq;
  if (typeof pixel !== 'function') return;

  const eventId = uid();
  pixel('trackCustom', eventName, { ...params, eventID: eventId });
}

// ─── Standard events ────────────────────────────────────────────────

export function trackViewContent(product: {
  id: string;
  title: string;
  price: number;
  currency: string;
}) {
  fbq('ViewContent', {
    content_name: product.title,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price,
    currency: product.currency,
  });
}

export function trackAddToCart(item: {
  id: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
}) {
  fbq('AddToCart', {
    content_name: item.title,
    content_ids: [item.id],
    content_type: 'product',
    value: item.price * item.quantity,
    currency: item.currency,
    num_items: item.quantity,
  });
}

export function trackInitiateCheckout(cart: {
  value: number;
  currency: string;
  numItems: number;
}) {
  fbq('InitiateCheckout', {
    value: cart.value,
    currency: cart.currency,
    num_items: cart.numItems,
  });
}

export function trackPageView() {
  if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
    (window as any).fbq('track', 'PageView');
  }
}

// ─── Custom CRO events ─────────────────────────────────────────────

export function trackClickCTACOD(product: { id: string; title: string }) {
  fbqCustom('Click_CTA_COD', {
    content_name: product.title,
    content_ids: [product.id],
  });
}

export function trackSelectKit(kit: '1x' | '2x' | '3x', product: { id: string; title: string; value: number; currency: string }) {
  fbqCustom(`Select_Kit_${kit}`, {
    content_name: product.title,
    content_ids: [product.id],
    value: product.value,
    currency: product.currency,
  });
}

// ─── Auth events ────────────────────────────────────────────────────

export function trackAuthEvent(event: string) {
  fbqCustom(event);
}
