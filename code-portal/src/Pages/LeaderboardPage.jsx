import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Trophy,
  Medal,
  MapPin,
  RefreshCw,
  AlertCircle,
  User
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import useUserStore from "../ZustandStore/UserStore.js";

export default function LeaderboardPage() {
  const { currentUser } = useUserStore(); // Ensure this matches your store key (CurrentUser vs currentUser)
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:8000/users/location", {
        withCredentials: true,
      });

      if (response.data && response.data.success) {
        // Sort by points descending
        const sortedUsers = response.data.data.sort((a, b) => b.points - a.points);
        setUsers(sortedUsers);
      } else {
        setError("Failed to load leaderboard data.");
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400 fill-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600 fill-amber-600" />;
    return <span className="text-lg font-bold text-gray-500 w-6 text-center">{index + 1}</span>;
  };

  const getRowStyle = (index) => {
    if (index === 0) return "bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/50";
    if (index === 1) return "bg-gray-50/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800";
    if (index === 2) return "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/50";
    return "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-transparent";
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <MapPin className="h-8 w-8 text-blue-500" />
            Local Leaderboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Top performers in your geographical area.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchLeaderboard}
          disabled={loading}
          className=" dark:border-gray-700 dark:text-gray-300"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500 dark:text-gray-400 px-2">
            <span className="w-16">Rank</span>
            <span className="flex-1 ml-4">User</span>
            <span className="w-24 text-right">Points</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-gray-500 dark:text-gray-400 animate-pulse">Finding nearby users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <User className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No users found nearby</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                Be the first to set your location and claim the top spot on the leaderboard!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((user, index) => {
                const isCurrentUser = currentUser && (currentUser._id === user._id || currentUser.id === user._id);

                return (
                  <div
                    key={user._id}
                    className={`
                      flex items-center justify-between p-4 transition-all duration-200 border-l-4
                      ${getRowStyle(index)}
                      ${isCurrentUser ? 'ring-2 ring-inset ring-green-500/50 dark:ring-green-400/50 bg-green-50/30 dark:bg-green-900/20' : ''}
                    `}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0 w-8 flex justify-center">
                        {getRankIcon(index)}
                      </div>

                      <div className="flex items-center gap-3">
                        <Avatar className={`
                          w-10 h-10 border-2 
                          ${index === 0 ? "border-yellow-400" : index === 1 ? "border-gray-300" : index === 2 ? "border-amber-600" : "border-transparent"}
                        `}>
                          <AvatarImage src={user.avatar} alt={user.fullname} />
                          <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {user.fullname.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${index < 3 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                              {user.fullname}
                            </span>
                            {isCurrentUser && (
                              <Badge className="h-5 px-1.5 text-[10px] bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 pointer-events-none">
                                YOU
                              </Badge>
                            )}
                          </div>

                          {index === 0 && (
                            <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                              Current Leader
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-none text-sm font-mono">
                        {user.points.toLocaleString()} pts
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
