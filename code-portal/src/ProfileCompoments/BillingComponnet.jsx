import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Billing = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch token usage summary
  const fetchTokenData = async () => {
    const { data } = await axios.get("http://localhost:8000/token", { withCredentials: true });
    return {
      monthlyLimit: Number(data.data.monthlyLimit),
      tokenUsed: Number(data.data.tokenUsed),
      cycleStartsAt: data.data.cycleStartsAt,
      cycleEndsAt: data.data.cycleEndsAt,
    };
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tokenData"],
    queryFn: fetchTokenData,
  });

  const monthlyLimit = data?.monthlyLimit || 0;
  const tokenUsed = data?.tokenUsed || 0;
  const remainingCredits = monthlyLimit - tokenUsed;
  const usagePercentage = monthlyLimit ? (tokenUsed / monthlyLimit) * 100 : 0;

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const tokensToDollar = (tokens) => `$${(tokens / 10000).toFixed(2)}`;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white"> Billing & Subscription
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">    Manage your subscription and billing information
          </p>
        </div>
      </div>

      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-slate-700 shadow-sm">
        <CardContent className="space-y-6">
          {/* Current Plan */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Current Plan</h3>
            <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-lg text-gray-900 dark:text-white">Free Plan</div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Active
                </Badge>
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                Free 30$ credit per month • resets monthly •
              </div>

              {/* Usage Summary Bar */}
              {!isLoading && !isError && (
                <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-1 text-sm text-gray-700 dark:text-gray-300">
                    <span>Tokens Used</span>
                    <span>{tokenUsed} / {monthlyLimit}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-1">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Remaining: {remainingCredits}</span>
                    <span>Cycle ends: {formatDate(data?.cycleEndsAt)}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Approx value: {tokensToDollar(tokenUsed)}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300"
                  onClick={() => setIsDrawerOpen(true)}
                >
                  View Graph
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300"
                  onClick={() => toast.error("Request more feature coming soon")}
                >
                  Request more
                </Button>
              </div>
            </div>
          </div>

          {/* Drawer with full graph */}
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} side="right" size="lg">
            <DrawerContent className="bg-gray-950 p-4">
              <DrawerHeader className="flex justify-between items-center">
                <DrawerTitle className="text-white">Token Usage</DrawerTitle>
                <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>Close</Button>
              </DrawerHeader>
              <div className="mt-4">
                <MeteredUsageGraph />
              </div>
            </DrawerContent>
          </Drawer>

          {/* Pro Plan */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Pro Plan</h3>
            <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-lg text-gray-900 dark:text-white">Pro Plan</div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Upgrade
                </Badge>
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                $8/month • Billed monthly • Unlimited token limit
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300"
                >
                  Get Now
                </Button>
              </div>
            </div>
          </div>

          {/* Billing History */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Billing History</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-700 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">No payments History</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// Metered Usage Graph
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

export default Billing;
