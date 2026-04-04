
INSERT INTO storage.buckets (id, name, public)
VALUES ('city-papers', 'city-papers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view city paper PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'city-papers');

CREATE POLICY "Admins can upload city paper PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'city-papers'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete city paper PDFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'city-papers'
  AND public.has_role(auth.uid(), 'admin')
);
