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

const testStudents = [
  { name: 'FY Student Test', email: 'fy.student@test.mitaoe.ac.in', role: 'student', department: 'CSE', year: 1 },
  { name: 'SY Student Test', email: 'sy.student@test.mitaoe.ac.in', role: 'student', department: 'CSE', year: 2 },
  { name: 'TY Student Test', email: 'ty.student@test.mitaoe.ac.in', role: 'student', department: 'CSE', year: 3 },
]

async function seed() {
  console.log('🚀 Starting to seed test students...\n')

  // Get list of existing auth users
  const { data: { users: existingAuthUsers }, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('❌ Failed to fetch existing users:', listError.message)
    return
  }

  for (const user of testStudents) {
    // Cleanup: If user exists, delete them first
    const existing = existingAuthUsers.find(u => u.email === user.email)
    if (existing) {
      console.log(`🧹 Cleaning up existing user: ${user.email}`)
      await supabase.auth.admin.deleteUser(existing.id)
    }

    // Create fresh user
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
      console.log(`✅ Created STUDENT: ${user.name}`)
      console.log(`   📧 Email: ${user.email}`)
      console.log(`   🎓 Year: ${user.year}`)
      console.log(`   🔐 Password: password123\n`)
    }
  }

  console.log('✨ Test students seeding complete!')
  console.log('\n📋 Test Credentials:')
  console.log('━'.repeat(50))
  testStudents.forEach(u => {
    console.log(`${u.name} (Year ${u.year})`)
    console.log(`  Email: ${u.email}`)
    console.log(`  Pass:  password123`)
    console.log('')
  })
}

seed()
