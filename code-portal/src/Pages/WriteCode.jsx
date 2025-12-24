"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import useSocketStore from "@/ZustandStore/SocketStore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Play, Code2, Terminal, Loader2, Timer } from "lucide-react";
import toast from "react-hot-toast";
import Editor from "@monaco-editor/react";

//  Boilerplate code templates for all languages
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

  const { socket, initSocket, isConnected, clientId } = useSocketStore();
  const consoleRef = useRef(null);

  //  Initialize socket connection
  useEffect(() => {
    initSocket();
    return () => socket?.disconnect();
  }, []);

  //  Update code when language changes
  useEffect(() => {
    setCode(getBoilerplateCode(language));
    setLines([]);
    setDuration(null);
  }, [language]);

  //  Handle result from Kafka
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

  //  Send job to backend
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        "http://localhost:8000/api/exec",
        { code, language, clientId, "socketId": socket.id },
        { withCredentials: true }
      );
      return res.data;
    },
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
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-5xl bg-gray-900/80 backdrop-blur-xl border-gray-800 shadow-2xl relative z-10">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Language Selector */}
            <div className="space-y-2">
            

              <div className="flex space-x-5">
  <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Programming Language
              </Label>
                     <div className="flex items-center gap-3">
              <CardDescription className="text-gray-400">
                {isConnected ? (
                  <span className="text-green-400">🟢 Connected</span>
                ) : (
                  <span className="text-red-400">🔴 Disconnected</span>
                )}
              </CardDescription>
          </div>    
              </div>


              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {languageOptions.map((lang) => (
                    <SelectItem
                      key={lang.value}
                      value={lang.value}
                      className="text-gray-100 hover:bg-gray-700"
                    >
                      {lang.icon} {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Code Editor */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Code2 className="w-4 h-4" /> Source Code
              </Label>
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <Editor
                  height="400px"
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
                  }}
                />
              </div>
            </div>

            {/* Console Output */}
           <div
  className="mt-4 border border-gray-700 rounded-lg bg-gray-800/70 text-gray-100 font-mono text-sm p-3 h-60 overflow-y-auto whitespace-pre-wrap"
  ref={consoleRef}
>
  {/* 1. Idle / just-loaded / after reset */}
  {lines.length === 0 && !mutation.isPending && !mutation.isSuccess && (
    <p className="text-gray-600">Press **Run Code** to see the output.</p>
  )}

  {/* 2. Waiting for the backend (after submit) */}
  {mutation.isPending && (
    <p className="text-gray-500 animate-pulse">
      Waiting for output...
    </p>
  )}

  {/* 3. Real output (success / error / blocked) */}
  {lines.length > 0 && (
    <>
      {lines.map((line, i) => (
        <div key={i} className="leading-5">
          {line}
        </div>
      ))}

      {duration && (
        <div className="mt-2 text-xs text-green-400 border-t border-gray-700 pt-2 flex items-center gap-1">
          <Timer className="w-4 h-4" />
          Executed in {duration}s
        </div>
      )}
    </>
  )}
</div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
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
                className="px-6 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 hover:text-gray-100"
                disabled={mutation.isPending}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}