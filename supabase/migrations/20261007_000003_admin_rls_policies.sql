-- Admin RLS Helper Function and Policies

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Platform Settings Policies
CREATE POLICY "Admins can manage platform_settings"
  ON public.platform_settings
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Public can view platform_settings"
  ON public.platform_settings
  FOR SELECT
  USING (true);

-- Categories Policies
CREATE POLICY "Admins can manage categories"
  ON public.categories
  FOR ALL
  USING (public.is_admin());

-- Vendors Policies
CREATE POLICY "Admins can manage vendors"
  ON public.vendors
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Vendors can view and update own store"
  ON public.vendors
  FOR ALL
  USING (auth.uid() = user_id);

-- Menu Items Policies
CREATE POLICY "Admins can manage menu_items"
  ON public.menu_items
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Vendors can manage own menu_items"
  ON public.menu_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = menu_items.vendor_id AND vendors.user_id = auth.uid()
    )
  );

-- Orders Policies
CREATE POLICY "Admins can manage all orders"
  ON public.orders
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Customers can view and update own orders"
  ON public.orders
  FOR ALL
  USING (auth.uid() = customer_id);

CREATE POLICY "Vendors can view and update orders for their store"
  ON public.orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = orders.vendor_id AND vendors.user_id = auth.uid()
    )
  );

-- Order Items Policies
CREATE POLICY "Admins can manage order_items"
  ON public.order_items
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Users can view items for accessible orders"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.customer_id = auth.uid() OR public.is_admin())
    )
  );

-- Profiles Policies
CREATE POLICY "Admins can view and manage all profiles"
  ON public.profiles
  FOR ALL
  USING (public.is_admin());
