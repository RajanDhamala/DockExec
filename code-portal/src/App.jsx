import CursorWorkflowPage from "./ProfileCompoments/CursorWorflow";
import { Suspense } from "react";
import "./index.css";
import { LazyLandingPage, LazyPasswordReset, LazyFeedBackPage, LazyLoginPage, LazyWritePage, LazyLeetCode, LazyTestPage, LazyBillingPage, LazyPrefrencePage } from "./LazyLoading/LazyLoading";
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
import TokenUsageGraph from "./Pages/TokenUsageGraph";
import FeedbackPage from "./templates/FeedbackPage";


function App() {
  const { initSocket, socket, isConnected } = useSocketStore();
  const { setCurrentUser } = useUserStore()

  useEffect(() => {
    const data = localStorage.getItem("userPreferences");
    if (data) {
      try {
        const userPreferences = JSON.parse(data);
        console.log("themes", userPreferences);
        if (userPreferences.theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch (err) {
        console.error("Invalid userPreferences JSON", err);
      }
    } const run = async () => {
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
            <Route path="password-reset/:token" element={<LazyPasswordReset />} />

            <Route path="/code" element={<LazyWritePage />} />
            <Route path="/leet" element={<LazyLeetCode />} />
            <Route path="/test" element={<LazyTestPage />} />
            <Route path="/feedback" element={<LazyFeedBackPage />} />

            <Route path="/location" element={<LocationPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/tokenGraph" element={<TokenUsageGraph />} />

            <Route element={<DashboardLayout />}>

              <Route path="/cursor" element={<CursorWorkflowPage />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/workflows" element={<WorkflowPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/bills" element={<LazyBillingPage />} />
              <Route path="/prefrences" element={<LazyPrefrencePage />} />
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider >
  );
}

export default App;

