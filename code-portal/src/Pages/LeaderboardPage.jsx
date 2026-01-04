"use client"

import { useEffect, useState } from "react"
import { Trophy, Medal, MapPin, RefreshCw, AlertCircle, User, ChevronRight, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import axios from "axios"

// Mock store for demonstration
const useUserStore = () => ({
  currentUser: { _id: "6954229913d627b359af05be", fullname: "Rajan Dhamala" },
})

export default function LeaderboardPage() {
  const { currentUser } = useUserStore()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [locationFilter, setLocationFilter] = useState("global") // "global" or "local"

  const fetchLeaderboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const endpoint =
        locationFilter === "global"
          ? "http://localhost:8000/users/globalLeaderboard"
          : "http://localhost:8000/users/location"

      const response = await axios.get(endpoint, { withCredentials: true })
      setUsers(response.data.data.sort((a, b) => b.points - a.points)) // sort top points
    } catch (err) {
      console.error(err)
      setError("Could not connect to the server.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [locationFilter])

  const getRankDisplay = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{index + 1}</span>
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-2xl space-y-6">
        <header className="flex items-end justify-between px-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <MapPin className="h-4 w-4" />
              <span>San Francisco, CA</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Leaderboard</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant={locationFilter === "global" ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocationFilter("global")}
            >
              Global
            </Button>
            <Button
              variant={locationFilter === "local" ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocationFilter("local")}
            >
              Nearby
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchLeaderboard}
              disabled={loading}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Sync
            </Button>
          </div>
        </header>

        {error && (
          <Alert variant="destructive" className="rounded-xl border-none bg-destructive/10 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-2 pt-8 px-8 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Performers
            </CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-medium">
              {locationFilter === "global" ? "Global" : "Nearby"}
            </Badge>
          </CardHeader>
          <CardContent className="px-4 pb-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
                <p className="text-muted-foreground text-sm font-medium animate-pulse">Calculating rankings...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-muted mb-4">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Empty Podium</h3>
                <p className="text-muted-foreground text-sm mt-1">Start competing to show up here!</p>
              </div>
            ) : (
              <div className="space-y-1 mt-4">
                {users.map((user, index) => {
                  const isCurrentUser = currentUser && currentUser._id === user._id
                  const isTop3 = index < 3

                  return (
                    <div
                      key={user._id}
                      className={`
                        group flex items-center justify-between p-3 rounded-2xl transition-all duration-300
                        ${isCurrentUser ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02] z-10" : "hover:bg-accent/50"}
                      `}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 flex justify-center flex-shrink-0">{getRankDisplay(index)}</div>

                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar
                              className={`
                              h-10 w-10 border-2 transition-transform duration-300 group-hover:scale-105
                              ${isCurrentUser ? "border-primary-foreground/30" : "border-background"}
                            `}
                            >
                              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullname} />
                              <AvatarFallback className={isCurrentUser ? "bg-primary-foreground/10" : ""}>
                                {user.fullname.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {isTop3 && !isCurrentUser && (
                              <div
                                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center
                                    ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-slate-400" : "bg-amber-600"}`}
                              ></div>
                            )}
                          </div>

                          <div className="flex flex-col">
                            <span
                              className={`font-bold text-sm tracking-tight ${isCurrentUser ? "text-primary-foreground" : "text-foreground"}`}
                            >
                              {user.fullname}
                            </span>
                            <span className={`text-[10px] font-medium uppercase tracking-wider opacity-60`}>
                              {index === 0 ? "Legendary" : index === 1 ? "Elite" : index === 2 ? "Pro" : "Challenger"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div
                            className={`text-sm font-black ${isCurrentUser ? "text-primary-foreground" : "text-primary"}`}
                          >
                            {user.points.toLocaleString()}
                          </div>
                          <div className={`text-[10px] font-bold opacity-50 uppercase`}>Points</div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 ${isCurrentUser ? "text-primary-foreground" : "text-muted-foreground"}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
