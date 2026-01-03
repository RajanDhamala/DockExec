
import { Suspense } from "react";
import "./index.css";
import { LazyLandingPage, LazySettingsPage, LazyProfilePage, LazyLoginPage, LazyWritePage, LazyLeetCode, LazyTestPage } from "./LazyLoading/LazyLoading";
import { BrowserRouter as Router, Routes, Route, } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./Utils/QueryConfig.jsx";
import Loader from "./LazyLoading/Loader.jsx";
import { Toaster } from "react-hot-toast";
import useSocketStore from "./ZustandStore/SocketStore";
import PageNotFound from "./Pages/PageNotFound";
import { useEffect } from "react";
import useUserStore from "./ZustandStore/UserStore";
import axios from "axios";
import WorkflowPage from "./ProfileCompoments/Workflows.jsx"
import SettingsPage from "./ProfileCompoments/Settings";
import Overview from "./ProfileCompoments/Overview";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { DashboardLayout } from "./ProfileCompoments/DashboardLayout";
import LocationPage from "./ProfileCompoments/LocationPage.jsx"
import LeaderboardPage from "./Pages/LeaderboardPage";

function App() {
  const { initSocket, socket, isConnected } = useSocketStore();
  const { setCurrentUser } = useUserStore()

  useEffect(() => {
    const run = async () => {
      initSocket();
      try {
        const data = await getUrself();
        setCurrentUser(data.user)
      } catch {
        console.log("user is not logged in or token expired")
      }
    };
    run();
  }, []);

  const getUrself = async () => {
    const response = await axios.get("http://localhost:8000/users/me", {
      withCredentials: true
    });
    if (response.data.success) {
      return response.data;
    }
    throw new Error("Not authenticated");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <Toaster position="top-right" reverseOrder={false} />
      <Router>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<LazyLandingPage />} />
            <Route path="/auth/:mode" element={<LazyLoginPage />} />
            <Route path="/code" element={<LazyWritePage />} />
            <Route path="/leet" element={<LazyLeetCode />} />
            <Route path="/test" element={<LazyTestPage />} />

            <Route path="/profile" element={<LazyProfilePage />} />

            <Route path="/location" element={<LocationPage />} />

            <Route path="/leaderboard" element={<LeaderboardPage />} />



            {/* test routes (WITH dashboard layout) */}
            <Route element={<DashboardLayout />}>
              <Route path="/overview" element={<Overview />} />
              <Route path="workflows" element={<WorkflowPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider >
  );
}

export default App;

