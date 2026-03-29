'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Plus, X, Clock, User } from 'lucide-react'

type Appointment = {
  id: string
  client_id: string
  title: string
  appointment_date: string
  appointment_time: string
  staff_name: string
  notes: string
  status: string
  clients: { name: string } | null
}

type Client = {
  id: string
  name: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export default function CalendarPage() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    client_id: '', title: '', appointment_date: '',
    appointment_time: '', staff_name: '', notes: ''
  })

  useEffect(() => {
    fetchAppointments()
    fetchClients()
  }, [])

  const fetchAppointments = async () => {
    const res = await fetch('/api/appointments')
    const data = await res.json()
    setAppointments(data || [])
  }

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, name').order('name')
    setClients(data || [])
  }

  const saveAppointment = async () => {
    if (!form.title || !form.appointment_date) return
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, status: 'scheduled' })
    })
    setShowForm(false)
    setForm({ client_id: '', title: '', appointment_date: '', appointment_time: '', staff_name: '', notes: '' })
    fetchAppointments()
  }

  const deleteAppointment = async (id: string) => {
    if (!confirm('Delete this appointment?')) return
    await fetch('/api/appointments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchAppointments()
  }

  // 캘린더 날짜 계산
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = today.toISOString().split('T')[0]

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const getAppointmentsForDate = (dateStr: string) =>
    appointments.filter(a => a.appointment_date === dateStr)

  const selectedAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : []

  // 이번 주 upcoming appointments
  const weekLater = new Date(today)
  weekLater.setDate(weekLater.getDate() + 7)
  const upcoming = appointments.filter(a => {
    const d = new Date(a.appointment_date)
    return d >= today && d <= weekLater
  }).slice(0, 5)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{appointments.length} total appointments</p>
        </div>
        <Button
          onClick={() => {
            setForm(f => ({ ...f, appointment_date: selectedDate || todayStr }))
            setShowForm(true)
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          <Plus size={15} />
          New Appointment
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 캘린더 */}
        <div className="col-span-2">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <button onClick={prevMonth} className="text-gray-400 hover:text-gray-600">
                <ChevronLeft size={20} />
              </button>
              <h2 className="font-semibold text-gray-900">
                {MONTHS[month]} {year}
              </h2>
              <button onClick={nextMonth} className="text-gray-400 hover:text-gray-600">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS.map(d => (
                <div key={d} className="py-2 text-center text-xs font-medium text-gray-400">
                  {d}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 border-b border-r border-gray-50" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayAppts = getAppointmentsForDate(dateStr)
                const isToday = dateStr === todayStr
                const isSelected = dateStr === selectedDate

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                    className={`h-20 border-b border-r border-gray-50 p-1.5 cursor-pointer transition-colors
                      ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}
                    `}
                  >
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1
                      ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}
                    `}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayAppts.slice(0, 2).map(a => (
                        <div key={a.id} className="text-xs bg-indigo-100 text-indigo-700 rounded px-1 truncate">
                          {a.appointment_time?.slice(0, 5)} {a.title}
                        </div>
                      ))}
                      {dayAppts.length > 2 && (
                        <div className="text-xs text-gray-400">+{dayAppts.length - 2} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 사이드 패널 */}
        <div className="space-y-4">
          {/* 선택된 날짜 일정 */}
          {selectedDate && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
              <h3 className="font-medium text-gray-900 text-sm mb-3">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {selectedAppointments.length === 0 ? (
                <p className="text-xs text-gray-400">No appointments</p>
              ) : (
                <div className="space-y-2">
                  {selectedAppointments.map(a => (
                    <div key={a.id} className="bg-indigo-50 rounded-lg p-3 relative">
                      <button
                        onClick={() => deleteAppointment(a.id)}
                        className="absolute top-2 right-2 text-gray-300 hover:text-red-400"
                      >
                        <X size={13} />
                      </button>
                      <p className="font-medium text-sm text-gray-900 pr-4">{a.title}</p>
                      {a.clients?.name && (
                        <p className="text-xs text-indigo-600 mt-0.5 flex items-center gap-1">
                          <User size={11} /> {a.clients.name}
                        </p>
                      )}
                      {a.appointment_time && (
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Clock size={11} /> {a.appointment_time.slice(0, 5)}
                        </p>
                      )}
                      {a.notes && <p className="text-xs text-gray-400 mt-1">{a.notes}</p>}
                      <Badge className="mt-2 text-xs bg-green-100 text-green-700 hover:bg-green-100">
                        {a.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming this week */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
            <h3 className="font-medium text-gray-900 text-sm mb-3">Upcoming (7 days)</h3>
            {upcoming.length === 0 ? (
              <p className="text-xs text-gray-400">No upcoming appointments</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(a => (
                  <div key={a.id} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-indigo-600">
                        {new Date(a.appointment_date + 'T00:00:00').getDate()}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">{a.title}</p>
                      <p className="text-xs text-gray-400">{a.clients?.name} · {a.appointment_time?.slice(0, 5)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 예약 추가 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">New Appointment</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Title *</Label>
                <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Initial Consultation" />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Client</Label>
                <select
                  value={form.client_id}
                  onChange={e => setForm({...form, client_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="">Select client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Date *</Label>
                  <Input type="date" value={form.appointment_date} onChange={e => setForm({...form, appointment_date: e.target.value})} />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Time</Label>
                  <Input type="time" value={form.appointment_time} onChange={e => setForm({...form, appointment_time: e.target.value})} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Staff Name</Label>
                <Input value={form.staff_name} onChange={e => setForm({...form, staff_name: e.target.value})} placeholder="Staff A" />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Notes</Label>
                <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Optional notes..." />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveAppointment} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">Save</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}