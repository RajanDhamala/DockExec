import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import useSocketStore from "@/ZustandStore/SocketStore";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Code2,
  Terminal,
  Loader2,
  Timer,
  RotateCcw,
  Cpu
} from "lucide-react";
import toast from "react-hot-toast";
import Editor from "@monaco-editor/react";

// Boilerplate code templates for all languages
const getBoilerplateCode = (language) => {
  const templates = {
    python: `# Python Hello World
print("Hello World from Python! ")

# Your code here
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))`,

    javascript: `// JavaScript Hello World
console.log("Hello World from JavaScript! ");

// Your code here
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet("World"));`,

    c: `#include <stdio.h>

int main() {
    printf("Hello World from C! ️\\n");
    
    // Your code here
    char name[] = "World";
    printf("Hello, %s!\\n", name);
    
    return 0;
}`,

    go: `package main

import "fmt"

func main() {
    fmt.Println("Hello World from Go! ")
    
    // Your code here
    name := "World"
    fmt.Printf("Hello, %s!\\n", name)
}`,

    java: `class Main {
    public static void main(String[] args) {
        System.out.println("Hello World from Java! ☕");
        
        // Your code here
        String name = "World";
        System.out.println("Hello, " + name + "!");
    }
    
    // Additional methods can go here
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`
  };

  return templates[language] || templates.python;
};

