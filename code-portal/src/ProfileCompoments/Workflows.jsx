

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
import LogsDialog from "./LogsDialog"
import {
  deleteAvgProblem,
  deletePrint,
  ApideleteProgrammiz
} from "./HelperFxns.js";
import axios from "axios"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import useSocketStore from "@/ZustandStore/SocketStore"
import toast from "react-hot-toast"

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-800 ${className}`} />
)

export default function WorkflowsPage() {
  const queryClient = useQueryClient();

  const [dialog, setDialog] = useState({
    open: false,
    type: null,
    id: null,
  });

  const { clientId, isConnected } = useSocketStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("workflows")

  const [fetchedTabs, setFetchedTabs] = useState({ workflows: false, runs: false, templates: false })


  const openLogs = (type, id) => {
    setDialog({ open: true, type, id });
  };

  const closeLogs = () => {
    setDialog({ open: false, type: null, id: null });
  };

  const { mutate: DeleteAvg } = useMutation({
    mutationFn: (problemId) => deleteAvgProblem(problemId),
    onSuccess: (_, problemId) => {
      console.log("Successfully deleted:", problemId);
      queryClient.setQueryData(["avgTestCase", "data"], (oldData) =>
        oldData.filter((item) => item.problemId !== problemId)
      );
    },
  });

  const handleDeleteAvg = (problemId) => {
    console.log("i got del req", problemId)
    DeleteAvg(problemId);
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
    try {
      const data = axios.get(`http://localhost:8000/profile/printCase_id/${runId}`, {
        withCredentials: true
      });
      toast.success("code being executed")
      return data.data
    } catch (error) {
      toast.error("failed to re run code")
    }
  }

  const reRunProgrammiz = async (runId) => {
    console.log("run id:", runId)
    if (!isConnected) {
      console.log("no socket id return now")
      return
    }
    console.log("scoekt id:", clientId)
    try {
      const data = axios.get(`http://localhost:8000/profile/reRunProgrammiz/${runId}`, {
        withCredentials: true
      });

      toast.success("Successfully started reexecution")
      return data.data
    } catch (error) {
      toast.error("failed to reexecute code")
    }
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
    <div className="space-y-8 p-4 md:p-0">
      <LogsDialog
        open={dialog.open}
        type={dialog.type}
        id={dialog.id}
        onClose={closeLogs}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Executions</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">Manage and monitor your code executions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-transparent border-gray-200 text-gray-700 dark:border-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            size="sm"
          >
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 min-w-[240px] max-w-xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-white text-gray-900 border-gray-200 placeholder:text-gray-400 dark:bg-gray-800 dark:text-white dark:border-slate-700 dark:placeholder:text-gray-500 focus:border-blue-500 rounded-lg"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
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
        <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-transparent dark:border-slate-700/50">
          <TabsTrigger
            value="workflows"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:text-slate-400 dark:data-[state=active]:text-white rounded-md py-2"
          >
            All Workflows
          </TabsTrigger>
          <TabsTrigger
            value="runs"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:text-slate-400 dark:data-[state=active]:text-white rounded-md py-2"
          >
            Recent Runs
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:text-slate-400 dark:data-[state=active]:text-white rounded-md py-2"
          >
            Programmiz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Problems</h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">Loaded only when you view this tab</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-2 bg-transparent border-gray-200 text-gray-700 dark:border-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                  <Card key={idx} className="border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-5 w-40 bg-gray-200 dark:bg-gray-800" />
                          <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-800" />
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Skeleton className="h-4 bg-gray-200 dark:bg-gray-800" />
                            <Skeleton className="h-4 bg-gray-200 dark:bg-gray-800" />
                            <Skeleton className="h-4 bg-gray-200 dark:bg-gray-800" />
                            <Skeleton className="h-4 bg-gray-200 dark:bg-gray-800" />
                          </div>
                        </div>
                        <Skeleton className="h-9 w-9 bg-gray-200 dark:bg-gray-800" />
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
                <Card key={workflow.problemId || workflow._id || Math.random()} className="border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{workflow.problemTitle}</h3>
                          <Badge
                            variant="secondary"
                            className={
                              workflow.status === "error"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none"
                                : workflow.status === "paused"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-none"
                                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none"
                            }
                          >
                            {workflow.status === "active" && <CheckCircle className="w-3 h-3 mr-1" />}
                            {workflow.status === "paused" && <Pause className="w-3 h-3 mr-1" />}
                            {workflow.status === "error" && <XCircle className="w-3 h-3 mr-1" />}
                            {workflow.status ? workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1) : "Active"}
                          </Badge>
                        </div>

                        <p className="text-gray-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">{workflow.problemDescription || "No description available."}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-slate-500">Last Run</span>
                            <div className="font-medium text-gray-900 dark:text-slate-200">{workflow.lastRun || "-"}</div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-slate-500">Total Attempts</span>
                            <div className="font-medium text-gray-900 dark:text-slate-200">{workflow.totalAttempts ?? "-"}</div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-slate-500">Success Rate</span>
                            <div className="font-medium text-gray-900 dark:text-slate-200">{workflow.successRate || "-"}</div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-slate-500">Avg Duration</span>
                            <div className="font-medium text-gray-900 dark:text-slate-200">{workflow.avgDuration || "-"}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start mt-4 lg:mt-0">
                        {workflow.status === "active" && (
                          <Button size="sm" variant="outline" className="gap-2 bg-transparent border-gray-200 text-gray-700 dark:border-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <Pause className="w-3 h-3" />
                            Pause
                          </Button>
                        )}
                        {workflow.status === "paused" && (
                          <Button size="sm" variant="outline" className="gap-2 bg-transparent border-gray-200 text-gray-700 dark:border-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <Play className="w-3 h-3" />
                            Resume
                          </Button>
                        )}
                        {workflow.status === "error" && (
                          <Button size="sm" variant="outline" className="gap-2 bg-transparent border-gray-200 text-gray-700 dark:border-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <Zap className="w-3 h-3" />
                            Retry
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-slate-700">
                            <DropdownMenuItem className="dark:text-slate-300 dark:focus:bg-gray-700" onClick={() => openLogs("avgTestCase", workflow.problemId)}>View Logs</DropdownMenuItem>
                            <DropdownMenuSeparator className="dark:bg-slate-700" />
                            <DropdownMenuItem className="text-red-600 dark:text-red-400 dark:focus:bg-gray-700" onClick={() => handleDeleteAvg(workflow.problemId)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {!AvgTestLoading && !AvgTestError && normalizedWorkflows.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-slate-400">No recent problems found.</div>
            )}

            {!AvgTestLoading && !AvgTestError && normalizedWorkflows.length > 0 && filteredWorkflows.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-slate-400">No problems match your search.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="runs" className="space-y-6">
          <Card className="border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 shadow-sm">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-gray-900 dark:text-white">Recent Workflow Runs</CardTitle>
                <CardDescription className="text-gray-600 dark:text-slate-400">Monitor the latest workflow executions</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 bg-transparent border-gray-200 text-gray-700 dark:border-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                    <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-gray-200 dark:border-slate-700">
                      <TableHead className="text-gray-700 dark:text-slate-300">Run ID</TableHead>
                      <TableHead className="text-gray-700 dark:text-slate-300">Name</TableHead>
                      <TableHead className="text-gray-700 dark:text-slate-300">Status</TableHead>
                      <TableHead className="text-gray-700 dark:text-slate-300">Duration</TableHead>
                      <TableHead className="text-gray-700 dark:text-slate-300">Date</TableHead>
                      <TableHead className="text-gray-700 dark:text-slate-300">Language</TableHead>
                      <TableHead className="text-gray-700 dark:text-slate-300">Output</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {RecentPrintLoading &&
                      Array.from({ length: 4 }).map((_, idx) => (
                        <TableRow key={`recent-skeleton-${idx}`} className="border-gray-200 dark:border-slate-700">
                          <TableCell colSpan={8} className="py-4">
                            <div className="flex items-center gap-4">
                              <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-gray-800" />
                              <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-gray-800" />
                              <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-gray-800" />
                              <Skeleton className="h-4 w-14 bg-gray-200 dark:bg-gray-800" />
                              <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-gray-800" />
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
                        <TableRow key={run._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 border-gray-200 dark:border-slate-700">
                          <TableCell className="font-mono text-xs text-gray-900 dark:text-slate-300">{run._id?.slice(0, 8)}…</TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-white">{run.problemid?.title || "-"}</TableCell>
                          <TableCell>
                            {run.status === "success" && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Success
                              </Badge>
                            )}
                            {run.status === "failed" && (
                              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none">
                                <XCircle className="w-3 h-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                            {run.status === "running" && (
                              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
                                Running
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-slate-300">{formatDuration(run.execution_time)}</TableCell>
                          <TableCell className="text-gray-600 dark:text-slate-400">{formatDate(run.createdAt)}</TableCell>
                          <TableCell className="text-gray-600 dark:text-slate-400">{run.language || "-"}</TableCell>
                          <TableCell className="text-gray-600 dark:text-slate-400 max-w-[200px] truncate">{run.output ? run.output : "—"}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-slate-700">
                                <DropdownMenuItem className="dark:text-slate-300 dark:focus:bg-gray-700" onClick={() => openLogs("printCase", run._id)}>View Logs</DropdownMenuItem>
                                <DropdownMenuItem className="dark:text-slate-300 dark:focus:bg-gray-700" onClick={() => reRunPrint(run._id)}>Re-run</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 dark:text-red-400 dark:focus:bg-gray-700" onClick={() => handleDeletePrint(run._id)}>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}

                    {!RecentPrintLoading && !RecentPrintError && normalizedRecentPrints.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-gray-500 dark:text-slate-400">
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
          <Card className="border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 shadow-sm">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-gray-900 dark:text-white">Recent RawExecution Runs</CardTitle>
                <CardDescription className="text-gray-600 dark:text-slate-400">Monitor the latest raw executions</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 bg-transparent border-gray-200 text-gray-700 dark:border-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                    <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-gray-200 dark:border-slate-700">
                      <TableHead className="text-gray-700 dark:text-slate-300">Run ID</TableHead>
                      <TableHead className="text-gray-700 dark:text-slate-300">Language</TableHead>
                      <TableHead className="text-gray-700 dark:text-slate-300">Status</TableHead>
                      <TableHead className="text-gray-700 dark:text-slate-300">Duration</TableHead>
                      <TableHead className="text-gray-700 dark:text-slate-300">Date</TableHead>
                      <TableHead className="text-gray-700 dark:text-slate-300">Output</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {RawExeLoading &&
                      Array.from({ length: 4 }).map((_, idx) => (
                        <TableRow key={`raw-skeleton-${idx}`} className="border-gray-200 dark:border-slate-700">
                          <TableCell colSpan={7} className="py-4">
                            <div className="flex items-center gap-4">
                              <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-gray-800" />
                              <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-800" />
                              <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-gray-800" />
                              <Skeleton className="h-4 w-14 bg-gray-200 dark:bg-gray-800" />
                              <Skeleton className="h-4 w-28 bg-gray-200 dark:bg-gray-800" />
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
                        <TableRow key={run._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 border-gray-200 dark:border-slate-700">
                          <TableCell className="font-mono text-xs text-gray-900 dark:text-slate-300">{run._id?.slice(0, 8)}…</TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-white">{run.language || "-"}</TableCell>
                          <TableCell>
                            {run.status === "success" && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Success
                              </Badge>
                            )}
                            {run.status === "failed" && (
                              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none">
                                <XCircle className="w-3 h-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                            {run.status === "running" && (
                              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
                                Running
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-slate-300">{formatDuration(run.execution_time)}</TableCell>
                          <TableCell className="text-gray-600 dark:text-slate-400">{formatDate(run.createdAt)}</TableCell>
                          <TableCell className="text-gray-600 dark:text-slate-400 max-w-[200px] truncate">{run.output ? run.output : "—"}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-slate-700">
                                <DropdownMenuItem className="dark:text-slate-300 dark:focus:bg-gray-700" onClick={() => openLogs("programmizCase", run._id)}>View Logs</DropdownMenuItem>
                                <DropdownMenuItem className="dark:text-slate-300 dark:focus:bg-gray-700" onClick={() => reRunProgrammiz(run._id)}>Re-run</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 dark:text-red-400 dark:focus:bg-gray-700" onClick={() => handleDeleteProgrammiz(run._id)}>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}

                    {!RawExeLoading && !RawExeError && normalizedRawExe.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-gray-500 dark:text-slate-400">
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
  )
}
