-- 1. Cập nhật lại trigger handle_new_user để hỗ trợ tạo Level 2 an toàn
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_account_type TEXT := 'level_1';
  v_status TEXT := 'pending';
  v_parent_id UUID := NULL;
  v_role TEXT := 'Kỹ Sư QCQS ME-CK';
BEGIN
  -- A. Kiểm tra nếu là email Super Admin đăng ký
  IF NEW.email IN ('buiviethoangktxd@gmail.com', 'hoang19976312@gmail.com') THEN
    v_account_type := 'super_admin';
    v_status := 'active';
    v_role := 'Super Admin';
  END IF;

  -- B. Kiểm tra bảo mật cực cao: Chỉ khi Edge Function (dùng Service Role) gán cờ is_level_2 vào app_metadata
  -- Public users dùng signup API KHÔNG THỂ tự giả mạo app_metadata được (chỉ có user_metadata bị giả mạo).
  IF NEW.raw_app_meta_data->>'is_level_2' = 'true' THEN
    v_account_type := 'level_2';
    v_status := 'active'; -- Level 2 active ngay lập tức, không qua Super Admin duyệt
    v_parent_id := (NEW.raw_user_meta_data->>'parent_id')::UUID;
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'Thành viên Level 2');
  END IF;

  -- Thực hiện tạo Profile
  INSERT INTO public.user_profiles (id, email, full_name, role, account_type, status, max_members, parent_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    v_role, 
    v_account_type, 
    v_status, 
    0,
    v_parent_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Cập nhật lại trigger gửi notification để KHÔNG gửi thông báo cho Level 2
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Kiểm tra nếu email_confirmed_at thay đổi từ NULL -> NOT NULL
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Kiểm tra nếu là tài khoản level_1 và đang pending (Không áp dụng cho Level 2)
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
