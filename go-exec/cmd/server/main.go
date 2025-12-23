package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"go-exec/internal/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/segmentio/kafka-go"
)

type ProgrammizRequest struct {
	JobID     string `json:"jobId"`
	SocketId  string `json:"socketId"`
	Code      string `json:"code"`
	Language  string `json:"language"`
	UserId    string `json:"userId"`
	ProblemId string `json:"problemId"`
}

type ProgrammizResponse struct {
	SocketId  string  `json:"socketId"`
	JobID     string  `json:"jobId"`
	Status    string  `json:"status"`
	Output    string  `json:"output"`
	Duration  float64 `json:"duration_sec"`
	UserId    string  `json:"userId"`
	Code      string  `json:"code"`
	Language  string  `json:"language"`
	ProblemId string  `json:"problemId"`
}

type SingleTestCaseRequest struct {
	JobID       string `json:"jobId"`
	Language    string `json:"language"`
	Input       string `json:"input"`
	Expected    string `json:"expected"`
	WrappedCode string `json:"wrappedCode"`
	SocketId    string `json:"socketId"`
	UserId      string `json:"userId"`
	ProblemId   string `json:"problemId"`
}

type SingleTestCaseResponse struct {
	UserId    string  `json:"userId"`
	ProblemId string  `json:"problemId"`
	JobID     string  `json:"jobId"`
	Language  string  `json:"language"`
	Output    string  `json:"actualOutput"`
	Status    string  `json:"status"`
	Duration  float64 `json:"duration"`
	Timestamp string  `json:"timestamp"`
	SocketId  string  `json:"socketId"`
	Code      string  `json:"code"`
}

type AllTestCasesRequest struct {
	JobID          string `json:"jobId"`
	TestCaseID     string `json:"testCaseId"`
	TestCaseNumber int    `json:"testCaseNumber"`
	TotalTestCases int    `json:"totalTestCases"`
	Language       string `json:"language"`
	Input          string `json:"input"`
	Expected       string `json:"expected"`
	WrappedCode    string `json:"wrappedCode"`
	SocketId       string `json:"socketId"`
	UserId         string `json:"userId"`
	ProblemId      string `json:"problemId"`
	OriginalCode   string `json:"orginalCode"`
}

type AllTestCasesResponse struct {
	JobID          string  `json:"jobId"`
	TestCaseID     string  `json:"testCaseId"`
	TestCaseNumber int     `json:"testCaseNumber"`
	TotalTestCases int     `json:"totalTestCases"`
	Language       string  `json:"language"`
	ActualOutput   string  `json:"actualOutput"`
	Status         string  `json:"status"`
	Passed         bool    `json:"passed"`
	Duration       float64 `json:"duration"`
	ErrorMessage   string  `json:"errorMessage,omitempty"`
	Timestamp      string  `json:"timestamp"`
	SocketId       string  `json:"socketId"`
	Expected       string  `json:"expected"`
	Input          string  `json:"input"`
	UserId         string  `json:"userId"`
	ProblemId      string  `json:"problemId"`
	OriginalCode   string  `json:"orginalCode"`
}

const (
	maxOutputBytes = 16 * 1024 // 16 KB limit
	maxExecTime    = 3 * time.Second
)

var microserviceAccessCounter = prometheus.NewCounterVec(
	prometheus.CounterOpts{
		Name: "docexec_microservice",
		Help: "Total number of times microservice items are accessed",
	},
	[]string{"item_type"},
)

func init() {
	prometheus.MustRegister(microserviceAccessCounter)
}

