"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";

export default function DashboardPage() {
  const [totalClients, setTotalClients] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [serviceByType, setServiceByType] = useState<any[]>([]);
  const [serviceByMonth, setServiceByMonth] = useState<any[]>([]);

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
    }
    fetchData();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">📊 Dashboard</h1>

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