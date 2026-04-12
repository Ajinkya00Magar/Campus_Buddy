'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { Settings as SettingsIcon, LogOut } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useUser()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      {/* Profile Section */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <Input
                type="text"
                value={user.name || ''}
                disabled
                className="bg-gray-50 mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                value={user.email || ''}
                disabled
                className="bg-gray-50 mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Role</Label>
              <Input
                type="text"
                value={user.role || ''}
                disabled
                className="bg-gray-50 mt-1 capitalize"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Account Section */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Sign out from your account to log in with a different account.
          </p>
          <Button
            onClick={handleSignOut}
            disabled={loading}
            className="gap-2 bg-red-600 hover:bg-red-700"
          >
            <LogOut className="h-4 w-4" />
            {loading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
