
import { Suspense } from "react";
import "./index.css";
import {LazyLandingPage,LazyRegisterPage,LazyLoginPage,LazyTestPage,LazyWritePage, LazyLeetCode} from "./LazyLoading/LazyLoading";
import {BrowserRouter as Router,Routes,Route,} from "react-router-dom";
import {QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./Utils/QueryConfig.jsx";
import Loader from "./LazyLoading/Loader.jsx";
import { Toaster } from "react-hot-toast";
import useSocketStore from "./ZustandStore/SocketStore";
import { useEffect } from "react";
function App() {
   const { initSocket, socket, isConnected } = useSocketStore();
  useEffect(() => {
    initSocket(); // initialize socket on mount
  }, []);

   return (
    <QueryClientProvider client={ queryClient}>
   <Toaster position="top-right" reverseOrder={false} />
      <Router>
       <Suspense fallback={<Loader />}>
       <Routes>
            <Route path="/" element={<LazyLandingPage />} />
            <Route path="/auth/:mode" element={<LazyLoginPage />} />
            <Route path="/code" element={<LazyWritePage />} />
            <Route path="/leet" element={<LazyLeetCode />} />
    
            <Route path="*" element={<div className="p-10 text-center text-red-500 font-bold">404 | Page Not Found</div>} />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

