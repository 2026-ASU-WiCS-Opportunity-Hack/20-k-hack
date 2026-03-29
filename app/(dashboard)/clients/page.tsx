'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, Plus, Search, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

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
  'Food Security': 'bg-orange-100 text-orange-700',
  'Mental Health': 'bg-purple-100 text-purple-700',
  'Housing': 'bg-blue-100 text-blue-700',
  'Medical': 'bg-red-100 text-red-700',
  'Other': 'bg-gray-100 text-gray-600',
}

export default function ClientsPage() {
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '', date_of_birth: '', phone: '',
    email: '', household_size: '', language: 'English', notes: ''
  })

  useEffect(() => {
    fetchClients()
    fetchFollowUps()
  }, [])

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  const fetchFollowUps = async () => {
    const { data } = await supabase
      .from('follow_ups')
      .select('*, clients(name)')
      .eq('is_done', false)
      .order('due_date', { ascending: true })
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
      phone: form.phone,
      email: form.email,
      household_size: parseInt(form.household_size) || null,
      language: form.language,
      notes: form.notes,
    }])
    setShowForm(false)
    setForm({ name: '', date_of_birth: '', phone: '', email: '', household_size: '', language: 'English', notes: '' })
    fetchClients()
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* 페이지 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} total clients</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          <Plus size={15} />
          New Client
        </Button>
      </div>

      {/* 등록 폼 */}
      {showForm && (
        <Card className="mb-6 border-indigo-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Register New Client</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1">Full Name *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Maria Garcia" />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">Phone</Label>
              <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="480-555-0193" />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">Email</Label>
              <Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="maria@email.com" />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">Household Size</Label>
              <Input type="number" value={form.household_size} onChange={e => setForm({...form, household_size: e.target.value})} placeholder="4" />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">Primary Language</Label>
              <Input value={form.language} onChange={e => setForm({...form, language: e.target.value})} placeholder="English" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-gray-500 mb-1">Notes</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Initial notes..." />
            </div>
            <div className="col-span-2 flex gap-2">
              <Button onClick={saveClient} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Client</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Follow-ups */}
      {followUps.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={15} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-700">
              Pending Follow-ups
              <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                {followUps.length}
              </span>
            </h2>
          </div>
          <div className="grid gap-2">
            {followUps.map(f => (
              <div key={f.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[f.category] || categoryColors['Other']}`}>
                    {f.category}
                  </span>
                  <div>
                    <p className="text-sm text-gray-800">{f.note}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {f.clients?.name} · Due {new Date(f.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => markDone(f.id)}
                  className="text-gray-300 hover:text-green-500 transition-colors ml-4 flex-shrink-0"
                >
                  <CheckCircle2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 검색 */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 클라이언트 테이블 */}
      {loading ? (
        <div className="text-center text-gray-400 py-12 text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-12 text-sm">No clients found.</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Language</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Household</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-gray-50 hover:bg-indigo-50/50 transition-colors cursor-pointer ${i === filtered.length - 1 ? 'border-0' : ''}`}
                  onClick={() => window.location.href = `/clients/${c.id}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.language || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.household_size || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.is_active ? 'default' : 'secondary'} className={c.is_active ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
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