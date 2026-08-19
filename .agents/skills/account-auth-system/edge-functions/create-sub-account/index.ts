import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabaseUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');
    
    const callerId = user.id;

    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('account_type, status, max_members, organization_id')
      .eq('id', callerId)
      .single();

    if (profileError || !callerProfile) throw new Error('Profile not found');
    if (callerProfile.account_type !== 'parent_account') throw new Error('Forbidden: Only parent accounts can create sub-accounts');
    if (callerProfile.status !== 'active') throw new Error('Forbidden: Account is not active');

    const { count, error: countError } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', callerId);

    if (countError) throw new Error('Error checking quota');
    if ((count || 0) >= (callerProfile.max_members || 0)) throw new Error('Quota Exceeded');

    const { email, password, full_name, role } = await req.json();

    // Pass metadata so the DB trigger handles it deterministically (NO SETTIMEOUT)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: {
        full_name,
        role,
        account_type: 'sub_account',
        status: 'active',
        parent_id: callerId,
        organization_id: callerProfile.organization_id // If Mode B
      }
    });

    if (createError) throw createError;

    return new Response(JSON.stringify({ success: true, user: newUser.user }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});
