-- Create storage buckets for Cyglase Foods
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('cuisines', 'cuisines', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('food-images', 'food-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('receipts', 'receipts', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Update" ON storage.objects;

-- Allow public read of images and receipts
CREATE POLICY "Public Storage Read" ON storage.objects
FOR SELECT USING (bucket_id IN ('cuisines', 'food-images', 'receipts', 'email-templates'));

-- Allow uploads to public buckets
CREATE POLICY "Public Storage Upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id IN ('cuisines', 'food-images', 'receipts'));

-- Allow update
CREATE POLICY "Public Storage Update" ON storage.objects
FOR UPDATE USING (bucket_id IN ('cuisines', 'food-images', 'receipts'));
