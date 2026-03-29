'use client'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
        prompt: 'select_account'  
        }
      }
    })
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* 왼쪽 브랜드 패널 */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative"
        style={{ backgroundImage: 'url(/login.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gray-900/70" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-semibold text-lg">SafeCase</span>
          </div>
        </div>

        <div className="relative z-10">
          <blockquote className="text-white text-2xl font-light leading-relaxed mb-6">
            "Every family deserves a case manager who never forgets."
          </blockquote>
          <div className="flex gap-6 text-gray-400 text-sm">
            <div>
              <p className="text-white font-semibold text-xl">92%</p>
              <p>nonprofits under $1M</p>
            </div>
            <div>
              <p className="text-white font-semibold text-xl">45 min</p>
              <p>saved daily per staff</p>
            </div>
            <div>
              <p className="text-white font-semibold text-xl">$0–15</p>
              <p>per month to run</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-gray-500 text-xs">
          © 2026 SafeCase · Built at WiCS ASU × Opportunity Hack
        </div>
      </div>

      {/* 오른쪽 로그인 패널 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-gray-900 font-semibold text-lg">SafeCase</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-500 text-sm">Sign in to access your case management dashboard</p>
          </div>

          <Button
            onClick={handleGoogleLogin}
            className="w-full h-11 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm flex items-center justify-center gap-3"
            variant="outline"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-xs text-amber-700 font-medium mb-1">🔒 Authorized Staff Only</p>
            <p className="text-xs text-amber-600">
              Access is restricted to registered nonprofit staff. Contact your administrator if you need access.
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            HIPAA-adjacent security · Role-based access · Audit logging
          </p>
        </div>
      </div>
    </div>
  )
}