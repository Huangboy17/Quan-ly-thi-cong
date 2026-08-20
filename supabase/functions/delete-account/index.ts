import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Xác thực caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }
    const callerId = user.id;

    // 2. Lấy profile caller
    const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
      .from('user_profiles')
      .select('account_type, status')
      .eq('id', callerId)
      .single();

    if (callerProfileError || !callerProfile) {
      throw new Error('Caller profile not found');
    }

    if (callerProfile.status !== 'active') {
      throw new Error('Forbidden: Caller account is not active');
    }

    // 3. Lấy target user id từ request body
    const { target_user_id } = await req.json();
    if (!target_user_id) {
      throw new Error('Missing target_user_id');
    }

    // Không cho phép tự xóa chính mình
    if (target_user_id === callerId) {
      throw new Error('Cannot delete your own account');
    }

    // 4. Lấy profile target
    const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
      .from('user_profiles')
      .select('account_type, parent_id, email')
      .eq('id', target_user_id)
      .single();

    if (targetProfileError || !targetProfile) {
      throw new Error('Target profile not found');
    }

    // 5. Kiểm tra quyền xóa
    const callerType = callerProfile.account_type;
    const targetType = targetProfile.account_type;

    if (callerType === 'super_admin') {
      // Super Admin có thể xóa Level 1 hoặc Level 2
      // Không được xóa Super Admin khác
      if (targetType === 'super_admin') {
        throw new Error('Forbidden: Cannot delete another Super Admin');
      }
    } else if (callerType === 'level_1') {
      // Level 1 chỉ được xóa Level 2 thuộc chính mình
      if (targetType !== 'level_2') {
        throw new Error('Forbidden: Level 1 can only delete Level 2 members');
      }
      if (targetProfile.parent_id !== callerId) {
        throw new Error('Forbidden: Cannot delete Level 2 of another Level 1');
      }
    } else {
      // Level 2 không được xóa ai
      throw new Error('Forbidden: Level 2 accounts cannot delete other accounts');
    }

    // 6. Nếu xóa Level 1, phải xử lý Level 2 con trước
    if (targetType === 'level_1') {
      const { data: childProfiles, error: childError } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('parent_id', target_user_id);

      if (childError) {
        throw new Error(`Error fetching child accounts: ${childError.message}`);
      }

      // Xóa từng Level 2 con
      if (childProfiles && childProfiles.length > 0) {
        for (const child of childProfiles) {
          // Xóa profile con trước
          await supabaseAdmin
            .from('user_profiles')
            .delete()
            .eq('id', child.id);

          // Xóa auth user con
          const { error: deleteChildAuthError } = await supabaseAdmin.auth.admin.deleteUser(child.id);
          if (deleteChildAuthError) {
            console.error(`Warning: Failed to delete auth user for child ${child.id}:`, deleteChildAuthError.message);
            // Tiếp tục xóa các con khác, không dừng lại
          }
        }
      }
    }

    // 7. Xóa profile target
    const { error: deleteProfileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', target_user_id);

    if (deleteProfileError) {
      throw new Error(`Failed to delete profile: ${deleteProfileError.message}`);
    }

    // 8. Xóa auth user target
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(target_user_id);
    if (deleteAuthError) {
      throw new Error(`Failed to delete auth user: ${deleteAuthError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Account ${targetProfile.email} deleted successfully`,
        deleted_user_id: target_user_id,
        deleted_type: targetType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
