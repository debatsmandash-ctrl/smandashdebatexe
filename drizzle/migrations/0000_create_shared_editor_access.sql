CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE public.node_overrides (
  node_id text PRIMARY KEY,
  label text,
  description text,
  deleted boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.node_overrides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.node_overrides TO authenticated;
GRANT ALL ON public.node_overrides TO service_role;
ALTER TABLE public.node_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Node overrides are publicly readable"
ON public.node_overrides FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Editors can insert node overrides"
ON public.node_overrides FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Editors can update node overrides"
ON public.node_overrides FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Editors can delete node overrides"
ON public.node_overrides FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX node_overrides_updated_at_idx ON public.node_overrides(updated_at DESC);