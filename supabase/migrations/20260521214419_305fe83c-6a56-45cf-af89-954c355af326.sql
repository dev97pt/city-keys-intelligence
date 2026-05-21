UPDATE public.city_papers
SET pdf_path = regexp_replace(pdf_url, '^.*/city-papers/', ''),
    pdf_url = NULL
WHERE pdf_path IS NULL
  AND pdf_url LIKE '%/city-papers/%';