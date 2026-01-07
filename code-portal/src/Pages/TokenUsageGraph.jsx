import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fetchMeteredUsage = async ({ queryKey }) => {
  const [_key, year, month] = queryKey;
  const res = await axios.get(`http://localhost:8000/token/graph?month=${month}&year=${year}`, { withCredentials: true });
  if (!res.data.success) throw new Error("Failed to fetch usage data");

  return res.data.data.map(item => ({
    day: item.day,
    usage: item.totalTokens,
  }));
};

const MeteredUsageGraph = () => {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(1);

  const { data = [], isLoading } = useQuery({
    queryKey: ["meteredUsage", year, month],
    queryFn: fetchMeteredUsage,
  });

  const daysInMonth = new Date(year, month, 0).getDate();

  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const dayData = data.find(d => d.day === i + 1);
    return {
      date: i + 1,
      usage: dayData ? dayData.usage : 0,
    };
  });

  return (
    <div className="bg-gray-950 rounded-xl p-6 w-full max-w-5xl mx-auto border border-gray-800">
      <div className="flex space-x-2 mb-4">
        {/* Month Selector */}
        <Select value={`${month}`} onValueChange={val => setMonth(Number(val))}>
          <SelectTrigger className="w-32 bg-gray-800 border border-gray-700 text-white">
            <SelectValue placeholder="Select Month" className="text-white data-[placeholder]:text-gray-400" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white">
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i + 1} value={`${i + 1}`} className="text-white hover:bg-gray-700">
                {new Date(0, i).toLocaleString("en-US", { month: "long" })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Year Selector */}
        <Select value={`${year}`} onValueChange={val => setYear(Number(val))}>
          <SelectTrigger className="w-32 bg-gray-800 border border-gray-700 text-white">
            <SelectValue placeholder="Select Year" className="text-white data-[placeholder]:text-gray-400" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white">
            {Array.from({ length: 5 }, (_, i) => 2026 - i).map(y => (
              <SelectItem key={y} value={`${y}`} className="text-white hover:bg-gray-700">{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="w-full h-80 bg-gray-800 animate-pulse rounded-lg"></div>

      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="0" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="usage" stroke="#6366f1" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default MeteredUsageGraph;
