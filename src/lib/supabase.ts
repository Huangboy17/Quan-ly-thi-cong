import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Missing Supabase env variables. Check .env.local file:\n' +
    '   VITE_SUPABASE_URL=https://xxx.supabase.co\n' +
    '   VITE_SUPABASE_ANON_KEY=eyJ...'
  );
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
