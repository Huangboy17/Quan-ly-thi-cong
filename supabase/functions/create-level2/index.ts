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
    const token = authHeader.replace('Bearer ', '');

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
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      app_metadata: {
        is_level_2: true
      },
      user_metadata: {
        full_name: full_name,
        role: role_title || 'Thành viên Level 2',
        parent_id: callerId
      }
    });

    if (createError) {
      throw createError;
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
