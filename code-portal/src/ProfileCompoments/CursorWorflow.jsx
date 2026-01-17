
import { v4 as uuidv4 } from "uuid";
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

export default function CursorWorkflowPage() {
  const queryClient = useQueryClient();

  const [dialog, setDialog] = useState({
    open: false,
    type: null,
    id: null,
  });

  const { clientId, isConnected, socket } = useSocketStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("workflows")
  const [currentPage, SetcurrentPage] = useState({ run: 1, programmiz: 1 })
  const [hasNextPage, SethasNextPage] = useState({ run: true, programmiz: true })
  const [hasPrevPage, SethasPrevPage] = useState({ run: false, programmiz: false })
  const [fetchedTabs, setFetchedTabs] = useState({ workflows: false, runs: false, templates: false })
  const [LastPageMeta, setLastPageMeta] = useState({})
  const [cursorStack, setCursorStack] = useState([
    { cursorCreatedAt: "init", cursorTie: "init" },
  ]);
  const [pageIndex, setPageIndex] = useState(0);
  const cursor = cursorStack[pageIndex];


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
      toast.success("Successfully deleted")

      queryClient.setQueryData(["RecentPrint", "runs", `${currentPage.run}`], (oldData) =>
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
      toast.success("Successfully deleted")
      console.log("Successfully deleted:", runId);

      queryClient.setQueryData(["rawExe", "programmiz", `${currentPage.programmiz}`], (oldData) =>
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
      params: {
        page: currentPage.run,
        limit: 7
      },
      withCredentials: true
    })
    SethasNextPage(prev => ({
      ...prev,
      run: response?.data?.pagination.hasNextPage
    }))

    console.log("has next page:", response.data.pagination.hasNextPage)
    return response.data.data
  }


  const fetchRawExecution = async () => {

    console.log("data:", RawExeData);
    console.log("meta:", cursor.cursorCreatedAt,
      cursor.cursorTie,)

    const response = await axios.get(`http://localhost:8000/cursor/getProgrammiz/${cursor.cursorCreatedAt}/${cursor.cursorTie}/10`, {
      withCredentials: true
    });

    console.log("has next page:", response.data.nextCursor);
    setLastPageMeta(response.data.nextCursor);

    return response.data;
  };


  const reRunPrint = async (runId) => {
    console.log("run id:", runId)
    if (!isConnected || !socket) {
      console.log("no socket id return now")
      return
    }
    console.log("socket id:", clientId)
    const idempotent = uuidv4()
    try {
      const data = axios.get(`http://localhost:8000/profile/printCase_id/${runId}/${socket.id}`, {
        withCredentials: true,
        headers: {
          "Idempotency-Key": idempotent
        }
      });
      toast.success("code being executed")
      return data.data
    } catch (error) {
      toast.error("failed to re run code")
    }
  }

  const reRunProgrammiz = async (runId) => {
    console.log("run id:", runId)
    if (!isConnected || !socket) {
      console.log("no socket id return now")
      return
    }
    console.log("scoekt id:", clientId)

    const idempotent = uuidv4()
    try {
      const data = axios.get(`http://localhost:8000/profile/reRunProgrammiz/${runId}/${socket.id}`, {
        withCredentials: true,
        headers: {
          "Idempotency-Key": idempotent
        }
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
    queryKey: ["RecentPrint", "runs", `${currentPage.run}`],
    queryFn: fetchRecentPrintRuns,
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
    queryKey: ["rawExe", "programmiz", cursor.cursorCreatedAt, cursor.cursorTie],
    queryFn: fetchRawExecution,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
  })

  const normalizedRawExe = useMemo(() => (Array.isArray(RawExeData) ? RawExeData : RawExeData?.data || []), [RawExeData])

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
    <div className="space-y-8 ">
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
            value="templates"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:text-slate-400 dark:data-[state=active]:text-white rounded-md py-2"
          >
            Programmiz
          </TabsTrigger>
        </TabsList>


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
                <div className=" flex justify-center gap-x-5">
                  <Button
                    variant="outline"
                    className="gap-2 bg-transparent border-gray-200 text-gray-700 dark:border-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="sm"
                    disabled={pageIndex === 0 || RawExeLoading}
                    onClick={() => {
                      if (pageIndex === 0) return;
                      setPageIndex((i) => i - 1);
                    }}
                  >prev
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 bg-transparent border-gray-200 text-gray-700 dark:border-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="sm"
                    disabled={!RawExeData?.nextCursor || RawExeLoading || normalizedRawExe.length === 0}
                    onClick={(e) => {
                      if (!RawExeData?.nextCursor) return;

                      setCursorStack((prev) => [...prev, RawExeData.nextCursor]);
                      setPageIndex((i) => i + 1);
                    }}
                  >Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