export default function WriteCode() {
  const [code, setCode] = useState(getBoilerplateCode("python"));
  const [language, setLanguage] = useState("python");
  const [lines, setLines] = useState([]);
  const [duration, setDuration] = useState(null);

  const { socket, initSocket, isConnected, clientId, getSocket } = useSocketStore();
  const consoleRef = useRef(null);

  useEffect(() => {
    console.log(isConnected)
    if (!socket) {
      initSocket();
    }
    return () => socket?.disconnect();
  }, []);

  useEffect(() => {
    setCode(getBoilerplateCode(language));
    setLines([]);
    setDuration(null);
  }, [language]);

  // Handle result from Kafka
  useEffect(() => {
    if (!socket) return;

    const handleTestResult = (data) => {
      console.log("Received result:", data);

      const jobId = data.jobId || "unknown";
      const status = data.status || "unknown";

      // Only show success toast, no alerts for regular output
      if (status === "success") {
        toast.success(` code executed successfully`);
      } else if (status === "unsafe") {
        toast.error(` code is blocked`);
      } else if (status === "error") {
        toast.error(` code failed`);
      }

      // Format and split output lines
      const rawOutput = data.output?.output || data.output || "";
      const splitLines = String(rawOutput).split(/\r?\n/).filter(Boolean);
      setLines(splitLines.slice(-200));

      // Store duration
      const d = data.output?.duration_sec || data.duration_sec || null;
      setDuration(d ? Number(d).toFixed(3) : null);
    };

    const handleBlockedResult = (data) => {
      console.log("Code blocked:", data);

      const jobId = data.id || "unknown";
      const reason = data.reason || "Unknown security violation";

      toast.error(` Code blocked: ${reason}`);

      // Format blocked output
      const blockedOutput = [
        " CODE EXECUTION BLOCKED",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        `Reason: ${reason}`,
        `Job ID: ${jobId}`,
        `Language: ${data.language || "unknown"}`,
        "",
      ];
      setLines(blockedOutput);
      setDuration(null);
    };

    socket.on("programmiz_result", handleTestResult);
    socket.on("blocked_result", handleBlockedResult);

    return () => {
      socket.off("programmiz_result", handleTestResult);
      socket.off("blocked_result", handleBlockedResult);
    };
  }, [socket]);

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [lines]);

  const mutation = useMutation({
    mutationFn: async () => {
      let sock = socket;

      if (!sock || !isConnected) {
        console.log("Socket not connected, waiting for connection...");
        sock = await getSocket();
        if (!sock) {
          console.error("Could not connect to socket, aborting run");
          return;
        }
      }
      const res = await axios.post(
        "http://localhost:8000/api/exec",
        { code, language, clientId, "socketId": sock.id },
        { withCredentials: true }
      );
      return res.data;
    },
    retry: false,
    onSuccess: () => {
      toast.success(" Code submitted! Waiting for result...");
      setLines([]);
      setDuration(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Execution failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please write some code first");
      return;
    }
    mutation.mutate();
  };

  const languageOptions = [
    { value: "python", label: "Python", icon: "🐍" },
    { value: "javascript", label: "JavaScript", icon: "🟨" },
    { value: "c", label: "C", icon: "⚙️" },
    { value: "go", label: "Go", icon: "🔵" },
    { value: "java", label: "Java", icon: "☕" },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-slate-300 font-sans selection:bg-blue-500/30 flex flex-col overflow-hidden">

      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] lg:h-[calc(100vh-8rem)]">

          {/* LEFT COLUMN: Editor Area */}
          <div className="flex flex-col gap-3 sm:gap-4 h-full min-h-0 overflow-hidden">

            {/* Header: Title & Language Selector */}
            <div className="flex items-center justify-between bg-gray-900 border border-slate-700 p-2 sm:p-3 rounded-lg shadow-sm flex-shrink-0">
              <div className="flex items-center gap-2 px-1 sm:px-2">
                <Link to={"/"} className="flex items-center gap-2 font-bold text-lg sm:text-xl">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded flex items-center justify-center text-white font-mono">
                    {"{"}
                  </div>
                  <span className="text-white">DockExec</span>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[140px] sm:w-[180px] h-8 sm:h-9 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-0 focus:border-blue-500 rounded-lg">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {languageOptions.map((lang) => (
                      <SelectItem
                        key={lang.value}
                        value={lang.value}
                        className="text-gray-100 focus:bg-gray-700 focus:text-white cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{lang.icon}</span>
                          {lang.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex-1 border border-slate-700 rounded-lg overflow-hidden bg-[#1e1e1e] shadow-xl relative group min-h-0">
              <div className="absolute top-4 right-4 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
              </div>

              <Editor
                height="100%"
                language={language === "go" ? "go" : language}
                theme="vs-dark"
                value={code}
                onChange={setCode}
                options={{
                  automaticLayout: true,
                  fontSize: 14,
                  minimap: { enabled: false },
                  tabSize: 2,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  padding: { top: 20 },
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 sm:gap-4 flex-shrink-0">
              <Button
                onClick={handleSubmit}
                className="flex-1 h-11 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    Run Code
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCode(getBoilerplateCode(language));
                  setLines([]);
                  setDuration(null);
                }}
                className="px-5 sm:px-6 h-11 sm:h-12 bg-gray-900 border-gray-700 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-gray-800 rounded-lg transition-colors"
                disabled={mutation.isPending}
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* --- RIGHT COLUMN: Console Output --- */}
          <div className="flex flex-col gap-3 sm:gap-4 h-full min-h-0 overflow-hidden">

            {/* Console Header */}
            <div className="flex items-center justify-between bg-gray-900 border border-slate-700 p-2 sm:p-3 rounded-lg shadow-sm flex-shrink-0">
              <div className="flex items-center gap-2 px-1 sm:px-2">
                <Terminal className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-white tracking-wide">Output</span>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center gap-3 sm:gap-4 text-sm">
                {duration && (
                  <div className="flex items-center gap-1.5 text-green-400 bg-green-400/10 px-2 sm:px-3 py-1 rounded-full border border-green-400/20">
                    <Timer className="w-3.5 h-3.5" />
                    <span className="font-mono text-xs">{duration}s</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Cpu className="w-4 h-4" />
                  <span className="text-xs font-medium hidden sm:inline">READY</span>
                </div>
              </div>
            </div>

            <div
              className="flex-1 bg-gray-900 border border-slate-800 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm overflow-y-auto shadow-inner relative min-h-0"
              ref={consoleRef}
              style={{ maxHeight: '100%' }}
            >
              {lines.length === 0 && !mutation.isPending && !mutation.isSuccess && (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-3 opacity-50">
                  <Terminal className="w-12 h-12 stroke-1" />
                  <p>Run code to see output...</p>
                </div>
              )}

              {mutation.isPending && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="animate-pulse">Compiling and executing...</p>
                </div>
              )}

              {/* Actual Output */}
              <div className="space-y-1 overflow-y-auto">
                {lines.map((line, i) => (
                  <div key={i} className="break-words text-slate-300 border-l-2 border-transparent hover:border-slate-700 pl-2 -ml-2 transition-colors whitespace-pre-wrap">
                    {line}
                  </div>
                ))}

                {/* End of execution marker */}
                {lines.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dashed border-gray-800 text-xs text-slate-600 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Execution finished
                  </div>
                )}
              </div>
            </div>

            <div className="h-10 sm:h-12 bg-gray-900/50 border border-slate-800 rounded-lg flex items-center px-3 sm:px-4 text-xs text-slate-500 justify-between flex-shrink-0">
              <span>Console Ready</span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Connected to Server
              </span>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
