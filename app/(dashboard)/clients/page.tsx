'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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

export default function ClientsPage() {
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '', date_of_birth: '', phone: '',
    email: '', household_size: '', language: 'English', notes: ''
  })

  // Call the client
  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  // Save Client
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

  // Search Engine
  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
        <Button onClick={() => setShowForm(!showForm)}>+ New Client</Button>
      </div>

      <Input
        placeholder="Search clients..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-6"
      />

      {/* Registeration Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Register New Client</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Maria Garcia" />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="480-555-0193" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="maria@email.com" />
            </div>
            <div>
              <Label>Household Size</Label>
              <Input type="number" value={form.household_size} onChange={e => setForm({...form, household_size: e.target.value})} placeholder="4" />
            </div>
            <div>
              <Label>Primary Language</Label>
              <Input value={form.language} onChange={e => setForm({...form, language: e.target.value})} placeholder="English" />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Initial notes..." />
            </div>
            <div className="col-span-2 flex gap-2">
              <Button onClick={saveClient}>Save Client</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client List */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No clients found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Link href={`/clients/${c.id}`} key={c.id}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex justify-between items-center p-4">
                  <div>
                    <p className="font-semibold text-gray-800">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.phone} · {c.language} · Household: {c.household_size}</p>
                  </div>
                  <Badge variant={c.is_active ? 'default' : 'secondary'}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}