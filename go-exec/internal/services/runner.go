package services

import (
	"context"
	"os"
	"os/exec"
	"time"

	"github.com/shirou/gopsutil/process"
)

type CodeResult struct {
	Output     string  `json:"output"`
	Status     string  `json:"status"`
	Duration   float64 `json:"duration_sec"`
	MemoryMB   float64 `json:"memory_mb,omitempty"`
	CPUPercent float64 `json:"cpu_percent,omitempty"`
}

// ExecuteGoCode runs Go code safely with timeout and resource measurement
func ExecuteGoCode(code string) CodeResult {
	tmpFile, err := os.CreateTemp("", "code-*.go")
	if err != nil {
		return CodeResult{Output: "cannot create temp file", Status: "error"}
	}
	defer os.Remove(tmpFile.Name())

	if _, err := tmpFile.WriteString(code); err != nil {
		return CodeResult{Output: "cannot write code", Status: "error"}
	}
	tmpFile.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "go", "run", tmpFile.Name())

	start := time.Now()

	// Run command and capture combined output
	out, err := cmd.CombinedOutput()
	duration := time.Since(start)

	// Resource tracking
	var memMB float64
	var cpuPercent float64
	p, errProc := process.NewProcess(int32(cmd.Process.Pid))
	if errProc == nil && p != nil {
		if mem, err := p.MemoryInfo(); err == nil && mem != nil {
			memMB = float64(mem.RSS) / (1024 * 1024)
		}
		if cpu, err := p.CPUPercent(); err == nil {
			cpuPercent = cpu
		}
	}

	// Timeout check
	if ctx.Err() == context.DeadlineExceeded {
		return CodeResult{
			Output:     "execution timed out (max 3s)",
			Status:     "error",
			Duration:   duration.Seconds(),
			MemoryMB:   memMB,
			CPUPercent: cpuPercent,
		}
	}

	if err != nil {
		return CodeResult{
			Output:     string(out),
			Status:     "error",
			Duration:   duration.Seconds(),
			MemoryMB:   memMB,
			CPUPercent: cpuPercent,
		}
	}

	return CodeResult{
		Output:     string(out),
		Status:     "success",
		Duration:   duration.Seconds(),
		MemoryMB:   memMB,
		CPUPercent: cpuPercent,
	}
}