func main() {
	_ = godotenv.Load("./.env")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	broker := os.Getenv("KAFKA_BROKER")
	if broker == "" {
		broker = "192.168.18.26:29092"
	}

	// Start both Kafka consumers
	go consume_Programmiz_Case(broker) // Original consumer
	go consume_OneTest_Case(broker)    // New test case consumer - UPDATED NAME
	go consume_AllTest_Case(broker)    // Runs code without test cases
	// HTTP server

	// Gin server
	r := gin.Default()

	r.GET("/metrics", gin.WrapH(promhttp.Handler()))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Go Executor is running"})
	})
	r.GET("/access_inventory/:item_type", func(c *gin.Context) {
		itemType := c.Param("item_type")
		microserviceAccessCounter.WithLabelValues(itemType).Inc()
		c.JSON(200, gin.H{"message": "Accessed " + itemType})
	})
	routes.RegisterRoutes(r)
	fmt.Println(" Go Executor running on port", port)

	r.Run("0.0.0.0:" + port)
}

func consume_OneTest_Case(broker string) {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{broker},
		Topic:   "print_test_execution",
		GroupID: "multi-lang-executor",
	})
	defer reader.Close()

	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers: []string{broker},
		Topic:   "print_test_result",
	})
	defer writer.Close()

	fmt.Println(" Listening for jobs on 'print_test_execution'...")

	for {
		msg, err := reader.ReadMessage(context.Background())
		if err != nil {
			fmt.Println("️ Kafka read error:", err)
			time.Sleep(2 * time.Second)
			continue
		}

		job := SingleTestCaseRequest{}
		if err := json.Unmarshal(msg.Value, &job); err != nil {
			fmt.Println("️ Invalid job JSON:", err)
			continue
		}

		fmt.Printf("️ Executing %s job %s...\n", job.Language, job.JobID)

		output, status, execDuration := executeCode(job.WrappedCode, job.Language)
		fmt.Println("output:", output)
		fmt.Println("problemId:", job.ProblemId)

		result := SingleTestCaseResponse{
			SocketId:  job.SocketId,
			JobID:     job.JobID,
			Status:    status,
			Output:    output,
			Duration:  execDuration,
			UserId:    job.UserId,
			Code:      job.WrappedCode,
			Language:  job.Language,
			ProblemId: job.ProblemId,
			Timestamp: time.Now().UTC().Format("2006-01-02 15:04:05"),
		}

		data, _ := json.Marshal(result)
		err = writer.WriteMessages(context.Background(), kafka.Message{
			Key:   []byte(job.JobID),
			Value: data,
		})
		if err != nil {
			fmt.Println(" Failed to publish result:", err)
			continue
		}

		fmt.Printf(" Sent result for job %s (%.4fs)\n", job.JobID, execDuration)
		fmt.Println("--------------------------------------------------")
	}
}

// Original consumer for exec_code topic
func consume_Programmiz_Case(broker string) {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{broker},
		Topic:   "programiz_execution",
		GroupID: "multi-lang-executor",
	})
	defer reader.Close()

	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers: []string{broker},
		Topic:   "programiz_result",
	})
	defer writer.Close()

	fmt.Println(" Listening for jobs on 'exec_code'...")

	for {
		msg, err := reader.ReadMessage(context.Background())
		if err != nil {
			fmt.Println("️ Kafka read error:", err)
			time.Sleep(2 * time.Second)
			continue
		}

		job := ProgrammizRequest{}
		if err := json.Unmarshal(msg.Value, &job); err != nil {
			fmt.Println("️ Invalid job JSON:", err)
			continue
		}

		fmt.Printf("️ Executing %s job %s...\n", job.Language, job.JobID)

		output, status, execDuration := executeCode(job.Code, job.Language)

		result := ProgrammizResponse{
			SocketId: job.SocketId,
			JobID:    job.JobID,
			Status:   status,
			Output:   output,
			Duration: execDuration,
			UserId:   job.UserId,
			Code:     job.Code,
			Language: job.Language,
		}

		data, _ := json.Marshal(result)

		fmt.Println(string(data))
		err = writer.WriteMessages(context.Background(), kafka.Message{
			Key:   []byte(job.JobID),
			Value: data,
		})
		if err != nil {
			fmt.Println(" Failed to publish result:", err)
			continue
		}

		fmt.Printf(" Sent result for job %s (%.4fs)\n", job.JobID, execDuration)
		fmt.Println("--------------------------------------------------")
	}
}

