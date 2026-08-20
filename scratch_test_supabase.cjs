const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envLocalPath = path.join(__dirname, '.env.local');
let supabaseUrl = '';
let supabaseAnonKey = '';

if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts[0] === 'VITE_SUPABASE_URL') {
      supabaseUrl = parts[1].trim();
    }
    if (parts[0] === 'VITE_SUPABASE_ANON_KEY') {
      supabaseAnonKey = parts[1].trim();
    }
  });
}

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
    if (error) {
      console.error('Error fetching:', error);
    } else {
      console.log('Success fetching user_profiles:', data);
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

test();
