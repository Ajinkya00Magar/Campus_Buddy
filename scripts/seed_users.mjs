import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Helper to load env variables manually if dotenv isn't installed
function loadEnv() {
  const envPath = path.resolve('frontend/.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, ...value] = line.split('=')
      if (key && value) {
        process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '')
      }
    })
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables in frontend/.env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const dummyUsers = [
  // ADMINS
  { name: 'Admin User', email: '300000000001@mitaoe.ac.in', role: 'admin', department: 'IT', year: null },
  { name: 'Puja Verma', email: 'pujaverma@mitaoe.ac.in', role: 'admin', department: 'IT', year: null },
  
  // PROFESSOR
  { name: 'Dr. Vikram Mehra', email: '200000000001@mitaoe.ac.in', role: 'professor', department: 'CSE', year: null },
  
  // CR (Class Representative)
  { name: 'Siddharth Malhotra', email: '100000000004@mitaoe.ac.in', role: 'cr', department: 'CSE', year: 3 },
  
  // STUDENTS
  { name: 'Rahul Sharma', email: '100000000001@mitaoe.ac.in', role: 'student', department: 'CSE', year: 2 },
  { name: 'Sneha Patil', email: '100000000002@mitaoe.ac.in', role: 'student', department: 'CSE', year: 3 },
  { name: 'Aditya Verma', email: '100000000003@mitaoe.ac.in', role: 'student', department: 'CSE', year: 1 },
]

async function seed() {
  console.log('🚀 Starting to seed campus users...')

  // 1. Get list of existing auth users to handle cleanup
  const { data: { users: existingAuthUsers }, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('❌ Failed to fetch existing users:', listError.message)
    return
  }

  for (const user of dummyUsers) {
    // 2. Cleanup: If user exists in Auth but not in public.users (or if we want a fresh start)
    const existing = existingAuthUsers.find(u => u.email === user.email)
    if (existing) {
      console.log(`🧹 Cleaning up existing user: ${user.email}`)
      await supabase.auth.admin.deleteUser(existing.id)
    }

    // 3. Create fresh user
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        name: user.name,
        role: user.role,
        department: user.department,
        year: user.year
      }
    })

    if (error) {
      console.error(`❌ Failed to create ${user.email}:`, error.message)
    } else {
      console.log(`✅ Created ${user.role.toUpperCase()}: ${user.name} (${user.email})`)
    }
  }

  console.log('✨ Seeding complete!')
}

seed()
