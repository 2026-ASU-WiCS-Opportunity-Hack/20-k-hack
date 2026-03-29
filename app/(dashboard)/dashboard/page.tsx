"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart
} from "recharts";
import { downloadCSV, exportToCSV } from '@/lib/csv-utils'
import { Download, Users, Activity, TrendingUp, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const [totalClients, setTotalClients] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [serviceByType, setServiceByType] = useState<any[]>([]);
  const [serviceByMonth, setServiceByMonth] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);

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

        setServiceByType(
          Object.entries(typeCount).map(([name, count]) => ({ name, count }))
        );
        setServiceByMonth(
          Object.entries(monthCount)
            .sort()
            .map(([month, count]) => ({ month, count }))
        );
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
    } finally {
      setExporting(false)
    }
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
    <div className="p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Operations Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
          className="gap-2 text-sm"
        >
          <Download size={14} />
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
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

      {/* 차트 영역 */}
      <div className="grid grid-cols-2 gap-4">

        {/* Services Over Time */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Services Over Time</h2>
              <p className="text-xs text-gray-400 mt-0.5">Monthly service delivery trend</p>
            </div>
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

        {/* Services by Type */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm col-span-2">
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
    </div>
  );
}