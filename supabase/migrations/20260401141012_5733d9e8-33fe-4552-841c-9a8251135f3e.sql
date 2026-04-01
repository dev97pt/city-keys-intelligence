
INSERT INTO storage.buckets (id, name, public) VALUES ('city-paper-thumbnails', 'city-paper-thumbnails', true);

CREATE POLICY "Anyone can view city paper thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'city-paper-thumbnails');

CREATE POLICY "Admins can upload city paper thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'city-paper-thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update city paper thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'city-paper-thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete city paper thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'city-paper-thumbnails' AND public.has_role(auth.uid(), 'admin'));
