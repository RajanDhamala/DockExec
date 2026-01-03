

import { useState } from "react"
import {
  Workflow,
  AlertTriangle,
  RefreshCw,
  MoreHorizontal,
  Filter,
  TrendingUp,
  CheckCircle,
  XCircle,
  ChevronDown,
  Plus,
  Users,
  Eye,
} from "lucide-react"
import { AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import LogsDialog from "./LogsDialog"
import { DelRecentProblem } from "./HelperFxns.js"
import useSocketStore from "@/ZustandStore/SocketStore";
import LocationDialog from "./LocationPage"
import toast from "react-hot-toast"

const chartData = [
  { name: "Jan", sales: 4000, views: 2400, workflows: 240 },
  { name: "Feb", sales: 3000, views: 1398, workflows: 221 },
  { name: "Mar", sales: 2000, views: 9800, workflows: 229 },
  { name: "Apr", sales: 2780, views: 3908, workflows: 200 },
  { name: "May", sales: 1890, views: 4800, workflows: 218 },
  { name: "Jun", sales: 2390, views: 3800, workflows: 250 },
  { name: "Jul", sales: 3490, views: 4300, workflows: 210 },
]

export default function Overview() {
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const queryClient = useQueryClient(); // access query client

  const { clientId, isConnected, socket, setCurrentJobId } = useSocketStore()

  const [dialog, setDialog] = useState({
    open: false,
    type: null,
    id: null,
  });
  const navigate = useNavigate()


  const fetchBasicMetrics = async () => {
    const response = await axios.get(`http://localhost:8000/users/Basicmetrics/${selectedPeriod}`, {
      withCredentials: true
    })
    return response.data.data
  }

  const { data: MetricsData, isLoading: MetricsLoading, isError: MetricsError } = useQuery({
    queryKey: ["Basicmetrics", `${selectedPeriod}`],
    queryFn: fetchBasicMetrics
  })


  const openLogs = (type, id) => {
    console.log("logs ui will be shown ok")
    setDialog({ open: true, type, id });
  };

  const closeLogs = () => {
    setDialog({ open: false, type: null, id: null })
  };

  const { mutate: deleteRecent } = useMutation({
    mutationFn: (runId) => DelRecentProblem(runId),
    onSuccess: (_, runId) => {
      console.log("Successfully deleted:", runId);
      queryClient.setQueryData(["recentExe", "data"], (oldData) =>
        oldData.filter((item) => item._id !== runId)
      );
    },
  });

  const handleDeleteRecent = (runId) => {
    console.log("i got del req", runId);
    deleteRecent(runId);
  };


  const reRunRecent = async (runId) => {
    console.log("Run ID:", runId);
    if (!isConnected || !socket) {
      console.log("Socket not connected yet, returning...");
      return;
    }
    console.log("Socket ID:", socket.id);

    try {
      const { data } = await axios.get(
        `http://localhost:8000/profile/reRunrecentExe/${runId}/${socket.id}`,
        { withCredentials: true }
      );
      toast.success("Successfully re-run code");
      console.log("Successfully re-run code, jobId:", data.data);
      setCurrentJobId(data.data);

      return data.data; // return jobId
    } catch (error) {
      console.error("Error while re-running code:", error);
      toast.error("Failed while re-executing code");
    }
  };


  const fetchRecentExecutions = async () => {
    const request = await axios.get(`http://localhost:8000/profile/recentExe`, {
      withCredentials: true
    })
    return request.data.data
  }

  const { data: recentExcData, isError: recentError, isLoading: isRecentLoading } = useQuery({
    queryKey: ["recentExe", "data"],
    queryFn: fetchRecentExecutions
  });

  // Transform API data to table-friendly format
  const tableData = recentExcData?.map(item => ({
    id: item._id, // first 4 characters of ID
    name: item.name || "Unknown Problem",
    started: new Date(item.createdAt).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    duration: item.firstTestCaseDuration + " ms", // placeholder or real duration
    status: item.passedNo === item.totalTestCases ? "success" : "failed",
    error: item.passedNo !== item.totalTestCases
      ? `${item.passedNo}/${item.totalTestCases} test cases passed`
      : null,
    firstTestCaseId: item.testCases?.[0]?._id || "-", // first test case ID if available
  }));

  const StartFreshCodeExe = () => {
    navigate("/leet")
  }

  const RerunLastFailedCase = async () => {
    console.log("we will be running last failed case ok man do u get it?")
  }

  const getRecentActivity = async () => {
    const response = await axios.get(`http://localhost:8000/profile/recentActivity`, {
      withCredentials: true
    })
    return response.data.data.MetaData.reverse()
  }

  const { data: activityData, isLoading: isActivityLoading, isError: isActivityError } = useQuery({
    queryKey: ["recentActivity"],
    queryFn: getRecentActivity
  })
  const formatRelativeTime = (dateString) => {
    const now = new Date()
    const past = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds} sec ago`
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} min ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
  }

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

  const [isLocation, setIsLocation] = useState(false)

  // Format as dollars
  const tokensToDollar = (tokens) => `$${(tokens / 10000).toFixed(2)}`;
  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  return (
    <>
      <LogsDialog
        open={dialog.open}
        type={dialog.type}
        id={dialog.id}
        onClose={closeLogs}
      />

      <main className="flex-1 p-4 md:p-8 bg-gray-50  dark:bg-gray-950 transition-colors duration-200">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard Overview</h1>
              <p className="text-gray-600 dark:text-slate-400 mt-1">Monitor your workflows and system performance</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-transparent border-gray-200 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-gray-800 flex-1 md:flex-none justify-center">
                    Last {selectedPeriod} days <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="dark:bg-gray-900 dark:border-slate-700">
                  <DropdownMenuItem className="dark:text-slate-300 dark:focus:bg-gray-800" onClick={() => setSelectedPeriod(7)}>Last 7 days</DropdownMenuItem>
                  <DropdownMenuItem className="dark:text-slate-300 dark:focus:bg-gray-800" onClick={() => setSelectedPeriod(30)}>Last 30 days</DropdownMenuItem>
                  <DropdownMenuItem className="dark:text-slate-300 dark:focus:bg-gray-800" onClick={() => setSelectedPeriod(90)}>Last 90 days</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white flex-1 md:flex-none" onClick={(e) => setIsLocation(true)}>

                <Plus className="w-4 h-4 mr-2" />
                Update Location
              </Button>
            </div>
          </div>
          <LocationDialog
            open={isLocation}
            onClose={() => setIsLocation(false)}
          >
          </LocationDialog>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-gray-200 bg-white dark:bg-gray-900 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-4" onClick={StartFreshCodeExe}>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div >
                  <h3 className="font-medium text-gray-900 dark:text-white">New workflow</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Start a fresh code execution</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-gray-200 bg-white dark:bg-gray-900 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">View breaches</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Check failed TestCases </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-gray-200 bg-white dark:bg-gray-900 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div onClick={RerunLastFailedCase}>
                  <h3 className="font-medium text-gray-900 dark:text-white" >Re-run last failed</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Retry last failed TestCase</p>
                </div>
              </div>
            </Card>
          </div>
        </div>



        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {MetricsLoading ? (
            // Loading Skeleton
            Array(4)
              .fill(0)
              .map((_, index) => (
                <Card key={index} className="border-gray-200 bg-white dark:bg-gray-900 dark:border-slate-700 shadow-sm animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                      <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                  </CardContent>
                </Card>
              ))
          ) : MetricsError ? (
            <div className="col-span-4 text-red-600 dark:text-red-400 text-center">
              Failed to load metrics. Please try again.
            </div>
          ) : (
            <>
              {/* Total Runs */}
              <Card className="border-gray-200 bg-white dark:bg-gray-900 dark:border-slate-700 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <Workflow className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                      <TrendingUp className="w-3 h-3" />
                      +{/* optional % change */}
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                    {MetricsData.totalruns}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">Total Runs</div>
                </CardContent>
              </Card>

              {/* Acceptance Rate */}
              <Card className="border-gray-200 bg-white dark:bg-gray-900 dark:border-slate-700 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                      <TrendingUp className="w-3 h-3" />
                      +{/* optional % change */}
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                    {((MetricsData?.totalruns - MetricsData.failed?.count) / MetricsData?.totalruns * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">Acceptance Rate</div>
                </CardContent>
              </Card>

              {/* Top 2 Languages */}

              {/* Top 2 Languages */}
              <Card className="border-gray-200 bg-white dark:bg-gray-900 dark:border-slate-700 shadow-sm">
                <CardContent className="p-6">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    Most Used Language
                  </div>

                  <div className="text-sm text-gray-600 dark:text-slate-400 space-y-1">
                    {MetricsData.topLanguages.slice(0, 2).map(lang => (
                      <div key={lang._id} className="flex justify-between">
                        <span>{lang._id}</span>
                        <span className="font-medium">{lang.totalCount}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>



              {/* Your Activity */}
              <Card className="border-gray-200 bg-white dark:bg-gray-900 dark:border-slate-700 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                  </div>

                  <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                    {MetricsData.solvedCount > 0
                      ? MetricsData.solvedCount
                      : "0"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">
                    {MetricsData.solvedCount > 0
                      ? "Problems Solved"
                      : "No problems solved yet, start solving!"}
                  </div>
                </CardContent>
              </Card>

            </>
          )}
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-1 lg:col-span-2 space-y-8">
            {/* Charts Section */}
            <Card className="border-gray-200 bg-white dark:bg-gray-900 dark:border-slate-700 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-semibold dark:text-white">Performance Analytics</CardTitle>
                    <CardDescription className="dark:text-slate-400">Workflow execution trends and system metrics</CardDescription>
                  </div>
                  <Tabs defaultValue="workflows" className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-3 dark:bg-gray-800">
                      <TabsTrigger value="workflows" className="dark:data-[state=active]:bg-gray-700 dark:text-slate-300">Workflows</TabsTrigger>
                      <TabsTrigger value="sales" className="dark:data-[state=active]:bg-gray-700 dark:text-slate-300">Sales</TabsTrigger>
                      <TabsTrigger value="views" className="dark:data-[state=active]:bg-gray-700 dark:text-slate-300">Views</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} className="dark:text-gray-400" />
                      <YAxis stroke="#6b7280" fontSize={12} className="dark:text-gray-400" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--tooltip-bg, white)",
                          borderColor: "var(--tooltip-border, #e5e7eb)",
                          color: "var(--tooltip-text, #1f2937)",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        wrapperClassName="dark:!bg-gray-800 dark:!border-slate-700 dark:!text-white"
                      />
                      <Area
                        type="monotone"
                        dataKey="workflows"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Workflow Status Table */}
            <Card className="border-gray-200 bg-white dark:bg-gray-900 dark:border-slate-700 shadow-sm overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-semibold dark:text-white">Recent Executions</CardTitle>
                    <CardDescription className="dark:text-slate-400">Monitor your code executions and performance</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none dark:border-slate-700 dark:text-slate-300 dark:hover:bg-gray-800">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none dark:border-slate-700 dark:text-slate-300 dark:hover:bg-gray-800">
                      <Eye className="w-4 h-4 mr-2" />
                      View All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableHead className="font-medium text-gray-700 dark:text-gray-300">Run ID</TableHead>
                      <TableHead className="font-medium text-gray-700 dark:text-gray-300">Execution</TableHead>
                      <TableHead className="font-medium text-gray-700 dark:text-gray-300">Started</TableHead>
                      <TableHead className="font-medium text-gray-700 dark:text-gray-300">Duration</TableHead>
                      <TableHead className="font-medium text-gray-700 dark:text-gray-300">Status</TableHead>
                      <TableHead className="font-medium text-gray-700 dark:text-gray-300">Error</TableHead>
                      <TableHead className="font-medium text-gray-700 dark:text-gray-300 w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isRecentLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 dark:text-slate-400">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : recentError ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-red-600 dark:text-red-400">
                          Failed to load recent executions
                        </TableCell>
                      </TableRow>
                    ) : tableData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-gray-500 dark:text-slate-500">
                          No recent executions
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableData.map((workflow) => (

                        <TableRow key={workflow.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-gray-100 dark:border-gray-800">
                          <TableCell className="font-mono text-sm dark:text-slate-300">{workflow.id.slice(0, 4)}</TableCell>
                          <TableCell className="font-medium dark:text-white">{workflow.name}</TableCell>
                          <TableCell className="text-gray-600 dark:text-slate-400">{workflow.started}</TableCell>
                          <TableCell className="text-gray-600 dark:text-slate-400">{workflow.duration}</TableCell>
                          <TableCell>
                            {workflow.status === "running" && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                                Running
                              </Badge>
                            )}
                            {workflow.status === "success" && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Success
                              </Badge>
                            )}
                            {workflow.status === "failed" && (
                              <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-slate-400 max-w-48 truncate">
                            {workflow.error || "None"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-8 h-8 dark:text-slate-400 dark:hover:text-white dark:hover:bg-gray-700">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="dark:bg-gray-900 dark:border-slate-700">
                                <DropdownMenuItem
                                  className="dark:text-slate-300 dark:focus:bg-gray-800"
                                  onClick={() => openLogs("recentCase", workflow.id)}>
                                  View Logs
                                </DropdownMenuItem>
                                <DropdownMenuItem className="dark:text-slate-300 dark:focus:bg-gray-800" onClick={() => reRunRecent(workflow.id)}>Re-run</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 dark:text-red-400 dark:focus:bg-gray-800" onClick={() => handleDeleteRecent(workflow.id)}>Delete</DropdownMenuItem>
                                <DropdownMenuSeparator className="dark:bg-gray-700" />
                                <DropdownMenuItem className="text-red-600 dark:text-red-400 dark:focus:bg-gray-800">Cancel</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Full width on mobile/tablet, side col on desktop */}
          <div className="space-y-6">
            {/* Account Balance */}
            <Card className="border-gray-200 bg-white dark:bg-gray-900 dark:border-slate-700 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold dark:text-white">Usage Credits</CardTitle>
              </CardHeader>

              <CardContent>
                {/* Remaining credits */}
                <div className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
                  {isLoading ? "Loading..." : isError ? "Error!" : remainingCredits}
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                  {isLoading
                    ? "Fetching token data..."
                    : isError
                      ? "Failed to load token info"
                      : "Remaining this month"}
                </p>


                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-slate-400">Monthly Free Credits</span>
                    <span className="text-sm font-medium dark:text-slate-200">
                      {isLoading || isError ? "--" : tokensToDollar(monthlyLimit)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-slate-400">Used This Month</span>
                    <span className="text-sm font-medium dark:text-slate-200">
                      {isLoading || isError ? "--" : tokensToDollar(tokenUsed)}
                    </span>
                  </div>

                  {/* Usage progress */}
                  <Progress value={usagePercentage} className="h-2 dark:bg-gray-700" />
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                  {isLoading
                    ? "Loading reset info..."
                    : isError
                      ? "Cannot load reset info"
                      : `Credits reset on ${formatDate(data.cycleEndsAt)}`}
                </p>
                {/* Info note */}
                <p className="text-xs text-gray-500 dark:text-slate-500 mb-2">
                  Credits reset automatically every month. No payment method required.
                </p>
                <div className="flex gap-2 mt-0.5">
                  <Button size="sm" className="flex-1 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                    Add Credit
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-gray-200 bg-white dark:bg-gray-900 dark:border-slate-700 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold dark:text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {isActivityLoading ? (
                    <div className="p-4 text-sm text-gray-500 dark:text-slate-400">Loading... </div>
                  ) : isActivityError ? (
                    <div className="p-4 text-sm text-red-500 dark:text-red-400">Failed to load activity</div>
                  ) : activityData && activityData.length > 0 ? (
                    activityData.map((activity, index) => (
                      <div
                        key={activity._id || index}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${activity.status === "success" ? "bg-green-500" : "bg-red-500"}`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 dark:text-slate-200 truncate">
                            {activity.title}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-slate-500">
                            {formatRelativeTime(activity.atTime)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-gray-500 dark:text-slate-400">No recent activity</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

    </>
  )
}
