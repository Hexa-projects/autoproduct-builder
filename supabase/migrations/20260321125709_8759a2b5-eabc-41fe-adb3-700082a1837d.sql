
CREATE TABLE public.cod_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number serial,
  status text NOT NULL DEFAULT 'pending',
  
  -- Customer data
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  
  -- Shipping address
  address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  province text NOT NULL,
  country text NOT NULL DEFAULT 'España',
  
  -- Order data
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  shipping_cost numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  
  -- Shipping method
  shipping_method text,
  
  notes text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cod_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cod_orders"
ON public.cod_orders
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert cod_orders"
ON public.cod_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
