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
  // ADMIN
  { name: 'Admin User', email: '300000000001@mitaoe.ac.in', role: 'admin', department: 'IT', year: null },
  
  // PROFESSOR
  { name: 'Dr. Vikram Mehra', email: '200000000001@mitaoe.ac.in', role: 'professor', department: 'CSE', year: null },
  
  // CR (Class Representative)
  { name: 'Siddharth Malhotra', email: '100000000004@mitaoe.ac.in', role: 'cr', department: 'CSE', year: 3 },
  
  // STUDENTS
  { name: 'Rahul Sharma', email: '100000000001@mitaoe.ac.in', role: 'student', department: 'CSE', year: 2 },
  { name: 'Sneha Patil', email: '100000000002@mitaoe.ac.in', role: 'student', department: 'ENTC', year: 3 },
  { name: 'Aditya Verma', email: '100000000003@mitaoe.ac.in', role: 'student', department: 'MECH', year: 1 },
]

async function seed() {
  console.log('🚀 Starting to seed campus users...')

  for (const user of dummyUsers) {
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
      if (error.message.includes('already exists')) {
        console.log(`ℹ️ User already exists: ${user.email}`)
      } else {
        console.error(`❌ Failed to create ${user.email}:`, error.message)
      }
    } else {
      console.log(`✅ Created ${user.role.toUpperCase()}: ${user.name} (${user.email})`)
    }
  }

  console.log('✨ Seeding complete!')
}

seed()
