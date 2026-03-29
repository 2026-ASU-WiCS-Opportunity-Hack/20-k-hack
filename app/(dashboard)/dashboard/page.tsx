"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart
} from "recharts";
import { downloadCSV, exportToCSV } from '@/lib/csv-utils'
import { Download, Users, Activity, TrendingUp, Calendar, FileText, X, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const [totalClients, setTotalClients] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [serviceByType, setServiceByType] = useState<any[]>([]);
  const [serviceByMonth, setServiceByMonth] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Funder Report
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedQuarter, setSelectedQuarter] = useState('Q1')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [generatingReport, setGeneratingReport] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { count: clientCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });
      setTotalClients(clientCount || 0);

      const { count: serviceCount } = await supabase
        .from("service_entries")
        .select("*", { count: "exact", head: true });
      setTotalServices(serviceCount || 0);

      const { data: services } = await supabase
        .from("service_entries")
        .select("service_type, service_date");

      if (services) {
        const typeCount: Record<string, number> = {};
        const monthCount: Record<string, number> = {};

        services.forEach((s) => {
          typeCount[s.service_type] = (typeCount[s.service_type] || 0) + 1;
          const month = s.service_date?.slice(0, 7);
          if (month) monthCount[month] = (monthCount[month] || 0) + 1;
        });

        setServiceByType(Object.entries(typeCount).map(([name, count]) => ({ name, count })));
        setServiceByMonth(Object.entries(monthCount).sort().map(([month, count]) => ({ month, count })));
      }

      const { data: clientData } = await supabase
        .from("clients")
        .select("name, date_of_birth, phone, email, household_size, language, notes")
        .order("created_at", { ascending: false });
      setClients(clientData || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleExport = async () => {
    setExporting(true)
    try {
      const csv = exportToCSV(clients)
      downloadCSV(csv, `safecase_clients_${new Date().toISOString().slice(0, 10)}.csv`)
    } finally { setExporting(false) }
  }

  const generateReport = async () => {
    setGeneratingReport(true)
    setReport(null)
    try {
      const res = await fetch('/api/funder-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quarter: selectedQuarter, year: parseInt(selectedYear) })
      })
      const data = await res.json()
      setReport(data.report)
    } finally { setGeneratingReport(false) }
  }

  const copyReport = () => {
    if (!report) return
    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const avgPerMonth = serviceByMonth.length > 0
    ? Math.round(serviceByMonth.reduce((a, b) => a + b.count, 0) / serviceByMonth.length)
    : 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs">
          <p className="text-gray-400 mb-1">{label}</p>
          <p className="text-indigo-400 font-semibold">{payload[0].value} services</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Operations Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => { setShowReportModal(true); setReport(null) }}
            className="gap-2 text-sm"
          >
            <FileText size={14} />
            <span className="hidden sm:inline">Funder Report</span>
            <span className="sm:hidden">Report</span>
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={exporting} className="gap-2 text-sm">
            <Download size={14} />
            <span className="hidden sm:inline">{exporting ? "Exporting…" : "Export CSV"}</span>
          </Button>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium">Total Clients</p>
            <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Users size={13} className="text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
          <p className="text-xs text-green-600 mt-1">● Active</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium">Total Services</p>
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <Activity size={13} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalServices}</p>
          <p className="text-xs text-gray-400 mt-1">All time</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium">Avg / Month</p>
            <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={13} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgPerMonth}</p>
          <p className="text-xs text-gray-400 mt-1">Services</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium">Service Types</p>
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
              <Calendar size={13} className="text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{serviceByType.length}</p>
          <p className="text-xs text-gray-400 mt-1">Categories</p>
        </div>
      </div>

      {/* 차트 */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Services Over Time</h2>
            <p className="text-xs text-gray-400 mt-0.5">Monthly service delivery trend</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={serviceByMonth}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Services by Type</h2>
            <p className="text-xs text-gray-400 mt-0.5">Distribution across service categories</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={serviceByType} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funder Report 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">Generate Funder Report</h3>
                <p className="text-xs text-gray-400 mt-0.5">AI-powered narrative report for grant applications</p>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* 분기 선택 */}
            {!report && (
              <div className="px-6 py-5">
                <p className="text-sm text-gray-600 mb-4">Select the reporting period:</p>
                <div className="flex gap-3 mb-6">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Quarter</label>
                    <select
                      value={selectedQuarter}
                      onChange={e => setSelectedQuarter(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    >
                      {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q}>{q}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Year</label>
                    <select
                      value={selectedYear}
                      onChange={e => setSelectedYear(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    >
                      {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <Button
                  onClick={generateReport}
                  disabled={generatingReport}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {generatingReport ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating report...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <FileText size={14} /> Generate {selectedQuarter} {selectedYear} Report
                    </span>
                  )}
                </Button>
              </div>
            )}

            {/* 리포트 결과 */}
            {report && (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="prose prose-sm max-w-none">
                    {report.split('\n').map((line, i) => {
                      if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold text-gray-900 mt-4 mb-2">{line.slice(2)}</h1>
                      if (line.startsWith('## ')) return <h2 key={i} className="text-base font-semibold text-gray-800 mt-4 mb-2">{line.slice(3)}</h2>
                      if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold text-gray-700 mt-3 mb-1">{line.slice(4)}</h3>
                      if (line.startsWith('- ')) return <p key={i} className="text-sm text-gray-600 ml-3">• {line.slice(2)}</p>
                      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-sm font-semibold text-gray-800">{line.slice(2, -2)}</p>
                      if (line.trim() === '') return <div key={i} className="h-2" />
                      return <p key={i} className="text-sm text-gray-600 leading-relaxed">{line}</p>
                    })}
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
                  <Button onClick={copyReport} variant="outline" className="gap-2 flex-1">
                    {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Report</>}
                  </Button>
                  <Button onClick={() => setReport(null)} variant="outline" className="flex-1">
                    Generate Another
                  </Button>
                  <Button onClick={() => setShowReportModal(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1">
                    Done
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}