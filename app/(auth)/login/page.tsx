'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">SafeCase</h1>
        <p className="text-gray-500 text-sm mb-8">
          Crisis Family Case Management Platform
        </p>
        <Button onClick={handleGoogleLogin} className="w-full">
          Login with Google
        </Button>
      </div>
    </div>
  )
}