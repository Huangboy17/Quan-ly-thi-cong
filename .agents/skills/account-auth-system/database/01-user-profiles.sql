-- Generic User Profiles Schema

CREATE TYPE user_status AS ENUM ('pending', 'active', 'blocked', 'rejected', 'archived');
CREATE TYPE account_tier AS ENUM ('system_admin', 'parent_account', 'sub_account');

CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID, -- Optional, for Mode B
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT, -- Business role
  account_type account_tier NOT NULL DEFAULT 'parent_account',
  parent_id UUID REFERENCES public.user_profiles(id),
  status user_status NOT NULL DEFAULT 'pending',
  max_members INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validation constraints
  CONSTRAINT check_parent_not_self CHECK (parent_id != id),
  CONSTRAINT check_system_admin_parent CHECK (
    (account_type = 'system_admin' AND parent_id IS NULL) OR (account_type != 'system_admin')
  ),
  CONSTRAINT check_parent_account_parent CHECK (
    (account_type = 'parent_account' AND parent_id IS NULL) OR (account_type != 'parent_account')
  ),
  CONSTRAINT check_sub_account_parent CHECK (
    (account_type = 'sub_account' AND parent_id IS NOT NULL) OR (account_type != 'sub_account')
  )
);
