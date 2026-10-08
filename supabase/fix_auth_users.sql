-- Fix Supabase Auth users, token scan issues, and identities for GoTrue

DO $$
DECLARE
  v_admin_id UUID;
  v_admin_email TEXT := 'admin@cyglase.com';
  v_admin_pass TEXT := 'Things-don@make=sense';
  
  v_vendor_id UUID;
  v_vendor_email TEXT := 'solmeiworks@gmail.com';
BEGIN
  -- 1. Ensure all auth.users have empty strings instead of NULL in GoTrue's text token columns
  UPDATE auth.users
  SET 
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    phone_change = COALESCE(phone_change, ''),
    phone_change_token = COALESCE(phone_change_token, ''),
    reauthentication_token = COALESCE(reauthentication_token, ''),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    aud = COALESCE(aud, 'authenticated'),
    role = COALESCE(role, 'authenticated');

  -- 2. Setup or update Admin User
  SELECT id INTO v_admin_id FROM auth.users WHERE email = v_admin_email;
  
  IF v_admin_id IS NULL THEN
    v_admin_id := gen_random_uuid();
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
      role,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      email_change_token_current,
      phone_change,
      phone_change_token,
      reauthentication_token
    ) VALUES (
      v_admin_id,
      '00000000-0000-0000-0000-000000000000',
      v_admin_email,
      crypt(v_admin_pass, gen_salt('bf', 10)),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('sub', v_admin_id::text, 'email', v_admin_email, 'full_name', 'Cyglase Admin', 'role', 'admin')::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated',
      '', '', '', '', '', '', '', ''
    );
  ELSE
    UPDATE auth.users
    SET 
      encrypted_password = crypt(v_admin_pass, gen_salt('bf', 10)),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = json_build_object('sub', v_admin_id::text, 'email', v_admin_email, 'full_name', 'Cyglase Admin', 'role', 'admin')::jsonb,
      confirmation_token = '',
      recovery_token = '',
      email_change_token_new = '',
      email_change = '',
      email_change_token_current = '',
      phone_change = '',
      phone_change_token = '',
      reauthentication_token = '',
      updated_at = now()
    WHERE id = v_admin_id;
  END IF;

  -- 3. Ensure Admin Identity exists in auth.identities
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_admin_id AND provider = 'email') THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_admin_id,
      v_admin_id,
      json_build_object('sub', v_admin_id::text, 'email', v_admin_email)::jsonb,
      'email',
      now(),
      now(),
      now()
    );
  ELSE
    UPDATE auth.identities
    SET 
      identity_data = json_build_object('sub', v_admin_id::text, 'email', v_admin_email)::jsonb,
      updated_at = now()
    WHERE user_id = v_admin_id AND provider = 'email';
  END IF;

  -- Ensure Admin Profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_admin_id, v_admin_email, 'Cyglase Admin', 'admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin', full_name = 'Cyglase Admin', updated_at = now();


  -- 4. Setup or update Vendor User (solmeiworks@gmail.com)
  SELECT id INTO v_vendor_id FROM auth.users WHERE email = v_vendor_email;
  
  IF v_vendor_id IS NULL THEN
    v_vendor_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      aud,
      role,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      email_change_token_current,
      phone_change,
      phone_change_token,
      reauthentication_token
    ) VALUES (
      v_vendor_id,
      '00000000-0000-0000-0000-000000000000',
      v_vendor_email,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('sub', v_vendor_id::text, 'email', v_vendor_email, 'full_name', 'Cyglase Foods', 'role', 'vendor')::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated',
      '', '', '', '', '', '', '', ''
    );
  ELSE
    UPDATE auth.users
    SET 
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = json_build_object('sub', v_vendor_id::text, 'email', v_vendor_email, 'full_name', 'Cyglase Foods', 'role', 'vendor')::jsonb,
      confirmation_token = '',
      recovery_token = '',
      email_change_token_new = '',
      email_change = '',
      email_change_token_current = '',
      phone_change = '',
      phone_change_token = '',
      reauthentication_token = '',
      updated_at = now()
    WHERE id = v_vendor_id;
  END IF;

  -- 5. Ensure Vendor Identity exists in auth.identities
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_vendor_id AND provider = 'email') THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_vendor_id,
      v_vendor_id,
      json_build_object('sub', v_vendor_id::text, 'email', v_vendor_email)::jsonb,
      'email',
      now(),
      now(),
      now()
    );
  ELSE
    UPDATE auth.identities
    SET 
      identity_data = json_build_object('sub', v_vendor_id::text, 'email', v_vendor_email)::jsonb,
      updated_at = now()
    WHERE user_id = v_vendor_id AND provider = 'email';
  END IF;

  -- Ensure Vendor Profile & Vendor record link
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_vendor_id, v_vendor_email, 'Cyglase Foods', 'vendor')
  ON CONFLICT (id) DO UPDATE
  SET role = 'vendor', full_name = 'Cyglase Foods', updated_at = now();

  -- Update vendor record if exists
  UPDATE public.vendors
  SET user_id = v_vendor_id
  WHERE business_name = 'Cyglase Foods';

END $$;
