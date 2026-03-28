'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  gender: string
}

type ServiceEntry = {
  id: string
  service_date: string
  service_type: string
  staff_name: string
  notes: string
}

export default function ClientProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [services, setServices] = useState<ServiceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    service_type: '', notes: '', staff_name: ''
  })

  useEffect(() => {
    fetchClient()
    fetchServices()
  }, [id])

  const fetchClient = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    setClient(data)
    setLoading(false)
  }

  const fetchServices = async () => {
    const { data } = await supabase
      .from('service_entries')
      .select('*')
      .eq('client_id', id)
      .order('service_date', { ascending: false })
    setServices(data || [])
  }

  const saveService = async () => {
    if (!form.service_type) return
    await supabase.from('service_entries').insert([{
      client_id: id,
      service_date: new Date().toISOString().split('T')[0],
      service_type: form.service_type,
      staff_name: form.staff_name,
      notes: form.notes,
    }])
    setShowForm(false)
    setForm({ service_type: '', notes: '', staff_name: '' })
    fetchServices()
  }

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>
  if (!client) return <div className="p-6 text-gray-400">Client not found.</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 뒤로가기 */}
      <Button variant="outline" onClick={() => router.push('/clients')} className="mb-4">
        ← Back to Clients
      </Button>

      {/* 클라이언트 정보 */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-xl">{client.name}</CardTitle>
          <Badge variant={client.is_active ? 'default' : 'secondary'}>
            {client.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Date of Birth:</span> {client.date_of_birth || '—'}</div>
          <div><span className="text-gray-500">Phone:</span> {client.phone || '—'}</div>
          <div><span className="text-gray-500">Email:</span> {client.email || '—'}</div>
          <div><span className="text-gray-500">Language:</span> {client.language || '—'}</div>
          <div><span className="text-gray-500">Household Size:</span> {client.household_size || '—'}</div>
          <div><span className="text-gray-500">Gender:</span> {client.gender || '—'}</div>
          {client.notes && (
            <div className="col-span-2"><span className="text-gray-500">Notes:</span> {client.notes}</div>
          )}
        </CardContent>
      </Card>

      {/* 서비스 기록 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Service History</h2>
        <Button onClick={() => setShowForm(!showForm)}>+ Log Service</Button>
      </div>

      {/* 서비스 입력 폼 */}
      {showForm && (
        <Card className="mb-4">
          <CardContent className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <Label>Service Type *</Label>
              <Input value={form.service_type} onChange={e => setForm({...form, service_type: e.target.value})} placeholder="Food Assistance" />
            </div>
            <div>
              <Label>Staff Name</Label>
              <Input value={form.staff_name} onChange={e => setForm({...form, staff_name: e.target.value})} placeholder="Staff A" />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Service notes..." />
            </div>
            <div className="col-span-2 flex gap-2">
              <Button onClick={saveService}>Save</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 서비스 목록 */}
      {services.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No services logged yet.</div>
      ) : (
        <div className="space-y-3">
          {services.map(s => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">{s.service_type}</p>
                    <p className="text-sm text-gray-500">{s.notes}</p>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    <p>{s.service_date}</p>
                    <p>{s.staff_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}