// New consumer for run_code topic (test cases)
func consume_AllTest_Case(broker string) {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{broker},
		Topic:   "all_test_execution",
		GroupID: "test-case-executor",
	})
	defer reader.Close()

	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers: []string{broker},
		Topic:   "all_test_result",
	})
	defer writer.Close()

	fmt.Println(" Listening for test cases on 'run_code'...")

	for {
		msg, err := reader.ReadMessage(context.Background())
		if err != nil {
			fmt.Println("️ Kafka read error on run_code:", err)
			time.Sleep(2 * time.Second)
			continue
		}

		var testJob AllTestCasesRequest
		if err := json.Unmarshal(msg.Value, &testJob); err != nil {
			fmt.Println("️ Invalid test case JSON:", err)
			continue
		}

		fmt.Printf(" Executing test case %d/%d for job %s (%s)\n",
			testJob.TestCaseNumber, testJob.TotalTestCases, testJob.JobID, testJob.Language)
		fmt.Printf(" Input: %s\n", testJob.Input)
		fmt.Printf(" Expected: %s\n", testJob.Expected)
		// Executing the wrapped code
		output, status, execDuration := executeCode(testJob.WrappedCode, testJob.Language)
		// Comparing output with expected result
		passed := false
		actualOutput := strings.TrimSpace(output)
		expectedOutput := strings.TrimSpace(testJob.Expected)

		if status == "success" {
			// Trying different comparison methods
			passed = compareResults(actualOutput, expectedOutput)
		}

		// Creating test case result
		testResult := AllTestCasesResponse{
			JobID:          testJob.JobID,
			TestCaseID:     testJob.TestCaseID,
			TestCaseNumber: testJob.TestCaseNumber,
			TotalTestCases: testJob.TotalTestCases,
			Language:       testJob.Language,
			Input:          testJob.Input,
			Expected:       testJob.Expected,
			ActualOutput:   actualOutput,
			Status:         status,
			Passed:         passed,
			Duration:       execDuration,
			Timestamp:      time.Now().UTC().Format("2006-01-02 15:04:05"),
			SocketId:       testJob.SocketId,
			UserId:         testJob.UserId,
			ProblemId:      testJob.ProblemId,
			OriginalCode:   testJob.OriginalCode,
		}

		if status != "success" {
			testResult.ErrorMessage = output
		}

		// Publishing result to job_results topic
		data, _ := json.Marshal(testResult)
		fmt.Println(string(data))
		err = writer.WriteMessages(context.Background(), kafka.Message{
			Key:   []byte(testJob.TestCaseID),
			Value: data,
		})
		if err != nil {
			fmt.Println(" Failed to publish test result:", err)
			continue
		}

		passStatus := " FAILED"
		if passed {
			passStatus = " PASSED"
		}

		fmt.Printf("%s Test case %d: Expected '%s', Got '%s' (%.4fs)\n",
			passStatus, testJob.TestCaseNumber, expectedOutput, actualOutput, execDuration)
		fmt.Println("--------------------------------------------------")
	}
}

// Comparing actual output with expected output
func compareResults(actual, expected string) bool {
	// Direct string comparison
	if actual == expected {
		return true
	}

	// Trying JSON comparison for arrays/objects
	if isJSON(actual) && isJSON(expected) {
		return compareJSON(actual, expected)
	}

	// Trying array comparison (remove spaces, brackets)
	actualClean := strings.ReplaceAll(strings.ReplaceAll(actual, " ", ""), "\n", "")
	expectedClean := strings.ReplaceAll(strings.ReplaceAll(expected, " ", ""), "\n", "")

	return actualClean == expectedClean
}

func isJSON(str string) bool {
	var js json.RawMessage
	return json.Unmarshal([]byte(str), &js) == nil
}

