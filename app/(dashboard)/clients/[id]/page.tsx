'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2, X, Check, Upload, FileText, Download } from 'lucide-react'

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

type CustomField = {
  id: string
  field_name: string
  field_type: string
  applies_to: string
}

type CustomFieldValue = {
  id: string
  field_id: string
  value: string
  custom_field_definitions: { field_name: string; field_type: string } | null
}

type DocumentFile = {
  name: string
  created_at: string
  metadata?: { size: number }
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
    service_type: '', notes: '', staff_name: '',
    service_date: new Date().toISOString().split('T')[0]
  })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<FollowUp[]>([])
  const [showAiToast, setShowAiToast] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    service_type: '', notes: '', staff_name: '', service_date: ''
  })

  // 커스텀 필드
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValue[]>([])
  const [customFieldInputs, setCustomFieldInputs] = useState<Record<string, string>>({})
  const [savingCustomFields, setSavingCustomFields] = useState(false)

  // 문서
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchClient()
    fetchServices()
    fetchCustomFields()
    fetchDocuments()
  }, [clientId])

  const fetchClient = async () => {
    const { data } = await supabase
      .from('clients').select('*').eq('id', clientId).single()
    setClient(data)
    setLoading(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
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
    } catch (err) { console.error('Auth error:', err) }
  }

  const fetchServices = async () => {
    const { data } = await supabase
      .from('service_entries').select('*').eq('client_id', clientId)
      .order('service_date', { ascending: false })
    setServices(data || [])
  }

  const fetchCustomFields = async () => {
    const res = await fetch('/api/custom-fields')
    const fields = await res.json()
    const clientFields = (Array.isArray(fields) ? fields : []).filter((f: CustomField) => f.applies_to === 'client')
    setCustomFields(clientFields)

    const valRes = await fetch(`/api/custom-fields/values?client_id=${clientId}`)
    const values = await valRes.json()
    setCustomFieldValues(Array.isArray(values) ? values : [])

    const inputs: Record<string, string> = {}
    if (Array.isArray(values)) {
      values.forEach((v: CustomFieldValue) => { inputs[v.field_id] = v.value || '' })
    }
    setCustomFieldInputs(inputs)
  }

  const fetchDocuments = async () => {
    const res = await fetch(`/api/documents?client_id=${clientId}`)
    const data = await res.json()
    setDocuments(Array.isArray(data) ? data : [])
  }

  const uploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('client_id', clientId)
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData })
      if (res.ok) fetchDocuments()
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const downloadDocument = async (fileName: string) => {
    const { data } = await supabase.storage
      .from('client-documents')
      .createSignedUrl(`${clientId}/${fileName}`, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const deleteDocument = async (fileName: string) => {
    if (!confirm('Delete this document?')) return
    await fetch('/api/documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, fileName })
    })
    fetchDocuments()
  }

  const saveCustomFieldValues = async () => {
    setSavingCustomFields(true)
    try {
      for (const field of customFields) {
        const value = customFieldInputs[field.id]
        if (value !== undefined) {
          await fetch('/api/custom-fields/values', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: clientId, field_id: field.id, value })
          })
        }
      }
      await fetchCustomFields()
    } finally { setSavingCustomFields(false) }
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
      if (data.followUps && data.followUps.length > 0) {
        setAiResult(data.followUps)
        setShowAiToast(true)
      }
    } catch (err) { console.error('AI error:', err) }
    finally { setAiLoading(false) }
  }

  const saveService = async () => {
    if (!form.service_type) return
    await supabase.from('service_entries').insert([{
      client_id: clientId,
      service_date: form.service_date || new Date().toISOString().split('T')[0],
      service_type: form.service_type,
      staff_name: form.staff_name || currentUserEmail || 'Staff',
      notes: form.notes,
    }])
    if (form.notes) await detectFollowUps(form.notes)
    setShowForm(false)
    setForm({ service_type: '', notes: '', staff_name: '', service_date: new Date().toISOString().split('T')[0] })
    fetchServices()
  }

  const deleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service record?')) return
    await supabase.from('service_entries').delete().eq('id', id)
    fetchServices()
  }

  const startEdit = (s: ServiceEntry) => {
    setEditingId(s.id)
    setEditForm({ service_type: s.service_type, notes: s.notes, staff_name: s.staff_name, service_date: s.service_date })
  }

  const saveEdit = async () => {
    if (!editingId) return
    await supabase.from('service_entries').update({
      service_type: editForm.service_type,
      notes: editForm.notes,
      staff_name: editForm.staff_name,
      service_date: editForm.service_date,
    }).eq('id', editingId)
    setEditingId(null)
    fetchServices()
  }

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>
  if (!client) return <div className="p-6 text-gray-400">Client not found.</div>

  return (
    <div className="max-w-4xl mx-auto p-6">

      {aiLoading && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-xl shadow p-4 text-sm text-gray-500 z-50">
          🤖 AI analyzing case note...
        </div>
      )}

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
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">{f.category}</span>
                <span className="text-xs text-gray-400">Due in {f.due_days} days</span>
              </div>
              <p className="text-sm text-gray-700">{f.note}</p>
            </div>
          ))}
          <p className="text-xs text-gray-400 mt-2">Added to Pending Follow-ups ✓</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={() => router.push('/clients')}>← Back to Clients</Button>
        {currentUserEmail && (
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
            <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-xs">{currentUserEmail[0].toUpperCase()}</span>
            </div>
            <span>{currentUserEmail}</span>
            <span className="text-gray-300">·</span>
            <span className="text-green-500">● Access logged</span>
          </div>
        )}
      </div>

      {/* 기본 클라이언트 정보 */}
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

      {/* 커스텀 필드 */}
      {customFields.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Custom Fields</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {customFields.map(field => (
              <div key={field.id}>
                <Label className="text-xs text-gray-500">{field.field_name}</Label>
                <Input
                  type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                  value={customFieldInputs[field.id] || ''}
                  onChange={e => setCustomFieldInputs(prev => ({ ...prev, [field.id]: e.target.value }))}
                  placeholder={`Enter ${field.field_name.toLowerCase()}...`}
                />
              </div>
            ))}
            <div className="col-span-2">
              <Button onClick={saveCustomFieldValues} disabled={savingCustomFields} className="bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
                {savingCustomFields ? 'Saving...' : 'Save Custom Fields'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents 섹션 */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row justify-between items-center pb-3">
          <CardTitle className="text-sm font-medium text-gray-700">Documents</CardTitle>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={uploadDocument}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2 text-xs"
            >
              <Upload size={13} />
              {uploading ? 'Uploading...' : 'Upload File'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.name} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-indigo-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-800 truncate max-w-xs">
                        {doc.name.replace(/^\d+_/, '')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadDocument(doc.name)}
                      className="text-gray-400 hover:text-indigo-500 transition-colors"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.name)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 서비스 기록 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Service History</h2>
        <Button onClick={() => setShowForm(!showForm)}>+ Log Service</Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <Label>Service Type *</Label>
              <Input value={form.service_type} onChange={e => setForm({...form, service_type: e.target.value})} placeholder="Food Assistance" />
            </div>
            <div>
              <Label>Service Date</Label>
              <Input type="date" value={form.service_date} onChange={e => setForm({...form, service_date: e.target.value})} />
            </div>
            <div>
              <Label>Staff Name</Label>
              <Input value={form.staff_name} onChange={e => setForm({...form, staff_name: e.target.value})} placeholder={currentUserEmail || 'Staff A'} />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="e.g. Client mentioned she hasn't eaten today." />
              <p className="text-xs text-gray-400 mt-1">💡 AI will auto-detect follow-ups</p>
            </div>
            <div className="col-span-2 flex gap-2">
              <Button onClick={saveService}>Save</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {services.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No services logged yet.</div>
      ) : (
        <div className="space-y-3">
          {services.map(s => (
            <Card key={s.id}>
              <CardContent className="p-4">
                {editingId === s.id ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Service Type</Label>
                      <Input value={editForm.service_type} onChange={e => setEditForm({...editForm, service_type: e.target.value})} />
                    </div>
                    <div>
                      <Label className="text-xs">Date</Label>
                      <Input type="date" value={editForm.service_date} onChange={e => setEditForm({...editForm, service_date: e.target.value})} />
                    </div>
                    <div>
                      <Label className="text-xs">Staff Name</Label>
                      <Input value={editForm.staff_name} onChange={e => setEditForm({...editForm, staff_name: e.target.value})} />
                    </div>
                    <div>
                      <Label className="text-xs">Notes</Label>
                      <Input value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} />
                    </div>
                    <div className="col-span-2 flex gap-2 mt-1">
                      <Button size="sm" onClick={saveEdit}><Check size={14} className="mr-1" /> Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X size={14} className="mr-1" /> Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{s.service_type}</p>
                      <p className="text-sm text-gray-500">{s.notes}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-right text-sm text-gray-400">
                        <p>{s.service_date}</p>
                        <p>{s.staff_name}</p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button onClick={() => startEdit(s)} className="text-gray-300 hover:text-indigo-500 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteService(s.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}