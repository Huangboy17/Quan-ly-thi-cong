-- RLS Helper Functions to prevent infinite recursion

-- Example Helper for Mode A (Tenant = Parent ID)
CREATE OR REPLACE FUNCTION auth.get_tenant_id() RETURNS UUID AS $$
  SELECT COALESCE(parent_id, id)
  FROM public.user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Usage in business table:
-- CREATE POLICY "Tenant Isolation" ON business_table
-- FOR ALL USING (tenant_id = auth.get_tenant_id());

-- To protect user_profiles without recursion:
-- 1. Users can read their own profile
-- 2. Parent accounts can read profiles where parent_id = their id
-- 3. System admins can read all profiles
