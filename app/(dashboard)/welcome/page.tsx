'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Users, Camera, CalendarDays, BarChart3, Shield, ArrowRight, Globe, FileText, Zap } from 'lucide-react'

const features = [
  {
    href: '/photo-intake',
    icon: Camera,
    color: 'bg-indigo-50 text-indigo-600',
    border: 'hover:border-indigo-200',
    title: 'Photo-to-Intake',
    desc: 'Snap a photo of any paper form — AI reads and fills all fields instantly. Supports any language.',
    tag: 'AI-Powered',
    tagColor: 'bg-indigo-100 text-indigo-600',
  },
  {
    href: '/clients',
    icon: Users,
    color: 'bg-teal-50 text-teal-600',
    border: 'hover:border-teal-200',
    title: 'Client Management',
    desc: 'Search, filter, and manage all clients. Track household info, language, and service history.',
    tag: 'Core',
    tagColor: 'bg-teal-100 text-teal-700',
  },
  {
    href: '/calendar',
    icon: CalendarDays,
    color: 'bg-purple-50 text-purple-600',
    border: 'hover:border-purple-200',
    title: 'Calendar',
    desc: 'View and manage upcoming appointments, follow-up schedules, and client meeting reminders.',
    tag: 'Planning',
    tagColor: 'bg-purple-100 text-purple-600',
  },
  {
    href: '/dashboard',
    icon: BarChart3,
    color: 'bg-orange-50 text-orange-600',
    border: 'hover:border-orange-200',
    title: 'Analytics Dashboard',
    desc: 'Real-time charts on visit trends, service types, and language demographics across all clients.',
    tag: 'Insights',
    tagColor: 'bg-orange-100 text-orange-700',
  },
  {
    href: '/admin',
    icon: Shield,
    color: 'bg-red-50 text-red-600',
    border: 'hover:border-red-200',
    title: 'Audit & Security',
    desc: 'Every data access is logged. Real-time anomaly detection alerts admins to unusual activity.',
    tag: 'Admin',
    tagColor: 'bg-red-100 text-red-600',
  },
  {
    href: '/photo-intake',
    icon: Globe,
    color: 'bg-green-50 text-green-600',
    border: 'hover:border-green-200',
    title: 'Multilingual Support',
    desc: 'Forms in Spanish, Korean, Arabic, and more are auto-translated to English on upload.',
    tag: 'AI-Powered',
    tagColor: 'bg-green-100 text-green-700',
  },
]

export default function WelcomePage() {
  const [userName, setUserName] = useState<string>('there')
  const [greeting, setGreeting] = useState<string>('Welcome')
  const router = useRouter()

  useEffect(() => {
    const hour = new Date().getHours()
    setGreeting(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening')

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserName(user.email?.split('@')[0] ?? 'there')
    }
    fetchUser()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero banner with photo */}
      <div className="relative overflow-hidden border-b border-gray-100" style={{ minHeight: 280 }}>
        <img
          src="/hero.jpg"
          alt="Nonprofit volunteers"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-gray-900/10" />

        <div className="relative max-w-5xl mx-auto px-6 py-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            {/* Left */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-white/20">
                <Zap size={12} />
                AI-Powered Case Management
              </div>
              <h1 className="text-3xl font-bold text-white mb-2" suppressHydrationWarning>
                {greeting}, {userName} 👋
              </h1>
              <p className="text-white/70 text-base leading-relaxed mb-6">
                Welcome to <span className="font-semibold text-white">SafeCase</span> — the intelligent case management platform built for nonprofits.
                Digitize paper intake forms, support multilingual clients, and never miss a follow-up.
              </p>
              <div className="flex gap-3">
                <Link href="/clients"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-lg">
                  Go to Clients <ArrowRight size={14} />
                </Link>
                <Link href="/photo-intake"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
                  <Camera size={14} />
                  Try Photo Intake
                </Link>
              </div>
            </div>

            {/* Right: flow cards — hidden */}

          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Everything you need</h2>
          <p className="text-sm text-gray-400 mt-0.5">All tools in one place — built for frontline nonprofit staff</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ href, icon: Icon, color, border, title, desc, tag, tagColor }) => (
            <Link key={title} href={href}
              className={`group bg-white border border-gray-100 ${border} rounded-2xl p-5 transition-all hover:shadow-md cursor-pointer`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={18} />
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight size={11} />
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom note */}
        <div className="mt-8 flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-5 py-4">
          <FileText size={16} className="text-gray-400 flex-shrink-0" />
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Built for Opportunity Hack 2026 · WiCS ASU × SafeCase</span>
            {' '}— All client data is encrypted, access-logged, and never shared.
          </p>
        </div>
      </div>
    </div>
  )
}