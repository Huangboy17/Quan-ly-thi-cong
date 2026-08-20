import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Xử lý CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Khởi tạo Supabase client với Service Role Key để có quyền tạo user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Lấy token của người gửi request (Caller)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Khởi tạo Supabase client bằng token của người dùng để xác định danh tính
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Xác thực Caller
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }
    const callerId = user.id;

    // Lấy thông tin Profile của Caller
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('account_type, status, max_members')
      .eq('id', callerId)
      .single();

    if (profileError || !callerProfile) {
      throw new Error('Profile not found');
    }

    // Kiểm tra quyền: Chỉ Level 1 đang Active mới được tạo Level 2
    if (callerProfile.account_type !== 'level_1') {
      throw new Error('Forbidden: Only Level 1 accounts can create Level 2 members');
    }
    if (callerProfile.status !== 'active') {
      throw new Error('Forbidden: Account is not active');
    }

    // Kiểm tra Quota
    const { count, error: countError } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', callerId);

    if (countError) {
      throw new Error('Error checking quota');
    }

    if ((count || 0) >= (callerProfile.max_members || 0)) {
      throw new Error('Quota Exceeded: Cannot create more members');
    }

    // Lấy thông tin từ request body
    const { email, password, full_name, role_title } = await req.json();
    if (!email || !password || !full_name) {
      throw new Error('Missing required fields');
    }

    // Tiến hành tạo tài khoản Cấp 2 bằng Admin API
    // CRITICAL: Truyền account_type = 'level_2' và status = 'active' vào user_metadata
    // để trigger handle_new_user() tạo profile đúng loại.
    // parent_id LUÔN lấy từ callerId (server-side), KHÔNG từ frontend.
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name,
        role: role_title || 'Thành viên Level 2',
        account_type: 'level_2',
        status: 'active',
        parent_id: callerId
      }
    });

    if (createError) {
      throw createError;
    }

    const newUserId = newUser.user.id;

    // Đảm bảo profile được tạo đúng bằng UPSERT trực tiếp.
    // Không phụ thuộc hoàn toàn vào trigger — trigger có thể chạy trước hoặc sau,
    // nhưng UPSERT này đảm bảo account_type, parent_id, status luôn chính xác.
    const { error: upsertError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: newUserId,
        full_name: full_name,
        email: email,
        role: role_title || 'Thành viên Level 2',
        account_type: 'level_2',
        parent_id: callerId,
        status: 'active',
        max_members: 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (upsertError) {
      // Nếu upsert profile thất bại, rollback: xóa auth user đã tạo
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error(`Failed to create profile: ${upsertError.message}`);
    }

    // Verify profile đã đúng
    const { data: verifyProfile, error: verifyError } = await supabaseAdmin
      .from('user_profiles')
      .select('account_type, parent_id, status')
      .eq('id', newUserId)
      .single();

    if (verifyError || !verifyProfile) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error('Profile verification failed after creation');
    }

    if (verifyProfile.account_type !== 'level_2' ||
        verifyProfile.parent_id !== callerId ||
        verifyProfile.status !== 'active') {
      // Profile không đúng — rollback
      await supabaseAdmin.from('user_profiles').delete().eq('id', newUserId);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error('Profile created with incorrect data, rolled back');
    }

    return new Response(
      JSON.stringify({ success: true, user: newUser.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
