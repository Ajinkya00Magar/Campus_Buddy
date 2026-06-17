import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

function loadEnv() {
  const envPath = path.resolve('frontend/.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, ...value] = line.split('=')
      if (key && value) {
        process.env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '')
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

const adminUser = {
  name: 'Puja Verma',
  email: 'pujaverma@mitaoe.ac.in',
  password: 'password123',
  role: 'admin',
  department: 'IT',
  year: null,
}

async function createAdmin() {
  console.log('🚀 Creating admin user...')

  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('❌ Failed to list auth users:', listError.message)
    process.exit(1)
  }

  const existing = existingUsers.users.find(user => user.email === adminUser.email)
  if (existing) {
    console.log(`🧹 Existing user found. Deleting ${adminUser.email} before recreation...`)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(existing.id)
    if (deleteError) {
      console.error('❌ Failed to delete existing user:', deleteError.message)
      process.exit(1)
    }
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: adminUser.email,
    password: adminUser.password,
    email_confirm: true,
    user_metadata: {
      name: adminUser.name,
      role: adminUser.role,
      department: adminUser.department,
      year: adminUser.year,
    },
  })

  if (error) {
    console.error('❌ Failed to create admin user:', error.message)
    process.exit(1)
  }

  console.log('✅ Admin user created successfully!')
  console.log(`   Email: ${adminUser.email}`)
  console.log(`   Password: ${adminUser.password}`)
}

createAdmin()