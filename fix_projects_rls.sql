-- 1. Thêm cột liên kết tài khoản vào bảng projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.user_profiles(id),
ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES public.user_profiles(id);

-- 2. Gán tất cả hợp đồng hiện tại cho Super Admin để tránh bị ẩn dữ liệu cũ sau khi bật RLS
UPDATE public.projects
SET user_id = (SELECT id FROM public.user_profiles WHERE account_type = 'super_admin' LIMIT 1)
WHERE user_id IS NULL;

-- 3. Xóa các policy cho phép truy cập tự do cũ của bảng projects
DROP POLICY IF EXISTS "projects_allow_all" ON public.projects;

-- 4. Tạo RLS cho SELECT (Đọc dữ liệu)
-- Super Admin xem được toàn bộ hợp đồng
-- Level 1 xem được hợp đồng mình sở hữu
-- Level 2 xem được hợp đồng mình được phân công (assignee_id)
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
CREATE POLICY "projects_select_policy" ON public.projects
  FOR SELECT USING (
    (SELECT account_type FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
    OR auth.uid() = user_id 
    OR auth.uid() = assignee_id
  );

-- 5. Tạo RLS cho INSERT (Tạo mới)
DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
CREATE POLICY "projects_insert_policy" ON public.projects
  FOR INSERT WITH CHECK (
    (SELECT account_type FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
    OR auth.uid() = user_id 
    OR auth.uid() = assignee_id
  );

-- 6. Tạo RLS cho UPDATE (Cập nhật)
DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
CREATE POLICY "projects_update_policy" ON public.projects
  FOR UPDATE USING (
    (SELECT account_type FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
    OR auth.uid() = user_id 
    OR auth.uid() = assignee_id
  );

-- 7. Tạo RLS cho DELETE (Xóa)
DROP POLICY IF EXISTS "projects_delete_policy" ON public.projects;
CREATE POLICY "projects_delete_policy" ON public.projects
  FOR DELETE USING (
    (SELECT account_type FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
    OR auth.uid() = user_id
  );
