import { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import {
  Home,
  Workflow,
  Settings,
  Menu,
  X,
  Search,
  Sun,
  Moon,
  Bell,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import LocationDialog from "./LocationPage";

const navigation = [
  { name: "Overview", href: "/overview", icon: Home },
  { name: "Workflows", href: "/workflows", icon: Workflow },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardLayout() {
  const location = useLocation();
  const pathname = location.pathname;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

          <div className="hidden md:flex text-sm text-gray-500 dark:text-gray-400 items-center ml-2">
            <span>Dashboard</span> <span className="mx-1">/</span>
            <span className="capitalize">{pathname === "/" ? "Overview" : pathname.slice(1)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Search (Desktop Header) */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search workflows, logs..."
              className="pl-10 w-64 lg:w-80 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-200 focus:bg-white dark:focus:bg-gray-800"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="dark:text-gray-200"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative dark:text-gray-200">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="w-8 h-8 border border-gray-200 dark:border-gray-700">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback className="dark:bg-gray-800 dark:text-gray-200">AE</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 dark:bg-gray-900 dark:border-gray-800">
              <DropdownMenuLabel className="dark:text-white">Alex Evans</DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:bg-gray-800" />
              <DropdownMenuItem className="dark:text-gray-200 dark:focus:bg-gray-800">Settings</DropdownMenuItem>
              <DropdownMenuItem className="dark:text-gray-200 dark:focus:bg-gray-800">Support</DropdownMenuItem>
              <DropdownMenuSeparator className="dark:bg-gray-800" />
              <DropdownMenuItem className="dark:text-gray-200 dark:focus:bg-gray-800">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Sidebar Overlay */}
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
          {/* Desktop Toggle Button */}
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
            {/* Mobile Sidebar Search */}
            <div className="relative mb-6 md:hidden">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search anything..."
                className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm dark:text-gray-200"
              />
            </div>

            {/* Desktop Sidebar Search (Hidden when collapsed) */}
            {!isCollapsed && (
              <div className="relative mb-6 hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search anything..."
                  className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm dark:text-gray-200"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 w-6 h-6 dark:text-gray-400"
                >
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Collapsed Search Icon (Optional: Shows search icon only when collapsed) */}
            {isCollapsed && (
              <div className="hidden md:flex justify-center mb-6">
                <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(false)} title="Search">
                  <Search className="w-5 h-5 text-gray-400" />
                </Button>
              </div>
            )}

            <nav className="space-y-1 md:space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    title={isCollapsed ? item.name : ""}
                    className={`
                      flex items-center w-full 
                      ${isCollapsed ? 'justify-center px-2 py-3' : 'justify-start px-3 py-2 md:px-4 md:py-3'}
                      rounded-md text-sm md:text-base font-medium transition-all duration-200
                      ${isActive
                        ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }
                    `}
                  >
                    <item.icon className={`
                        ${isCollapsed ? 'w-6 h-6' : 'w-4 h-4 md:w-5 md:h-5 mr-3'} 
                        transition-all
                    `} />

                    {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 bg-gray-50 dark:bg-gray-950 min-h-[calc(100vh-4rem)] w-full overflow-x-hidden text-gray-900 dark:text-gray-100 transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
