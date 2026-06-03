
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Cascade delete comments and likes when their parent post is removed.
CREATE OR REPLACE FUNCTION public.cleanup_post_children()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.comments WHERE post_id = OLD.id;
  DELETE FROM public.likes WHERE post_id = OLD.id;
  RETURN OLD;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_post_children() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS cleanup_post_children_trigger ON public.posts;
CREATE TRIGGER cleanup_post_children_trigger
BEFORE DELETE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_post_children();
