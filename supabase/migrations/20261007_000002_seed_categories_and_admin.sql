-- Cyglase Foods: Seed Categories, Platform Settings & Admin User

-- 1. Seed Platform Settings
INSERT INTO public.platform_settings (key, value, description)
VALUES 
  ('payment_wait_time_minutes', '15', 'Time in minutes a customer has to make bank transfer and upload receipt before order is auto-cancelled'),
  ('currency', 'NGN', 'Platform default currency code'),
  ('currency_symbol', '₦', 'Platform currency symbol')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = timezone('utc'::text, now());

-- 2. Seed 7 Core Food Categories
INSERT INTO public.categories (name, slug, description, display_order)
VALUES 
  ('Meals', 'meals', 'Rice dishes, yam dishes, pasta, and specialty meals', 1),
  ('Swallows', 'swallows', 'Pounded yam, Eba, Amala, Fufu, Semovita', 2),
  ('Soups', 'soups', 'Egusi, Ogbono, Afang, Efo Riro, Bitterleaf, Banga, Oha', 3),
  ('Proteins', 'proteins', 'Assorted beef, Goat meat, Asun, Fried Fish, Chicken, Turkey, Shaki, Ponmo', 4),
  ('Drinks', 'drinks', 'Soft drinks, fresh juices, Zobo, Chapman, Malt, bottled water', 5),
  ('Desserts', 'desserts', 'Puff-puff, meat pies, pastries, small chops, cakes', 6),
  ('Extras', 'extras', 'Fried plantain (Dodo), coleslaw, boiled eggs, extra stew/gravy', 7)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    updated_at = timezone('utc'::text, now());

-- 3. Seed Admin User (admin@cyglase.com)
DO $$
DECLARE
  v_admin_id UUID := gen_random_uuid();
  v_admin_email TEXT := 'admin@cyglase.com';
  v_admin_pass TEXT := 'Things-don@make=sense';
BEGIN
  -- Insert into auth.users if not already created
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_admin_email) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      aud,
      role
    ) VALUES (
      v_admin_id,
      '00000000-0000-0000-0000-000000000000',
      v_admin_email,
      crypt(v_admin_pass, gen_salt('bf')),
      timezone('utc'::text, now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Cyglase Admin","role":"admin"}'::jsonb,
      timezone('utc'::text, now()),
      timezone('utc'::text, now()),
      'authenticated',
      'authenticated'
    );
  ELSE
    SELECT id INTO v_admin_id FROM auth.users WHERE email = v_admin_email;
  END IF;

  -- Ensure profile exists and has role 'admin'
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    v_admin_id,
    v_admin_email,
    'Cyglase Admin',
    'admin'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      full_name = 'Cyglase Admin',
      updated_at = timezone('utc'::text, now());
END $$;
