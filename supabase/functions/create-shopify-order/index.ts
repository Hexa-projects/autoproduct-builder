import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ACCESS_TOKEN');
    if (!SHOPIFY_ACCESS_TOKEN) {
      throw new Error('No Shopify access token configured');
    }

    const SHOP_DOMAIN = 't5mqfi-s1.myshopify.com';
    const API_VERSION = '2025-07';

    const body = await req.json();
    const { customer_name, customer_phone, customer_email, address, city, postal_code, province, country, items, total, shipping_cost, notes } = body;

    if (!customer_name || !customer_phone || !items?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Split name into first/last
    const nameParts = customer_name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Build line items from variant IDs
    const lineItems = items.map((item: any) => {
      // Extract numeric variant ID from GraphQL ID (gid://shopify/ProductVariant/12345)
      const variantIdMatch = item.variantId?.match(/(\d+)$/);
      const variantId = variantIdMatch ? parseInt(variantIdMatch[1]) : null;

      return {
        variant_id: variantId,
        quantity: item.quantity,
        price: item.price,
        title: item.title,
      };
    }).filter((item: any) => item.variant_id);

    if (lineItems.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid line items' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orderPayload = {
      order: {
        line_items: lineItems,
        customer: {
          first_name: firstName,
          last_name: lastName,
          phone: customer_phone,
          ...(customer_email ? { email: customer_email } : {}),
        },
        shipping_address: {
          first_name: firstName,
          last_name: lastName,
          address1: address,
          city: city,
          zip: postal_code,
          province: province,
          country: country || 'ES',
          phone: customer_phone,
        },
        billing_address: {
          first_name: firstName,
          last_name: lastName,
          address1: address,
          city: city,
          zip: postal_code,
          province: province,
          country: country || 'ES',
          phone: customer_phone,
        },
        financial_status: 'pending',
        note: notes || '',
        tags: 'COD, Lovable',
        send_receipt: false,
        send_fulfillment_receipt: false,
        inventory_behaviour: 'decrement_obeying_policy',
      },
    };

    const shopifyRes = await fetch(
      `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/orders.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify(orderPayload),
      }
    );

    const shopifyData = await shopifyRes.json();

    if (!shopifyRes.ok) {
      console.error('Shopify order creation failed:', JSON.stringify(shopifyData));
      return new Response(JSON.stringify({ 
        error: 'Shopify order creation failed', 
        details: shopifyData.errors || shopifyData 
      }), {
        status: shopifyRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      order_id: shopifyData.order?.id,
      order_number: shopifyData.order?.order_number,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
