'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Users, LayoutDashboard, Shield, LogOut, Menu, X, ChevronDown, Camera, CalendarDays, Bell
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { AiBotPanel } from '@/components/ai-bot-panel'

const navItems = [
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/photo-intake', label: 'Photo Intake', icon: Camera },
  { href: '/admin', label: 'Admin', icon: Shield },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // current page label for topbar breadcrumb
  const currentPage = navItems.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserEmail(user.email ?? null)
      const { data } = await supabase
        .from('user_roles').select('role').eq('email', user.email).single()
      setUserRole(data?.role ?? 'staff')
    }
    fetchUser()
  }, [router])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-100 flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>

        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm">SafeCase</span>
              <p className="text-xs text-gray-400 leading-none mt-0.5">Case Management</p>
            </div>
          </div>
        </div>

        {/* Nav label */}
        <div className="px-4 pt-4 pb-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon size={16} className={active ? 'text-white' : 'text-gray-400'} />
                {label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
              </Link>
            )
          })}
        </nav>

        {/* User bottom */}
        <div className="p-3 border-t border-gray-100">
          {userEmail && (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-xl bg-gray-50">
              <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-xs">{userEmail[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{userEmail.split('@')[0]}</p>
                <p className="text-xs text-gray-400 truncate">{userRole === 'admin' ? '🛡 Admin' : '👤 Staff'}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">

          {/* Left: mobile hamburger + breadcrumb */}
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {/* Mobile logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm">SafeCase</span>
            </div>
            {/* Desktop breadcrumb */}
            {currentPage && (
              <div className="hidden lg:flex items-center gap-2 text-sm">
                <span className="text-gray-400">SafeCase</span>
                <span className="text-gray-300">/</span>
                <span className="font-semibold text-gray-800">{currentPage.label}</span>
              </div>
            )}
          </div>

          {/* Right: bell + profile */}
          <div className="flex items-center gap-2">

            {/* Notification bell */}
            <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-colors"
              >
                <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {userEmail ? userEmail[0].toUpperCase() : 'S'}
                  </span>
                </div>
                <span className="hidden lg:block text-sm text-gray-700 font-medium">
                  {userEmail?.split('@')[0] || 'User'}
                </span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-11 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {userEmail ? userEmail[0].toUpperCase() : 'S'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{userEmail?.split('@')[0] || 'User'}</p>
                        <p className="text-xs text-gray-400">{userEmail}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        userRole === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {userRole === 'admin' ? '🛡 Admin' : '👤 Staff'}
                      </span>
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Online
                      </span>
                    </div>
                  </div>
                  <div className="p-2">
                    {navItems.filter(n => n.href !== '/admin' || userRole === 'admin').map(({ href, label, icon: Icon }) => (
                      <Link key={href} href={href} onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                        <Icon size={14} className="text-gray-400" />
                        {label}
                      </Link>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-100">
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors w-full">
                      <LogOut size={14} />
                      Sign out
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