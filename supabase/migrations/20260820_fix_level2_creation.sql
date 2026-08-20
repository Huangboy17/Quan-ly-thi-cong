-- Migration: Fix Level 2 creation trigger
-- Mục đích: Đảm bảo trigger handle_new_user() đọc account_type, status, parent_id 
-- từ raw_user_meta_data thay vì hard-code mặc định level_1.
--
-- Trigger này chạy khi có user mới đăng ký (auth.users INSERT).
-- Nếu metadata chứa account_type (ví dụ: 'level_2') thì dùng giá trị đó.
-- Nếu metadata không chứa account_type (public registration) thì mặc định 'level_1'.
--
-- QUAN TRỌNG: Edge Function create-level2 cũng thực hiện UPSERT sau khi tạo user,
-- nhưng trigger này phải hoạt động đúng để tránh race condition.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    full_name,
    email,
    role,
    account_type,
    parent_id,
    status,
    max_members,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', ''),
    -- Đọc account_type từ metadata. Nếu không có → mặc định 'level_1' (public registration).
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'level_1'),
    -- Đọc parent_id từ metadata. Nếu không có → NULL (public registration / Level 1).
    (NEW.raw_user_meta_data->>'parent_id')::UUID,
    -- Đọc status từ metadata. Nếu không có → 'pending' (public registration cần duyệt).
    COALESCE(NEW.raw_user_meta_data->>'status', 'pending'),
    -- max_members mặc định = 0
    0,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Đảm bảo trigger tồn tại
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
