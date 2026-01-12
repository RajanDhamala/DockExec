import { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import {
  Home,
  Workflow,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import useUserStore from "@/ZustandStore/UserStore";
import { LogoutUser } from "@/Utils/HelperUtils";
import { useNavigate } from "react-router-dom";
import useMediaQuery from "@/Utils/UseMediaQuery";
const navigation = [
  { name: "Overview", href: "/overview", icon: Home },
  { name: "Workflows", href: "/workflows", icon: Workflow },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Billing", href: "/bills", icon: DollarSign },
  { name: "Prefrences", href: "/prefrences", icon: SlidersHorizontal },
];

export function DashboardLayout() {
  const { currentUser, clearCurrentUser } = useUserStore()
  const navigate = useNavigate()
  const location = useLocation();
  const pathname = location.pathname;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);


  useEffect(() => {
    const storedCollapsed = localStorage.getItem("isCollapsed");
    if (storedCollapsed !== null) {
      setIsCollapsed(storedCollapsed === "true");
    }

    const data = localStorage.getItem("userPreferences");
    if (data) {
      try {
        const userPreferences = JSON.parse(data);
        setIsDarkMode(userPreferences.theme === "dark");
      } catch (err) {
        console.error("Invalid userPreferences JSON", err);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("isCollapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem(
      "userPreferences",
      JSON.stringify({ theme: isDarkMode ? "dark" : "light" })
    );

    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);
  const isMobile = useMediaQuery("(max-width: 767px)")
  const effectiveCollapsed = isMobile ? false : isCollapsed



  return (
    <div className={`min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200`}>
      <header className="sticky top-0 z-30 h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 md:px-6 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden dark:text-gray-200"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          <Link to={"/"} className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-mono shrink-0">
              {"{"}
            </div>
            <span className="text-gray-900 dark:text-white hidden sm:inline-block">DockExec</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4">

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="dark:text-gray-200"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="w-8 h-8 border border-gray-200 dark:border-gray-700">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback className="dark:bg-gray-800 dark:text-gray-200">{currentUser?.fullname.slice(0, 2)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 dark:bg-gray-900 dark:border-gray-800">
              <DropdownMenuLabel className="dark:text-white">{currentUser?.fullname || "Guest"}</DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:bg-gray-800" />
              <Link to={"/settings"}>
                <DropdownMenuItem className="dark:text-gray-200 dark:focus:bg-gray-800">
                  Settings</DropdownMenuItem>
              </Link>
              <Link to={"/support"}>
                <DropdownMenuItem className="dark:text-gray-200 dark:focus:bg-gray-800">Support</DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="dark:bg-gray-800" />
              <DropdownMenuItem className="dark:text-gray-200 dark:focus:bg-gray-800" onClick={() => LogoutUser(clearCurrentUser, navigate)}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex relative">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed md:sticky top-16 left-0 z-20
            h-[calc(100vh-4rem)] 
            border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900
            overflow-y-auto transition-all duration-300 ease-in-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            ${isCollapsed ? "md:w-20" : "md:w-64 lg:w-72"}
            w-64 
          `}
        >
          <div className="hidden md:flex justify-end p-2 border-b border-transparent">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>

          <div className="p-4 md:p-4">
            <nav className="space-y-1 md:space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    title={effectiveCollapsed ? item.name : ""}
                    className={`
          flex items-center w-full
          ${effectiveCollapsed
                        ? 'justify-center px-2 py-3'
                        : 'justify-start px-3 py-2 md:px-4 md:py-3'}
          rounded-md text-sm md:text-base font-medium transition-all duration-200
          ${isActive
                        ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }
        `}
                  >
                    <item.icon
                      className={`
            ${effectiveCollapsed
                          ? 'w-6 h-6'
                          : 'w-4 h-4 md:w-5 md:h-5 mr-3'}
            transition-all
          `}
                    />

                    {(!effectiveCollapsed || isMobile) && (
                      <span className="whitespace-nowrap">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </nav>

          </div>
        </aside>

        <main className="flex-1 p-4 md:p-8 bg-gray-50 dark:bg-gray-950 min-h-[calc(100vh-4rem)] w-full overflow-x-hidden text-gray-900 dark:text-gray-100 transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
