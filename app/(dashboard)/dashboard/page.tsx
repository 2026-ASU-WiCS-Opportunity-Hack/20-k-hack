"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import { downloadCSV, exportToCSV } from '@/lib/csv-utils'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const [totalClients, setTotalClients] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [serviceByType, setServiceByType] = useState<any[]>([]);
  const [serviceByMonth, setServiceByMonth] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

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

      // export용 clients 데이터
      const { data: clientData } = await supabase
        .from("clients")
        .select("name, date_of_birth, phone, email, household_size, language, notes")
        .order("created_at", { ascending: false });
      setClients(clientData || []);
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

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📊 Dashboard</h1>
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Exporting…" : "Export Clients CSV"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border rounded-lg p-6 text-center">
          <p className="text-gray-500 text-sm">Total Clients</p>
          <p className="text-4xl font-bold mt-1">{totalClients}</p>
        </div>
        <div className="border rounded-lg p-6 text-center">
          <p className="text-gray-500 text-sm">Total Services</p>
          <p className="text-4xl font-bold mt-1">{totalServices}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Services by Type</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={serviceByType}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Services Over Time</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={serviceByMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}