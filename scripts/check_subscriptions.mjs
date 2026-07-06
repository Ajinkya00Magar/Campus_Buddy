import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
const envPath = path.resolve('frontend/.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in frontend/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSubscriptions() {
  console.log('Fetching subscriptions from database...');
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('*, users(name, email)');

  if (error) {
    console.error('Error fetching subscriptions:', error);
    return;
  }

  console.log(`Found ${subs.length} active subscription(s):`);
  subs.forEach((sub, i) => {
    console.log(`\n--- Subscription #${i + 1} ---`);
    console.log(`User ID: ${sub.user_id}`);
    console.log(`User Name: ${sub.users?.name || 'N/A'}`);
    console.log(`User Email: ${sub.users?.email || 'N/A'}`);
    console.log(`Endpoint: ${sub.endpoint.substring(0, 50)}...`);
    console.log(`Created At: ${sub.created_at}`);
  });
}

checkSubscriptions();