func compareJSON(actual, expected string) bool {
	var actualJSON, expectedJSON interface{}

	if json.Unmarshal([]byte(actual), &actualJSON) != nil {
		return false
	}
	if json.Unmarshal([]byte(expected), &expectedJSON) != nil {
		return false
	}

	actualBytes, _ := json.Marshal(actualJSON)
	expectedBytes, _ := json.Marshal(expectedJSON)

	return string(actualBytes) == string(expectedBytes)
}

func executeCode(code string, lang string) (string, string, float64) {
	tmpFile, err := os.CreateTemp("", "code-*")
	if err != nil {
		return "cannot create temp file", "error", 0
	}
	defer os.Remove(tmpFile.Name())

	var cmd *exec.Cmd
	var buildCmd *exec.Cmd
	var start time.Time
	switch lang {
	case "go":
		os.WriteFile(tmpFile.Name()+".go", []byte(code), 0o644)
		binPath := strings.TrimSuffix(tmpFile.Name(), ".go")
		buildCmd = exec.Command("go", "build", "-o", binPath, tmpFile.Name()+".go")
		if out, err := buildCmd.CombinedOutput(); err != nil {
			return string(out), "error", 0
		}

		start = time.Now()
		defer os.Remove(binPath)
		cmd = exec.Command(binPath)

	case "python":
		filePath := tmpFile.Name() + ".py"
		os.WriteFile(filePath, []byte(code), 0o644)

		start = time.Now()
		cmd = exec.Command("python3", filePath)

	case "javascript":
		filePath := tmpFile.Name() + ".js"
		os.WriteFile(filePath, []byte(code), 0o644)

		start = time.Now()
		cmd = exec.Command("node", filePath)

	case "c":
		filePath := tmpFile.Name() + ".c"
		os.WriteFile(filePath, []byte(code), 0o644)
		outFile := tmpFile.Name() + "_out"

		start = time.Now()
		buildCmd = exec.Command("gcc", filePath, "-o", outFile)
		if out, err := buildCmd.CombinedOutput(); err != nil {
			return string(out), "error", 0
		}
		defer os.Remove(outFile)
		cmd = exec.Command(outFile)

	case "java":
		filePath := tmpFile.Name() + ".java"
		os.WriteFile(filePath, []byte(code), 0o644)

		buildCmd = exec.Command("javac", filePath)
		if out, err := buildCmd.CombinedOutput(); err != nil {
			return string(out), "error", 0
		}
		start = time.Now()
		cmd = exec.Command("java", "-cp", os.TempDir(), "Main")

	default:
		return fmt.Sprintf("unsupported language: %s", lang), "error", 0
	}

	ctx, cancel := context.WithTimeout(context.Background(), maxExecTime)
	defer cancel()

	cmd = exec.CommandContext(ctx, cmd.Path, cmd.Args[1:]...)
	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		return fmt.Sprintf("failed to start: %v", err), "error", 0
	}
	var buf bytes.Buffer
	scannerOut := bufio.NewScanner(stdout)
	scannerErr := bufio.NewScanner(stderr)
	scannerOut.Buffer(make([]byte, 0, 1024), maxOutputBytes)
	scannerErr.Buffer(make([]byte, 0, 1024), maxOutputBytes)

	readOutput := func(scanner *bufio.Scanner) {
		for scanner.Scan() {
			line := scanner.Text() + "\n"
			if buf.Len()+len(line) > maxOutputBytes {
				buf.WriteString("\n[output truncated]\n")
				break
			}
			buf.WriteString(line)
		}
	}
	doneOut := make(chan bool)
	doneErr := make(chan bool)
	go func() { readOutput(scannerOut); doneOut <- true }()
	go func() { readOutput(scannerErr); doneErr <- true }()
	<-doneOut
	<-doneErr

	err = cmd.Wait()
	execDuration := time.Since(start).Seconds()
	output := strings.TrimSpace(buf.String())

	if ctx.Err() == context.DeadlineExceeded {
		return output + "\n[timeout: 3s exceeded]", "error", execDuration
	}
	if err != nil {
		return fmt.Sprintf("%s\n(exit error: %v)", output, err), "error", execDuration
	}

	return output, "success", execDuration
}
