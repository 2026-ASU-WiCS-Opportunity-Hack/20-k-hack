'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Users, LayoutDashboard, Shield, LogOut, Menu, X, ChevronDown, Camera, CalendarDays
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { AiBotPanel } from '@/components/ai-bot-panel'
import { Toaster } from 'sonner'

const navItems = [
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/photo-intake', label: 'Photo Intake', icon: Camera },
  { href: '/admin', label: 'Admin', icon: Shield, adminOnly: true },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserEmail(user.email ?? null)
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('email', user.email)
        .single()

      // role 없으면 unauthorized
      if (!data) {
        router.push('/unauthorized')
        return
      }

      setUserRole(data.role)

      // /admin 페이지는 admin만 접근 가능
      if (pathname === '/admin' && data.role !== 'admin') {
        router.push('/clients')
      }
    }
    fetchUser()
  }, [router, pathname])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster position="top-right" richColors />

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-100 flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        <div className="h-14 flex items-center px-5 border-b border-gray-100">
          <Link href="/welcome" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-semibold text-gray-900">SafeCase</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems
            .filter(item => !item.adminOnly || userRole === 'admin')
            .map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              )
            })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link href="/welcome" className="flex items-center gap-2 lg:hidden">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">SafeCase</span>
          </Link>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
              >
                <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {userEmail ? userEmail[0].toUpperCase() : 'S'}
                  </span>
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-10 w-64 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {userEmail ? userEmail[0].toUpperCase() : 'S'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {userEmail?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-gray-400">{userEmail}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        userRole === 'admin'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {userRole === 'admin' ? '🛡 Admin' : '👤 Staff'}
                      </span>
                      <span className="text-xs text-green-500">● Online</span>
                    </div>
                  </div>

                  <div className="p-2">
                    <Link href="/clients" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                      <Users size={14} />My Clients
                    </Link>
                    <Link href="/dashboard" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                      <LayoutDashboard size={14} />Dashboard
                    </Link>
                    <Link href="/calendar" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                      <CalendarDays size={14} />Calendar
                    </Link>
                    <Link href="/photo-intake" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                      <Camera size={14} />Photo Intake
                    </Link>
                    {userRole === 'admin' && (
                      <Link href="/admin" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                        <Shield size={14} />Security & Audit
                      </Link>
                    )}
                  </div>

                  <div className="p-2 border-t border-gray-100">
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors w-full">
                      <LogOut size={14} />Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      <AiBotPanel />
    </div>
  )
}