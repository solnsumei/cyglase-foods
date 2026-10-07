-- Migration: Create States and Cities/Areas tables and seed major locations
-- Replaces hardcoded states/areas with database-driven locations

-- 1. Create States table
CREATE TABLE IF NOT EXISTS public.states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER set_states_updated_at
  BEFORE UPDATE ON public.states
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Create Cities/Areas table
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_city_per_state UNIQUE (state_id, name)
);

CREATE TRIGGER set_cities_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active states"
  ON public.states FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view active cities"
  ON public.cities FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage states"
  ON public.states FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage cities"
  ON public.cities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 3. Seed States and Major Cities / Neighborhoods
DO $$
DECLARE
  v_lagos_id UUID;
  v_fct_id UUID;
  v_rivers_id UUID;
  v_delta_id UUID;
  v_edo_id UUID;
  v_ogun_id UUID;
  v_oyo_id UUID;
  v_kano_id UUID;
  v_enugu_id UUID;
BEGIN
  -- Insert States
  INSERT INTO public.states (name, code, display_order) VALUES
    ('Lagos', 'LA', 1),
    ('Abuja (FCT)', 'FC', 2),
    ('Rivers', 'RI', 3),
    ('Delta', 'DE', 4),
    ('Edo', 'ED', 5),
    ('Ogun', 'OG', 6),
    ('Oyo', 'OY', 7),
    ('Kano', 'KN', 8),
    ('Enugu', 'EN', 9)
  ON CONFLICT (name) DO UPDATE SET is_active = true, display_order = EXCLUDED.display_order;

  SELECT id INTO v_lagos_id FROM public.states WHERE name = 'Lagos';
  SELECT id INTO v_fct_id FROM public.states WHERE name = 'Abuja (FCT)';
  SELECT id INTO v_rivers_id FROM public.states WHERE name = 'Rivers';
  SELECT id INTO v_delta_id FROM public.states WHERE name = 'Delta';
  SELECT id INTO v_edo_id FROM public.states WHERE name = 'Edo';
  SELECT id INTO v_ogun_id FROM public.states WHERE name = 'Ogun';
  SELECT id INTO v_oyo_id FROM public.states WHERE name = 'Oyo';
  SELECT id INTO v_kano_id FROM public.states WHERE name = 'Kano';
  SELECT id INTO v_enugu_id FROM public.states WHERE name = 'Enugu';

  -- Seed Lagos Areas
  IF v_lagos_id IS NOT NULL THEN
    INSERT INTO public.cities (state_id, name, display_order) VALUES
      (v_lagos_id, 'Ipaja', 1),
      (v_lagos_id, 'Ikeja', 2),
      (v_lagos_id, 'Yaba', 3),
      (v_lagos_id, 'Lekki Phase 1', 4),
      (v_lagos_id, 'Victoria Island', 5),
      (v_lagos_id, 'Surulere', 6),
      (v_lagos_id, 'Festac Town', 7),
      (v_lagos_id, 'Maryland', 8),
      (v_lagos_id, 'Magodo', 9),
      (v_lagos_id, 'Ajah', 10),
      (v_lagos_id, 'Ikoyi', 11),
      (v_lagos_id, 'Gbagada', 12),
      (v_lagos_id, 'Ogba', 13),
      (v_lagos_id, 'Agege', 14),
      (v_lagos_id, 'Ikorodu', 15)
    ON CONFLICT (state_id, name) DO NOTHING;
  END IF;

  -- Seed Abuja (FCT) Areas
  IF v_fct_id IS NOT NULL THEN
    INSERT INTO public.cities (state_id, name, display_order) VALUES
      (v_fct_id, 'Wuse 2', 1),
      (v_fct_id, 'Garki', 2),
      (v_fct_id, 'Maitama', 3),
      (v_fct_id, 'Asokoro', 4),
      (v_fct_id, 'Gwarinpa', 5),
      (v_fct_id, 'Jabi', 6),
      (v_fct_id, 'Utako', 7),
      (v_fct_id, 'Kubwa', 8),
      (v_fct_id, 'Lugbe', 9),
      (v_fct_id, 'Central Business District', 10)
    ON CONFLICT (state_id, name) DO NOTHING;
  END IF;

  -- Seed Rivers (Port Harcourt) Areas
  IF v_rivers_id IS NOT NULL THEN
    INSERT INTO public.cities (state_id, name, display_order) VALUES
      (v_rivers_id, 'Old GRA (Port Harcourt)', 1),
      (v_rivers_id, 'New GRA (Port Harcourt)', 2),
      (v_rivers_id, 'Trans-Amadi', 3),
      (v_rivers_id, 'Rumuokoro', 4),
      (v_rivers_id, 'D-Line', 5),
      (v_rivers_id, 'Diobu', 6),
      (v_rivers_id, 'Eleme', 7),
      (v_rivers_id, 'Woji', 8),
      (v_rivers_id, 'Choba', 9)
    ON CONFLICT (state_id, name) DO NOTHING;
  END IF;

  -- Seed Delta Areas
  IF v_delta_id IS NOT NULL THEN
    INSERT INTO public.cities (state_id, name, display_order) VALUES
      (v_delta_id, 'Asaba (GRA)', 1),
      (v_delta_id, 'Asaba (Okpanam Road)', 2),
      (v_delta_id, 'Warri (Effurun)', 3),
      (v_delta_id, 'Warri (Airport Road)', 4),
      (v_delta_id, 'Sapele', 5),
      (v_delta_id, 'Ughelli', 6),
      (v_delta_id, 'Agbor', 7)
    ON CONFLICT (state_id, name) DO NOTHING;
  END IF;

  -- Seed Edo (Benin City) Areas
  IF v_edo_id IS NOT NULL THEN
    INSERT INTO public.cities (state_id, name, display_order) VALUES
      (v_edo_id, 'Benin City (GRA)', 1),
      (v_edo_id, 'Benin City (Ugbowo)', 2),
      (v_edo_id, 'Benin City (Airport Road)', 3),
      (v_edo_id, 'Benin City (Ekenwan Road)', 4),
      (v_edo_id, 'Benin City (Ikpoba Hill)', 5),
      (v_edo_id, 'Ekpoma', 6),
      (v_edo_id, 'Auchi', 7)
    ON CONFLICT (state_id, name) DO NOTHING;
  END IF;

  -- Seed Ogun Areas
  IF v_ogun_id IS NOT NULL THEN
    INSERT INTO public.cities (state_id, name, display_order) VALUES
      (v_ogun_id, 'Abeokuta (Oke-Mosan)', 1),
      (v_ogun_id, 'Abeokuta (Ibikunle / Kuto)', 2),
      (v_ogun_id, 'Ota', 3),
      (v_ogun_id, 'Sagamu', 4),
      (v_ogun_id, 'Ijebu Ode', 5),
      (v_ogun_id, 'Ibafo', 6),
      (v_ogun_id, 'Mowe', 7),
      (v_ogun_id, 'Arepo', 8)
    ON CONFLICT (state_id, name) DO NOTHING;
  END IF;

  -- Seed Oyo Areas
  IF v_oyo_id IS NOT NULL THEN
    INSERT INTO public.cities (state_id, name, display_order) VALUES
      (v_oyo_id, 'Ibadan (Bodija)', 1),
      (v_oyo_id, 'Ibadan (Oluyole)', 2),
      (v_oyo_id, 'Ibadan (Ring Road)', 3),
      (v_oyo_id, 'Ibadan (Dugbe)', 4),
      (v_oyo_id, 'Ibadan (Samonda / UI)', 5),
      (v_oyo_id, 'Ogbomoso', 6)
    ON CONFLICT (state_id, name) DO NOTHING;
  END IF;

  -- Seed Kano Areas
  IF v_kano_id IS NOT NULL THEN
    INSERT INTO public.cities (state_id, name, display_order) VALUES
      (v_kano_id, 'Nassarawa GRA (Kano)', 1),
      (v_kano_id, 'Bompai', 2),
      (v_kano_id, 'Sabon Gari', 3),
      (v_kano_id, 'Fagge', 4)
    ON CONFLICT (state_id, name) DO NOTHING;
  END IF;

  -- Seed Enugu Areas
  IF v_enugu_id IS NOT NULL THEN
    INSERT INTO public.cities (state_id, name, display_order) VALUES
      (v_enugu_id, 'Independence Layout (Enugu)', 1),
      (v_enugu_id, 'New Haven', 2),
      (v_enugu_id, 'GRA (Enugu)', 3),
      (v_enugu_id, 'Achara Layout', 4),
      (v_enugu_id, 'Trans-Ekulu', 5)
    ON CONFLICT (state_id, name) DO NOTHING;
  END IF;

END $$;
