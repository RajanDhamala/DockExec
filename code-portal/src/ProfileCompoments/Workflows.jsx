

import { useEffect, useMemo, useState } from "react"
import { Play, Pause, MoreHorizontal, Filter, Search, CheckCircle, XCircle, Zap, RefreshCw, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { DashboardLayout } from "./DashboardLayout"
import LogsDialog from "./LogsDialog"
import {
  getAvgProblemLogs,
  deleteAvgProblem,
  getPrintLogs,
  deletePrint,
  getProgrammizOutput,
  ApideleteProgrammiz
} from "./HelperFxns.js";
import axios from "axios"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import useSocketStore from "@/ZustandStore/SocketStore"

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-800 ${className}`} />
)

export default function WorkflowsPage() {
  const queryClient = useQueryClient(); // access query client

  const [dialog, setDialog] = useState({
    open: false,
    type: null,
    id: null,
  });

  const { clientId, isConnected } = useSocketStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("workflows")
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light"
    return localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  })
  const [fetchedTabs, setFetchedTabs] = useState({ workflows: false, runs: false, templates: false })

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"))

  const openLogs = (type, id) => {
    setDialog({ open: true, type, id });
  };

  const closeLogs = () => {
    setDialog({ open: false, type: null, id: null });
  };

  const { mutate: DeleteAvg } = useMutation({
    mutationFn: (problemId) => deleteAvgProblem(problemId), // receive it when called
    onSuccess: (_, problemId) => {
      console.log("Successfully deleted:", problemId);
      queryClient.setQueryData(["avgTestCase", "data"], (oldData) =>
        oldData.filter((item) => item.problemId !== problemId)
      );
    },
  });

  const handleDeleteAvg = (problemId) => {
    console.log("i got del req", problemId)
    DeleteAvg(problemId); // parameter passed here
  };

  const { mutate: DeletePrint } = useMutation({
    mutationFn: (runId) => deletePrint(runId),
    onSuccess: (_, runId) => {
      console.log("Successfully deleted:", runId);

      queryClient.setQueryData(["RecentPrint", "runs"], (oldData) =>
        oldData.filter((item) => item._id !== runId)
      );
    },
  });

  const handleDeletePrint = (runId) => {
    console.log("i got del req", runId);
    DeletePrint(runId);
  };

  const { mutate: deleteProgrammiz } = useMutation({
    mutationFn: (runId) => ApideleteProgrammiz(runId),
    onSuccess: (_, runId) => {
      console.log("Successfully deleted:", runId);

      queryClient.setQueryData(["rawExe", "programmiz"], (oldData) =>
        oldData.filter((item) => item._id !== runId)
      );
    },
  });

  const handleDeleteProgrammiz = (runId) => {
    console.log("i got del req", runId);
    deleteProgrammiz(runId);
  };


  const fetchAvgTestCaseStats = async () => {
    const response = await axios.get(`http://localhost:8000/profile/avgTeststats`, {
      withCredentials: true
    })
    return response.data.data
  }

  const fetchRecentPrintRuns = async () => {
    const response = await axios.get(`http://localhost:8000/profile/printCases`, {
      withCredentials: true
    })
    return response.data.data
  }

  const fetchRawExecution = async () => {
    const response = await axios.get(`http://localhost:8000/profile/programmizLogs`, {
      withCredentials: true
    })
    return response.data.data
  }

  const reRunPrint = async (runId) => {
    console.log("run id:", runId)
    if (!isConnected) {
      console.log("no socket id return now")
      return
    }
    console.log("socket id:", clientId)
    const data = axios.get(`http://localhost:8000/profile/printCase_id/${runId}`, {
      withCredentials: true
    });
    return data.data
  }

  const reRunProgrammiz = async (runId) => {
    console.log("run id:", runId)
    if (!isConnected) {
      console.log("no socket id return now")
      return
    }
    console.log("scoekt id:", clientId)
    const data = axios.get(`http://localhost:8000/profile/reRunProgrammiz/${runId}`, {
      withCredentials: true
    });
    return data.data
  }

  const {
    data: RecentPrintData,
    isFetching: RecentPrintLoading,
    isError: RecentPrintError,
    refetch: refetchRecentPrint,
  } = useQuery({
    queryKey: ["RecentPrint", "runs"],
    queryFn: fetchRecentPrintRuns,
    enabled: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: AvgTestCasedata,
    isFetching: AvgTestLoading,
    isError: AvgTestError,
    refetch: refetchAvgTest,
  } = useQuery({
    queryKey: ["avgTestCase", "data"],
    queryFn: fetchAvgTestCaseStats,
    enabled: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: RawExeData,
    isFetching: RawExeLoading,
    isError: RawExeError,
    refetch: refetchRawExe,
  } = useQuery({
    queryKey: ["rawExe", "programmiz"],
    queryFn: fetchRawExecution,
    enabled: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
  })

  const normalizedWorkflows = useMemo(() => (Array.isArray(AvgTestCasedata) ? AvgTestCasedata : AvgTestCasedata?.data || []), [AvgTestCasedata])
  const normalizedRecentPrints = useMemo(() => (Array.isArray(RecentPrintData) ? RecentPrintData : RecentPrintData?.data || []), [RecentPrintData])
  const normalizedRawExe = useMemo(() => (Array.isArray(RawExeData) ? RawExeData : RawExeData?.data || []), [RawExeData])

  const filteredWorkflows = useMemo(
    () =>
      normalizedWorkflows.filter(
        (workflow) =>
          workflow.problemTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          workflow.problemDescription?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [normalizedWorkflows, searchQuery]
  )

  useEffect(() => {
    const trigger = async () => {
      if (activeTab === "workflows" && !fetchedTabs.workflows) {
        await refetchAvgTest()
        setFetchedTabs((prev) => ({ ...prev, workflows: true }))
      }
      if (activeTab === "runs" && !fetchedTabs.runs) {
        await refetchRecentPrint()
        setFetchedTabs((prev) => ({ ...prev, runs: true }))
      }
      if (activeTab === "templates" && !fetchedTabs.templates) {
        await refetchRawExe()
        setFetchedTabs((prev) => ({ ...prev, templates: true }))
      }
    }
    trigger()
  }, [activeTab, fetchedTabs, refetchAvgTest, refetchRecentPrint, refetchRawExe])

  const formatDuration = (seconds) => {
    if (seconds === undefined || seconds === null || seconds === "") return "-"
    const numeric = Number(seconds)
    if (!Number.isNaN(numeric)) return `${numeric.toFixed(3)}s`
    return `${seconds}`
  }

  const formatDate = (date) => {
    if (!date) return "-"
    const parsed = new Date(date)
    return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString()
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <LogsDialog
          open={dialog.open}
          type={dialog.type}
          id={dialog.id}
          onClose={closeLogs}
        />
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Executions</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Manage and monitor your code executions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 bg-transparent border-gray-200 text-gray-900 dark:border-slate-700 dark:text-slate-100"
              size="sm"
            >
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-transparent border-gray-200 text-gray-900 dark:border-slate-700 dark:text-slate-100"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 min-w-[240px] max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white text-gray-900 border-gray-200 placeholder:text-gray-400 dark:bg-gray-800 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-gray-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>4 Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>1 Paused</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>1 Error</span>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-slate-200 border border-gray-200 dark:border-slate-700">
            <TabsTrigger
              value="workflows"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-slate-100"
            >
              All Workflows
            </TabsTrigger>
            <TabsTrigger
              value="runs"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-slate-100"
            >
              Recent Runs
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-slate-100"
            >
              Programmiz
            </TabsTrigger>
          </TabsList>


          <TabsContent value="workflows" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Recent Problems</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">Loaded only when you view this tab</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 bg-transparent border-gray-200 text-gray-900 dark:border-slate-700 dark:text-slate-100"
                  onClick={() => refetchAvgTest()}
                  disabled={AvgTestLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${AvgTestLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {AvgTestLoading && (
                <>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <Card key={idx} className="border-gray-200 dark:border-slate-800 bg-white dark:bg-gray-900/80">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-full" />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <Skeleton className="h-4" />
                              <Skeleton className="h-4" />
                              <Skeleton className="h-4" />
                              <Skeleton className="h-4" />
                            </div>
                          </div>
                          <Skeleton className="h-9 w-9" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}

              {!AvgTestLoading && AvgTestError && (
                <div className="col-span-full text-center py-6 text-red-600 dark:text-red-400">
                  Failed to load data. Try refreshing.
                </div>
              )}

              {!AvgTestLoading && !AvgTestError && normalizedWorkflows.length > 0 && (
                filteredWorkflows.map((workflow) => (
                  <Card key={workflow.problemId || workflow._id || Math.random()} className="border-gray-200 dark:border-slate-800 bg-white dark:bg-gray-900/80">
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-50">{workflow.problemTitle}</h3>
                            <Badge
                              variant="secondary"
                              className={
                                workflow.status === "error"
                                  ? "bg-red-100 text-red-700"
                                  : workflow.status === "paused"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                              }
                            >
                              {workflow.status === "active" && <CheckCircle className="w-3 h-3 mr-1" />}
                              {workflow.status === "paused" && <Pause className="w-3 h-3 mr-1" />}
                              {workflow.status === "error" && <XCircle className="w-3 h-3 mr-1" />}
                              {workflow.status ? workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1) : "Active"}
                            </Badge>
                          </div>

                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{workflow.problemDescription || "No description available."}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Last Run</span>
                              <div className="font-medium">{workflow.lastRun || "-"}</div>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Total Attempts</span>
                              <div className="font-medium">{workflow.totalAttempts ?? "-"}</div>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Success Rate</span>
                              <div className="font-medium">{workflow.successRate || "-"}</div>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Avg Duration</span>
                              <div className="font-medium">{workflow.avgDuration || "-"}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start">
                          {workflow.status === "active" && (
                            <Button size="sm" variant="outline" className="gap-2 bg-transparent border-gray-200 text-gray-900 dark:border-slate-700 dark:text-slate-100">
                              <Pause className="w-3 h-3" />
                              Pause
                            </Button>
                          )}
                          {workflow.status === "paused" && (
                            <Button size="sm" variant="outline" className="gap-2 bg-transparent border-gray-200 text-gray-900 dark:border-slate-700 dark:text-slate-100">
                              <Play className="w-3 h-3" />
                              Resume
                            </Button>
                          )}
                          {workflow.status === "error" && (
                            <Button size="sm" variant="outline" className="gap-2 bg-transparent border-gray-200 text-gray-900 dark:border-slate-700 dark:text-slate-100">
                              <Zap className="w-3 h-3" />
                              Retry
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-gray-700 dark:text-slate-100">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openLogs("avgTestCase", workflow.problemId)}>View Logs</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteAvg(workflow.problemId)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              {!AvgTestLoading && !AvgTestError && normalizedWorkflows.length === 0 && (
                <div className="col-span-full text-center py-6 text-gray-500 dark:text-slate-300">No recent problems found.</div>
              )}

              {!AvgTestLoading && !AvgTestError && normalizedWorkflows.length > 0 && filteredWorkflows.length === 0 && (
                <div className="col-span-full text-center py-6 text-gray-500 dark:text-slate-300">No problems match your search.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="runs" className="space-y-6">
            <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-gray-900/80">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-slate-100">Recent Workflow Runs</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-slate-300">Monitor the latest workflow executions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 bg-transparent border-gray-200 text-gray-900 dark:border-slate-700 dark:text-slate-100"
                    onClick={() => refetchRecentPrint()}
                    disabled={RecentPrintLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${RecentPrintLoading ? "animate-spin" : ""}`} />
                    Load runs
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-900">
                        <TableHead className="text-gray-700 dark:text-slate-200">Run ID</TableHead>
                        <TableHead className="text-gray-700 dark:text-slate-200">Name</TableHead>
                        <TableHead className="text-gray-700 dark:text-slate-200">Status</TableHead>
                        <TableHead className="text-gray-700 dark:text-slate-200">Duration</TableHead>
                        <TableHead className="text-gray-700 dark:text-slate-200">Date</TableHead>
                        <TableHead className="text-gray-700 dark:text-slate-200">Language</TableHead>
                        <TableHead className="text-gray-700 dark:text-slate-200">Output</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {RecentPrintLoading &&
                        Array.from({ length: 4 }).map((_, idx) => (
                          <TableRow key={`recent-skeleton-${idx}`}>
                            <TableCell colSpan={8} className="py-4">
                              <div className="flex items-center gap-4">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-14" />
                                <Skeleton className="h-4 w-32" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}

                      {!RecentPrintLoading && RecentPrintError && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6 text-red-600 dark:text-red-400">
                            Failed to load runs. Try again.
                          </TableCell>
                        </TableRow>
                      )}

                      {!RecentPrintLoading && !RecentPrintError &&
                        normalizedRecentPrints.map((run) => (
                          <TableRow key={run._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <TableCell className="font-mono text-xs text-gray-900 dark:text-slate-100">{run._id?.slice(0, 8)}…</TableCell>
                            <TableCell className="font-medium text-gray-900 dark:text-slate-100">{run.problemid?.title || "-"}</TableCell>
                            <TableCell>
                              {run.status === "success" && (
                                <Badge className="bg-green-100 text-green-700">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Success
                                </Badge>
                              )}
                              {run.status === "failed" && (
                                <Badge className="bg-red-100 text-red-700">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                              {run.status === "running" && (
                                <Badge className="bg-blue-100 text-blue-700">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
                                  Running
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-900 dark:text-slate-100">{formatDuration(run.execution_time)}</TableCell>
                            <TableCell className="text-gray-600 dark:text-slate-300">{formatDate(run.createdAt)}</TableCell>
                            <TableCell className="text-gray-600 dark:text-slate-300">{run.language || "-"}</TableCell>
                            <TableCell className="text-gray-600 dark:text-slate-300">{run.output ? `${run.output.slice(0, 30)}…` : "—"}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-700 dark:text-slate-100">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">

                                  <DropdownMenuItem onClick={() => openLogs("printCase", run._id)}>View Logs</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => reRunPrint(run._id)}>Re-run</DropdownMenuItem>

                                  <DropdownMenuItem onClick={() => handleDeletePrint(run._id)}>Delete</DropdownMenuItem>

                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}

                      {!RecentPrintLoading && !RecentPrintError && normalizedRecentPrints.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6 text-gray-500 dark:text-slate-300">
                            No recent runs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-gray-900/80">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-slate-100">Recent RawExecution Runs</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-slate-300">Monitor the latest raw executions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 bg-transparent border-gray-200 text-gray-900 dark:border-slate-700 dark:text-slate-100"
                    onClick={() => refetchRawExe()}
                    disabled={RawExeLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${RawExeLoading ? "animate-spin" : ""}`} />
                    Load programmiz
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-900">
                        <TableHead className="text-gray-700 dark:text-slate-200">Run ID</TableHead>
                        <TableHead className="text-gray-700 dark:text-slate-200">Language</TableHead>
                        <TableHead className="text-gray-700 dark:text-slate-200">Status</TableHead>
                        <TableHead className="text-gray-700 dark:text-slate-200">Duration</TableHead>
                        <TableHead className="text-gray-700 dark:text-slate-200">Date</TableHead>
                        <TableHead className="text-gray-700 dark:text-slate-200">Output</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {RawExeLoading &&
                        Array.from({ length: 4 }).map((_, idx) => (
                          <TableRow key={`raw-skeleton-${idx}`}>
                            <TableCell colSpan={7} className="py-4">
                              <div className="flex items-center gap-4">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-14" />
                                <Skeleton className="h-4 w-28" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}

                      {!RawExeLoading && RawExeError && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6 text-red-600 dark:text-red-400">
                            Failed to load programmiz runs.
                          </TableCell>
                        </TableRow>
                      )}

                      {!RawExeLoading && !RawExeError &&
                        normalizedRawExe.map((run) => (
                          <TableRow key={run._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <TableCell className="font-mono text-xs text-gray-900 dark:text-slate-100">{run._id?.slice(0, 8)}…</TableCell>
                            <TableCell className="font-medium text-gray-900 dark:text-slate-100">{run.language || "-"}</TableCell>
                            <TableCell>
                              {run.status === "success" && (
                                <Badge className="bg-green-100 text-green-700">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Success
                                </Badge>
                              )}
                              {run.status === "failed" && (
                                <Badge className="bg-red-100 text-red-700">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                              {run.status === "running" && (
                                <Badge className="bg-blue-100 text-blue-700">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
                                  Running
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-900 dark:text-slate-100">{formatDuration(run.execution_time)}</TableCell>
                            <TableCell className="text-gray-600 dark:text-slate-300">{formatDate(run.createdAt)}</TableCell>
                            <TableCell className="text-gray-600 dark:text-slate-300">{run.output ? `${run.output.slice(0, 30)}…` : "—"}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-700 dark:text-slate-100">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openLogs("programmizCase", run._id)}>View Logs</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => reRunProgrammiz(run._id)}>Re-run</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteProgrammiz(run._id)}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}

                      {!RawExeLoading && !RawExeError && normalizedRawExe.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6 text-gray-500 dark:text-slate-300">
                            No programmiz runs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
