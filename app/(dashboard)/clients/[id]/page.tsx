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

type FollowUp = {
  note: string
  category: string
  due_days: number
}

export default function ClientProfilePage() {
  const params = useParams()
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id as string
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [services, setServices] = useState<ServiceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [form, setForm] = useState({
    service_type: '', notes: '', staff_name: ''
  })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<FollowUp[]>([])
  const [showAiToast, setShowAiToast] = useState(false)

  useEffect(() => {
    fetchClient()
    fetchServices()
  }, [clientId])

  const fetchClient = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()
    setClient(data)
    setLoading(false)

    // 로그인 유저 확인 + Audit log 기록
    try {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user:', user?.email)
      if (user) {
        setCurrentUserEmail(user.email ?? null)
        if (data) {
          await fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_email: user.email,
              action: 'VIEW_CLIENT',
              record_id: clientId,
              details: `Viewed ${data.name}'s profile`
            })
          })
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
    }
  }

  const fetchServices = async () => {
    const { data } = await supabase
      .from('service_entries')
      .select('*')
      .eq('client_id', clientId)
      .order('service_date', { ascending: false })
    setServices(data || [])
  }

  const detectFollowUps = async (notes: string) => {
    setAiLoading(true)
    setShowAiToast(false)
    try {
      const res = await fetch('/api/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, client_id: clientId })
      })
      const data = await res.json()
      console.log('AI result:', data)
      if (data.followUps && data.followUps.length > 0) {
        setAiResult(data.followUps)
        setShowAiToast(true)
      }
    } catch (err) {
      console.error('AI error:', err)
    } finally {
      setAiLoading(false)
    }
  }

  const saveService = async () => {
    if (!form.service_type) return
    await supabase.from('service_entries').insert([{
      client_id: clientId,
      service_date: new Date().toISOString().split('T')[0],
      service_type: form.service_type,
      staff_name: form.staff_name || currentUserEmail || 'Staff',
      notes: form.notes,
    }])

    if (form.notes) {
      await detectFollowUps(form.notes)
    }

    setShowForm(false)
    setForm({ service_type: '', notes: '', staff_name: '' })
    fetchServices()
  }

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>
  if (!client) return <div className="p-6 text-gray-400">Client not found.</div>

  return (
    <div className="max-w-4xl mx-auto p-6">

      {/* AI 분석 중 */}
      {aiLoading && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-xl shadow p-4 text-sm text-gray-500 z-50">
          🤖 AI analyzing case note...
        </div>
      )}

      {/* AI Follow-up 토스트 */}
      {showAiToast && aiResult.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-white border border-indigo-200 rounded-xl shadow-lg p-4 max-w-sm z-50">
          <div className="flex justify-between items-center mb-3">
            <p className="font-semibold text-indigo-700 text-sm">
              ⚡ AI detected {aiResult.length} follow-up{aiResult.length > 1 ? 's' : ''}
            </p>
            <button onClick={() => setShowAiToast(false)} className="text-gray-400 hover:text-gray-600 ml-4">✕</button>
          </div>
          {aiResult.map((f, i) => (
            <div key={i} className="bg-indigo-50 rounded-lg p-3 mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                  {f.category}
                </span>
                <span className="text-xs text-gray-400">Due in {f.due_days} days</span>
              </div>
              <p className="text-sm text-gray-700">{f.note}</p>
            </div>
          ))}
          <p className="text-xs text-gray-400 mt-2">Added to Pending Follow-ups ✓</p>
        </div>
      )}

      {/* 뒤로가기 + 현재 유저 */}
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={() => router.push('/clients')}>
          ← Back to Clients
        </Button>
        {currentUserEmail && (
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
            <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-xs">
                {currentUserEmail[0].toUpperCase()}
              </span>
            </div>
            <span>{currentUserEmail}</span>
            <span className="text-gray-300">·</span>
            <span className="text-green-500">● Access logged</span>
          </div>
        )}
      </div>

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
              <Input
                value={form.service_type}
                onChange={e => setForm({...form, service_type: e.target.value})}
                placeholder="Food Assistance"
              />
            </div>
            <div>
              <Label>Staff Name</Label>
              <Input
                value={form.staff_name}
                onChange={e => setForm({...form, staff_name: e.target.value})}
                placeholder={currentUserEmail || 'Staff A'}
              />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="e.g. Client mentioned she hasn't eaten today. Will check food assistance next week."
              />
              <p className="text-xs text-gray-400 mt-1">
                💡 Describe what happened and any planned actions — AI will auto-detect follow-ups
              </p>
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