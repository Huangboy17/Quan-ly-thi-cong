-- 1. Drop existing allow-all policy
DROP POLICY IF EXISTS "profiles_allow_all" ON public.user_profiles;

-- 2. Allow all authenticated users to read profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.user_profiles;
CREATE POLICY "Anyone can view profiles" ON public.user_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Allow super admin to update ANY profile
DROP POLICY IF EXISTS "Super admins can update any profile" ON public.user_profiles;
CREATE POLICY "Super admins can update any profile" ON public.user_profiles
  FOR UPDATE USING (
    (SELECT account_type FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- 5. Prevent column tampering via Trigger
CREATE OR REPLACE FUNCTION public.prevent_profile_tampering()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is updating their own profile and they are NOT a super_admin
  IF auth.uid() = OLD.id AND OLD.account_type != 'super_admin' THEN
    -- Check restricted columns
    IF NEW.max_members IS DISTINCT FROM OLD.max_members THEN
      RAISE EXCEPTION 'Forbidden: Cannot change max_members';
    END IF;
    
    IF NEW.account_type IS DISTINCT FROM OLD.account_type THEN
      RAISE EXCEPTION 'Forbidden: Cannot change account_type';
    END IF;
    
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Forbidden: Cannot change status';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_update_prevent_tampering ON public.user_profiles;
CREATE TRIGGER on_profile_update_prevent_tampering
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_profile_tampering();
