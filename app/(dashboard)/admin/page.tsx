'use client'

import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, Clock, User, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type AuditLog = {
  id: string
  created_at: string
  user_email: string
  action: string
  record_id: string
  details: string
}

type Alert = {
  id: string
  created_at: string
  user_email: string
  message: string
  is_read: boolean
}

export default function AdminPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()

    // Supabase realtime 구독
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, () => {
        fetchData()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchData = async () => {
    const res = await fetch('/api/audit')
    const data = await res.json()
    setLogs(data.logs || [])
    setAlerts(data.alerts || [])
    setLoading(false)
  }

  const dismissAlert = async (id: string) => {
    await supabase.from('alerts').update({ is_read: true }).eq('id', id)
    fetchData()
  }

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Shield size={18} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Security & Audit</h1>
          <p className="text-sm text-gray-500">Real-time access monitoring</p>
        </div>
        {alerts.length > 0 && (
          <span className="ml-auto bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full animate-pulse">
            {alerts.length} Active Alert{alerts.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* 이상 감지 경고 */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map(alert => (
            <div key={alert.id} className="flex items-start justify-between bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Unusual Activity Detected</p>
                  <p className="text-sm text-red-600 mt-0.5">{alert.message}</p>
                  <p className="text-xs text-red-400 mt-1">{formatTime(alert.created_at)}</p>
                </div>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-red-400 hover:text-red-600 ml-4 flex-shrink-0"
                title="Dismiss"
              >
                <CheckCircle size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Access Today</p>
          <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Active Alerts</p>
          <p className="text-2xl font-bold text-red-600">{alerts.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Unique Users</p>
          <p className="text-2xl font-bold text-gray-900">
            {new Set(logs.map(l => l.user_email)).size}
          </p>
        </div>
      </div>

      {/* Audit Log 테이블 */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Live Access Log</span>
          </div>
          <span className="text-xs text-gray-400">Last 50 entries</span>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12 text-sm">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center text-gray-400 py-12 text-sm">
            No access logs yet. Logs will appear as staff access client records.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Time</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Action</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} className={`border-b border-gray-50 ${i === logs.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">
                    {formatTime(log.created_at)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User size={10} className="text-indigo-600" />
                      </div>
                      <span className="text-gray-700 text-xs">{log.user_email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}