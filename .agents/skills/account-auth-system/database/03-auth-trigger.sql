-- Auth Trigger for auto-creating profiles securely
-- Uses metadata passed during signUp or admin.createUser to avoid race conditions.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_account_type account_tier;
  v_parent_id UUID;
  v_status user_status;
  v_role TEXT;
BEGIN
  -- Extract deterministic metadata from the auth creation request
  v_account_type := COALESCE((new.raw_user_meta_data->>'account_type')::account_tier, 'parent_account'::account_tier);
  v_parent_id := (new.raw_user_meta_data->>'parent_id')::UUID;
  v_status := COALESCE((new.raw_user_meta_data->>'status')::user_status, 'pending'::user_status);
  v_role := new.raw_user_meta_data->>'role';

  INSERT INTO public.user_profiles (
    id,
    full_name,
    email,
    account_type,
    parent_id,
    status,
    role
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    v_account_type,
    v_parent_id,
    v_status,
    v_role
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
