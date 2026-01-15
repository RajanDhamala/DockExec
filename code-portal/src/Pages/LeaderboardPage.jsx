"use client"

import { useEffect, useMemo, useState } from "react"
import { Trophy, Medal, RefreshCw, AlertCircle, User, ChevronRight, TrendingUp, Target, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Navbar from "@/templates/Navbar"
import useUserStore from "@/ZustandStore/UserStore"
import axios from "axios"
import { useQuery } from "@tanstack/react-query"

export default function LeaderboardPage() {

  const { currentUser } = useUserStore()
  const [locationFilter, setLocationFilter] = useState("global")

  const fetchLeaderboard = async (location) => {
    const endpoint =
      location === "global"
        ? "http://localhost:8000/users/globalLeaderboard"
        : "http://localhost:8000/users/location"
    if (!currentUser && location == "local") {
      return
    }
    const res = await axios.get(endpoint, { withCredentials: true })
    return res.data.data.sort((a, b) => b.points - a.points)
  }

  const {
    data: users = [],
    isLoading: leaderboardLoading,
    isError: leaderboardError,
    refetch: refetchLeaderboard
  } = useQuery({
    queryKey: ["leaderboard", locationFilter],
    queryFn: () => fetchLeaderboard(locationFilter),
    keepPreviousData: true
  })

  const fetchYourPercentile = async () => {
    if (!currentUser) {
      console.log("there are  no current users btw")
      return null
    }
    const res = await axios.get(`http://localhost:8000/users/percentile`, { withCredentials: true })
    console.log("percentile:", res.data.data)
    return res.data.data
  }

  const { data: PercentileData, isLoading: PercentileLoading, isError: PercentileError } = useQuery({
    queryKey: ["yourPercentile"],
    queryFn: fetchYourPercentile,
    enabled:!!currentUser,
    retry:2
  })

  const userPlacement = useMemo(() => {
    if (!currentUser || !users.length) return null
    const index = users.findIndex((u) => u._id === currentUser._id)
    if (index === -1) return null
    const rank = index + 1
    const percentile = Math.max(0, Math.round((1 - index / users.length) * 100))
    const points = users[index]?.points ?? 0
    return { rank, percentile, points }
  }, [currentUser, users])

  const getRankDisplay = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{index + 1}</span>
  }


  return (
    <div className="min-h-screen bg-gray-900 text-slate-100 pb-12">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-6 md:pt-10">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <p className="text-sm text-slate-400 uppercase tracking-[0.12em]">Competitive standings</p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Leaderboard</h1>
              <p className="text-slate-300 max-w-3xl text-sm md:text-base">
                See how you rank among developers worldwide based on activity and performance.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={locationFilter === "global" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLocationFilter("global")}
                className="border border-slate-700/80 bg-slate-800/50 hover:bg-blue-600 dark:text-white"
              >
                Global
              </Button>
              <Button
                variant={locationFilter === "local" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLocationFilter("local")}
                className="border border-slate-700/80 bg-slate-800/50 hover:bg-blue-600 dark:text-white"
              >
                Nearby
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={refetchLeaderboard}
                disabled={leaderboardLoading}
                className="text-slate-300 hover:text-white hover:bg-black border border-slate-700/80 bg-slate-800/40"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${leaderboardLoading ? "animate-spin" : ""}`} />
                Sync
              </Button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/40 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-lg shadow-blue-500/5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">How points are earned</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Complete problems, submit passing tests, and participate in challenges to collect points.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <RefreshCw className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">Ranking updates</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Standings refresh automatically after new submissions, so recent activity counts quickly.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">Global vs Nearby</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Global shows everyone. Nearby spotlights developers closest to your region to keep things close.
              </p>
            </div>
          </div>
        </section>


        <section className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-lg shadow-blue-500/5">
          {PercentileData ? (
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Percentile</p>
                <p className="text-lg font-semibold text-white">Top {PercentileData.topPercentile}%</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-col md:flex-row gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Sign in to see your standing</p>
                <p className="text-sm text-slate-300">Track your rank, percentile, and progress over time.</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => (window.location.href = "/auth/login")}>Sign in</Button>
                <Button size="sm" variant="outline"
                  className="border border-slate-700 text-black transform hover:scale-105 transition-transform duration-200"
                  onClick={() => (window.location.href = "/auth/register")}>Create account</Button>
              </div>
            </div>
          )}
        </section>


        {leaderboardError && (
          <Alert variant="destructive" className="rounded-xl border border-red-900 bg-red-900/20 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription >{"Login to view the local Leaderbaord"}</AlertDescription>
          </Alert>
        )}

        <Card className="border border-slate-800 bg-slate-900/80 backdrop-blur rounded-3xl shadow-2xl shadow-blue-500/10">
          <CardHeader className="pb-2 pt-6 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Top Performers
            </CardTitle>
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-300 border border-blue-500/30 font-medium">
              {locationFilter === "global" ? "Global" : "Nearby"}
            </Badge>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-8">
            {leaderboardLoading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
                <p className="text-slate-300 text-sm font-medium animate-pulse">Calculating rankings...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-slate-800 mb-4">
                  <User className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-white">Empty Podium</h3>
                <p className="text-slate-400 text-sm mt-1">Start competing to show up here!</p>
              </div>
            ) : (
              <div className="space-y-1 mt-4">
                {users.map((user, index) => {
                  const isCurrentUser = currentUser && currentUser.id === user._id
                  const isTop3 = index < 3

                  return (
                    <div
                      key={user._id}
                      className={`
                        group flex items-center justify-between p-3 md:p-4 rounded-2xl transition-all duration-300 border border-transparent
                        ${isCurrentUser ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.01]" : "hover:bg-slate-800/70 hover:border-slate-700"}
                      `}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 flex justify-center flex-shrink-0">{getRankDisplay(index)}</div>

                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <Avatar
                              className={`
                              h-10 w-10 border-2 transition-transform duration-300 group-hover:scale-105
                              ${isCurrentUser ? "border-white/40" : "border-slate-800"}
                            `}
                            >
                              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullname} />
                              <AvatarFallback className={isCurrentUser ? "bg-white/10" : "bg-slate-800"}>
                                {user.fullname.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {isTop3 && !isCurrentUser && (
                              <div
                                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center
                                    ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-slate-300" : "bg-amber-600"}`}
                              ></div>
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span
                              className={`font-bold text-sm tracking-tight truncate ${isCurrentUser ? "text-white" : "text-slate-100"}`}
                            >
                              {user.fullname}
                            </span>
                            <span className={`text-[10px] font-medium uppercase tracking-wider opacity-60 truncate text-white`}>
                              {index === 0 ? "Legendary" : index === 1 ? "Elite" : index === 2 ? "Pro" : "Challenger"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div
                            className={`text-sm font-black ${isCurrentUser ? "text-white" : "text-blue-300"}`}
                          >
                            {user.points.toLocaleString()}
                          </div>
                          <div className={`text-[10px] font-bold opacity-60 uppercase text-slate-300`}>Points</div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 ${isCurrentUser ? "text-white" : "text-slate-500"}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <section className="border border-slate-800 rounded-2xl bg-slate-800/40 px-4 py-3 text-sm text-slate-200 shadow-lg shadow-blue-500/5">
          Rankings update automatically — stay active to climb higher.
        </section>
      </div>
    </div>
  )
}
