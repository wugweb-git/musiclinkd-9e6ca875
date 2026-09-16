-- Spotify account connection (Feature 1). Not applied: the owner applies it after the live dump.
--
-- Tokens never reach the browser: RLS is on with no client policies, so only the service role
-- (server functions) reads or writes rows. The client learns status through a server function.
-- Scopes: account data only (user-read-private, user-read-email). Now-playing and top artists are
-- not requested until a surface uses them.

CREATE TABLE IF NOT EXISTS public.spotify_connections (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  spotify_user_id text NOT NULL,
  display_name text,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  scopes text NOT NULL,
  sharing text NOT NULL DEFAULT 'connections' CHECK (sharing IN ('connections', 'approved')),
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.spotify_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.spotify_connections FROM anon, authenticated;
GRANT ALL ON public.spotify_connections TO service_role;

DROP TRIGGER IF EXISTS update_spotify_connections_updated_at ON public.spotify_connections;
CREATE TRIGGER update_spotify_connections_updated_at BEFORE UPDATE ON public.spotify_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
