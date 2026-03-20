
-- Create enum types
CREATE TYPE public.product_status AS ENUM ('draft', 'published');
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subtitle TEXT,
  short_description TEXT,
  full_description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  status product_status DEFAULT 'draft',
  main_image TEXT,
  gallery TEXT[] DEFAULT '{}',
  video_url TEXT,
  base_cost NUMERIC(10,2),
  original_price NUMERIC(10,2),
  promotional_price NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  sku TEXT,
  stock INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  mvp_ads BOOLEAN DEFAULT false,
  available_countries TEXT[] DEFAULT '{}',
  shipping_time TEXT,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  cod_available BOOLEAN DEFAULT false,
  prepaid_available BOOLEAN DEFAULT true,
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  checkout_url_default TEXT,
  checkout_url_pack_1 TEXT,
  checkout_url_pack_2 TEXT,
  checkout_url_pack_3 TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product variations table
CREATE TABLE public.product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  size TEXT,
  color TEXT,
  price NUMERIC(10,2),
  stock INT DEFAULT 0,
  sku TEXT,
  checkout_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-generate slug from name
CREATE OR REPLACE FUNCTION public.generate_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM products WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
      NEW.slug := NEW.slug || '-' || substr(gen_random_uuid()::text, 1, 4);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_generate_slug
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.generate_slug();

-- Auto-generate slug for categories
CREATE OR REPLACE FUNCTION public.generate_category_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    WHILE EXISTS (SELECT 1 FROM categories WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
      NEW.slug := NEW.slug || '-' || substr(gen_random_uuid()::text, 1, 4);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER categories_generate_slug
  BEFORE INSERT OR UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.generate_category_slug();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies

-- Categories: public read, admin/editor write
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin/editor can manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

-- Products: published readable by all, admin/editor can manage all
CREATE POLICY "Published products are viewable by everyone" ON public.products FOR SELECT USING (status = 'published' OR (auth.uid() IS NOT NULL AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))));
CREATE POLICY "Admin/editor can manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

-- Product variations: readable if product is published, admin/editor manage
CREATE POLICY "Variations viewable with product" ON public.product_variations FOR SELECT USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND (status = 'published' OR (auth.uid() IS NOT NULL AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))))));
CREATE POLICY "Admin/editor can manage variations" ON public.product_variations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

-- User roles: only admin can manage, users can see own
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: users can view/edit own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');
