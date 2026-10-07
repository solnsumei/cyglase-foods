-- Migration: Setup Default Vendor with Auth User and Profile
-- Replaces demo "Mama Put Kitchen & Grills" with "Cyglase Foods" in Ipaja, Lagos

DO $$
DECLARE
  v_vendor_user_id UUID := gen_random_uuid();
  v_vendor_email TEXT := 'solmeiworks@gmail.com';
  v_business_name TEXT := 'Cyglase Foods';
  v_city_area TEXT := 'Ipaja';
  v_slug TEXT := 'cyglase-foods';
BEGIN
  -- 1. Check if auth user already exists, or create new auth user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_vendor_email) THEN
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
      v_vendor_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_vendor_email,
      crypt('CyglaseVendor2026!', gen_salt('bf')),
      timezone('utc'::text, now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_business_name, 'role', 'vendor'),
      timezone('utc'::text, now()),
      timezone('utc'::text, now()),
      'authenticated',
      'authenticated'
    );
  ELSE
    SELECT id INTO v_vendor_user_id FROM auth.users WHERE email = v_vendor_email;
  END IF;

  -- 1b. Ensure identity row exists in auth.identities for GoTrue OTP verification
  INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_vendor_user_id::text,
    v_vendor_user_id,
    jsonb_build_object(
      'sub', v_vendor_user_id::text,
      'email', v_vendor_email,
      'email_verified', true,
      'full_name', v_business_name
    ),
    'email',
    timezone('utc'::text, now()),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  ) ON CONFLICT (provider_id, provider) DO NOTHING;

  -- 2. Create or update profile in public.profiles with vendor role
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    v_vendor_user_id,
    v_vendor_email,
    v_business_name,
    'vendor'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'vendor',
      full_name = v_business_name,
      updated_at = timezone('utc'::text, now());

  -- 3. Update existing vendor record or insert if missing
  IF EXISTS (SELECT 1 FROM public.vendors WHERE slug = 'mama-put-kitchen-yaba' OR slug = v_slug) THEN
    UPDATE public.vendors
    SET user_id = v_vendor_user_id,
        business_name = v_business_name,
        slug = v_slug,
        city_area = v_city_area,
        city = 'Lagos',
        state = 'Lagos',
        address = 'Ipaja, Lagos',
        description = 'Authentic Nigerian party jollof, rich soups, swallows, suya, and refreshing local beverages.',
        is_open = true,
        is_active = true,
        updated_at = timezone('utc'::text, now())
    WHERE slug = 'mama-put-kitchen-yaba' OR slug = v_slug;
  ELSE
    INSERT INTO public.vendors (
      user_id,
      business_name,
      slug,
      phone,
      is_phone_public,
      state,
      city,
      city_area,
      address,
      description,
      opening_time,
      closing_time,
      is_open,
      is_active
    ) VALUES (
      v_vendor_user_id,
      v_business_name,
      v_slug,
      '08012345678',
      true,
      'Lagos',
      'Lagos',
      v_city_area,
      'Ipaja, Lagos',
      'Authentic Nigerian party jollof, rich soups, swallows, suya, and refreshing local beverages.',
      '08:00:00',
      '22:00:00',
      true,
      true
    );
  END IF;

END $$;
