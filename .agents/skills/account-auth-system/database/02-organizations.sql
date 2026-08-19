-- Generic Organizations Schema (Optional - For Mode B)

CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alter profiles to enforce organization_id if needed
-- ALTER TABLE public.user_profiles
--   ADD CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
