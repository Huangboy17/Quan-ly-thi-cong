-- 1. Thêm các cột thiếu vào bảng user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'level_1',
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.user_profiles(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 0;

-- Cập nhật profile của Super Admin hiện tại nếu có
UPDATE public.user_profiles 
SET account_type = 'super_admin', status = 'active'
WHERE email = 'buiviethoangktxd@gmail.com';

-- 2. Tạo bảng notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật RLS cho notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy cho notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = recipient_id);

-- Bật realtime cho notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 3. Tạo trigger khi user đăng ký (tạo profile mới)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_account_type TEXT := 'level_1';
  v_status TEXT := 'pending';
BEGIN
  -- Tự động duyệt nếu là email của Super Admin
  IF NEW.email = 'buiviethoangktxd@gmail.com' THEN
    v_account_type := 'super_admin';
    v_status := 'active';
  END IF;

  INSERT INTO public.user_profiles (id, email, full_name, role, account_type, status, max_members)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    CASE WHEN v_account_type = 'super_admin' THEN 'Super Admin' ELSE 'Kỹ Sư QCQS ME-CK' END, 
    v_account_type, 
    v_status, 
    0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Tạo trigger gửi notification khi user xác nhận email
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Kiểm tra nếu email_confirmed_at thay đổi từ NULL -> NOT NULL (user vừa click link xác nhận email)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Kiểm tra nếu là tài khoản level_1 và đang pending
    IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id AND account_type = 'level_1' AND status = 'pending') THEN
      
      -- Tạo notification cho tất cả các Super Admin
      INSERT INTO public.notifications (recipient_id, type, title, message, data)
      SELECT id, 'NEW_LEVEL_1_PENDING', 'Tài khoản mới xác nhận email', 
             'Tài khoản ' || COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || ' (' || NEW.email || ') vừa xác nhận email và đang chờ duyệt.', 
             jsonb_build_object('user_id', NEW.id, 'email', NEW.email)
      FROM public.user_profiles
      WHERE account_type = 'super_admin' AND status = 'active';
      
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_email_confirmed();
