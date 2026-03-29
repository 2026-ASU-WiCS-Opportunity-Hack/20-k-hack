'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Plus, Search, AlertCircle, Users, Activity, Globe, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { CSVImportExport } from '@/components/csv-import-export'

type Client = {
  id: string
  name: string
  date_of_birth: string
  phone: string
  email: string
  language: string
  household_size: number
  is_active: boolean
  notes: string
}

type FollowUp = {
  id: string
  note: string
  category: string
  due_date: string
  is_done: boolean
  clients: { name: string } | null
}

const categoryColors: Record<string, string> = {
  'Food Security': 'bg-orange-100 text-orange-700 border-orange-200',
  'Mental Health': 'bg-purple-100 text-purple-700 border-purple-200',
  'Housing': 'bg-blue-100 text-blue-700 border-blue-200',
  'Medical': 'bg-red-100 text-red-700 border-red-200',
  'Other': 'bg-gray-100 text-gray-600 border-gray-200',
}

const languageColors: Record<string, string> = {
  'English': 'bg-blue-50 text-blue-600',
  'Spanish': 'bg-orange-50 text-orange-600',
  'Korean': 'bg-purple-50 text-purple-600',
  'Chinese': 'bg-red-50 text-red-600',
}

export default function ClientsPage() {
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [langFilter, setLangFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [clients, setClients] = useState<Client[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', date_of_birth: '', phone: '',
    email: '', household_size: '', language: 'English', notes: ''
  })

  useEffect(() => {
    fetchClients()
    fetchFollowUps()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserEmail(user.email ?? null)
    } catch (err) { console.error('Auth error:', err) }
  }

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients').select('*').order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  const fetchFollowUps = async () => {
    const { data } = await supabase
      .from('follow_ups').select('*, clients(name)')
      .eq('is_done', false).order('due_date', { ascending: true })
    setFollowUps(data || [])
  }

  const markDone = async (id: string) => {
    await supabase.from('follow_ups').update({ is_done: true }).eq('id', id)
    fetchFollowUps()
  }

  const saveClient = async () => {
    if (!form.name) return
    await supabase.from('clients').insert([{
      name: form.name,
      date_of_birth: form.date_of_birth || null,
      phone: form.phone, email: form.email,
      household_size: parseInt(form.household_size) || null,
      language: form.language, notes: form.notes,
    }])
    setShowForm(false)
    setForm({ name: '', date_of_birth: '', phone: '', email: '', household_size: '', language: 'English', notes: '' })
    fetchClients()
  }

  const languages = ['All', ...Array.from(new Set(clients.map(c => c.language).filter(Boolean)))]

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchLang = langFilter === 'All' || c.language === langFilter
    const matchStatus = statusFilter === 'All' || (statusFilter === 'Active' ? c.is_active : !c.is_active)
    return matchSearch && matchLang && matchStatus
  })

  const activeCount = clients.filter(c => c.is_active).length
  const multilingualCount = clients.filter(c => c.language && c.language !== 'English').length
  const totalHousehold = clients.reduce((sum, c) => sum + (c.household_size || 0), 0)

  const isOverdue = (due: string) => new Date(due) < new Date()

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-400 mt-0.5">{clients.length} total clients</p>
        </div>
        <div className="flex items-center gap-3">
          {currentUserEmail && (
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
              <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold text-xs">{currentUserEmail[0].toUpperCase()}</span>
              </div>
              <span>{currentUserEmail}</span>
              <span className="text-gray-300">·</span>
              <span className="text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />Online</span>
            </div>
          )}
          <CSVImportExport
            clients={clients.map(c => ({ ...c, household_size: String(c.household_size ?? '') }))}
            onImport={async () => { fetchClients() }}
          />
          <Button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Plus size={15} /> New Client
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { icon: Users, label: 'Total Clients', value: clients.length, color: 'text-indigo-600 bg-indigo-50' },
          { icon: Activity, label: 'Active', value: activeCount, color: 'text-green-600 bg-green-50' },
          { icon: Globe, label: 'Multilingual', value: multilingualCount, color: 'text-purple-600 bg-purple-50' },
          { icon: Home, label: 'People Served', value: totalHousehold, color: 'text-orange-600 bg-orange-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-xl font-semibold text-gray-900 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* New Client Form */}
      {showForm && (
        <Card className="mb-6 border-indigo-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Register New Client</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {[
              { label: 'Full Name *', key: 'name', placeholder: 'Maria Garcia' },
              { label: 'Phone', key: 'phone', placeholder: '480-555-0193' },
              { label: 'Email', key: 'email', placeholder: 'maria@email.com' },
              { label: 'Primary Language', key: 'language', placeholder: 'English' },
              { label: 'Household Size', key: 'household_size', placeholder: '4', type: 'number' },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <Label className="text-xs text-gray-500 mb-1">{label}</Label>
                <Input type={type || 'text'} value={(form as any)[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} />
              </div>
            ))}
            <div>
              <Label className="text-xs text-gray-500 mb-1">Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-gray-500 mb-1">Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Initial notes..." />
            </div>
            <div className="col-span-2 flex gap-2">
              <Button onClick={saveClient} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Client</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Follow-ups */}
      {followUps.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={15} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-700">
              Pending Follow-ups
              <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{followUps.length}</span>
            </h2>
          </div>
          <div className="grid gap-2">
            {followUps.map(f => {
              const overdue = isOverdue(f.due_date)
              return (
                <div key={f.id} className={`flex items-center justify-between bg-white border rounded-xl px-4 py-3 shadow-sm transition-all hover:shadow-md ${overdue ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${categoryColors[f.category] || categoryColors['Other']}`}>
                      {f.category}
                    </span>
                    <div>
                      <p className="text-sm text-gray-800">{f.note}</p>
                      <p className={`text-xs mt-0.5 flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        {overdue && <span>⚠</span>}
                        {f.clients?.name} · Due {new Date(f.due_date).toLocaleDateString()}
                        {overdue && ' — Overdue'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => markDone(f.id)} className="text-gray-300 hover:text-green-500 transition-colors ml-4 flex-shrink-0 hover:scale-110">
                    <CheckCircle2 size={20} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search clients..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select
          value={langFilter} onChange={e => setLangFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          {languages.map(l => <option key={l}>{l}</option>)}
        </select>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          {['All', 'Active', 'Inactive'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center text-gray-400 py-12 text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-12 text-sm">No clients found.</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Language</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Household</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-gray-50 hover:bg-indigo-50/40 transition-colors cursor-pointer group ${i === filtered.length - 1 ? 'border-0' : ''}`}
                  onClick={() => window.location.href = `/clients/${c.id}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-semibold text-xs">{c.name[0]?.toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {c.language ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${languageColors[c.language] || 'bg-gray-50 text-gray-600'}`}>
                        {c.language}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.household_size || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.is_active ? 'default' : 'secondary'}
                      className={c.is_active ? 'bg-green-100 text-green-700 hover:bg-green-100 border-0' : 'bg-gray-100 text-gray-500 border-0'}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}