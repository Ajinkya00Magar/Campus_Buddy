import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

function loadEnv() {
  const envPath = path.resolve('frontend/.env.local')
  if (!fs.existsSync(envPath)) return

  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach((line) => {
    const [key, ...value] = line.split('=')
    if (key && value.length > 0) {
      process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '')
    }
  })
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables in frontend/.env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const [{ data: channels, count: channelsCount, error: channelsError }, { data: users, count: usersCount, error: usersError }] =
  await Promise.all([
    supabase
      .from('channels')
      .select('id,name,type,department,year,is_private', { count: 'exact' })
      .order('type')
      .order('name'),
    supabase
      .from('users')
      .select('id,email,role,department,year', { count: 'exact' })
      .order('role')
      .order('email'),
  ])

if (channelsError) console.error('Channels query failed:', channelsError.message)
if (usersError) console.error('Users query failed:', usersError.message)

console.log(JSON.stringify({
  channelsCount,
  channels,
  usersCount,
  users,
}, null, 2))
