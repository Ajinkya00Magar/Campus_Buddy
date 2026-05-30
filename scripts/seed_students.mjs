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

const dummyStudents = [
  { name: 'Rahul Sharma', email: '100000000001@mitaoe.ac.in', department: 'CSE', year: 2 },
  { name: 'Sneha Patil', email: '100000000002@mitaoe.ac.in', department: 'ENTC', year: 3 },
  { name: 'Aditya Verma', email: '100000000003@mitaoe.ac.in', department: 'MECH', year: 1 },
]

async function seed() {
  console.log('🚀 Starting to seed dummy students...')

  for (const student of dummyStudents) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: student.email,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        name: student.name,
        role: 'student',
        department: student.department,
        year: student.year
      }
    })

    if (error) {
      console.error(`❌ Failed to create ${student.email}:`, error.message)
    } else {
      console.log(`✅ Created: ${student.name} (${student.email})`)
    }
  }

  console.log('✨ Seeding complete!')
}

seed()
