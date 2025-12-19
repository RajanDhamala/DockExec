<div align="center">

# DockExec

LeetCode-style code execution microservice platform with sandboxed, resource-limited runtimes.

<br />

<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/Node.js-000000?style=for-the-badge&logo=nodedotjs&logoColor=3C873A" />
<img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=ffffff" />
<img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" />
<img src="https://img.shields.io/badge/Gin_Gonic-008ECF?style=for-the-badge&logo=go&logoColor=white" />
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
<img src="https://img.shields.io/badge/Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white" />
<img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
<img src="https://img.shields.io/badge/MongoDB-001E2B?style=for-the-badge&logo=mongodb&logoColor=00ED64" />
<img src="https://img.shields.io/badge/Docker-0db7ed?style=for-the-badge&logo=docker&logoColor=white" />

<br />
<br />

</div>

DockExec is a microservice-based code execution platform that lets users write, run, and test code in a LeetCode / Programiz style UI. It focuses on **safe, isolated execution** of user-submitted code with **time / memory limits**, **no filesystem or network access**, and **language-specific sanitization**.

Currently supported languages:

- 🧵 **C**
- ☕ **Java**
- ⚡ **JavaScript**
- 🐍 **Python**
- 🐹 **Go**

The whole system is designed to be **container-friendly** so each microservice can be dockerized and deployed with tight resource limits.

---

## 🧩 High-level architecture

This repo contains multiple services that together form the DockExec platform:

- 💻 **`code-portal/`** – React (Vite) frontend with a LeetCode-like editor and Programiz-style “run code” UX.
- 🧩 **`job-hub/`** – Node.js/Express service that exposes REST APIs & WebSocket/socket.io endpoints, manages jobs, users, test cases, and logs.
- 🐝 **`worker-bee/`** – Python worker that sanitizes code, wraps user code into language templates (LeetCode-style function signatures), and talks to the execution backend.
- 🚀 **`go-exec/`** – Go (Gin) microservice that actually executes user code inside constrained sandboxes with **3s time limits** and restricted memory.
- 📡 **Kafka** – Message broker to decouple job submission and execution.
- ⚡ **Redis** – Caching layer for session data, job status, and rate limiting / dedup.
- 🗄️ **MongoDB** – Main database for users, problems, code submissions, and test cases.

All of these are wired together with Docker / docker-compose for local development and future deployment.

Directory overview (simplified):

```text
.
├── code-portal         # React frontend (Vite)
├── go-exec             # Go Gin execution service
├── job-hub             # Node.js/Express API + WebSocket service
├── worker-bee          # Python judge / sanitizer / wrapper
├── sandboxes           # (Reserved for sandbox images / configs)
├── hive-logs           # Logs volume / directory (used by services)
├── docker-compose.yml  # Orchestrates the stack
├── docker-compose-go.yml
└── README.md
```

---

## 🔁 Core workflow

Below is a high-level flow of how a single code execution request moves through the system:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT (Browser)                               │
│                          React / Vite Frontend                             │
│  ┌──────────────────────────┐                ┌───────────────────────────┐ │
│  │  HTTP Requests (REST)    │                │  WebSocket Connection     │ │
│  │  /run /submit /status    │                │  Live job status updates  │ │
│  └────────────┬─────────────┘                └─────────────┬─────────────┘ │
└───────────────┼────────────────────────────────────────────┼───────────────┘
				│                                            │
				▼                                            ▼
	  ┌───────────────────────┐                    ┌────────────────────────┐
	  │      job-hub API      │                    │   job-hub WebSocket    │
	  │   Node.js + Express   │                    │ (socket.io / similar)  │
	  │  • Auth + Users       │                    │  • push job updates    │
	  │  • Submit Code        │                    │  • stream logs         │
	  └──────────┬────────────┘                    └──────────┬─────────────┘
				 │                                            │
				 │   enqueue execution job                    │
				 └─────────────────────────────┬──────────────┘
											   ▼
								 ┌────────────────────────────┐
								 │         Kafka Topic        │
								 │   (execution-requests)     │
								 └─────────────┬──────────────┘
											   │ consume
											   ▼
								  ┌────────────────────────┐
								  │      worker-bee        │
								  │   Python Judge/Sandbox │
								  │ • sanitize code        │
								  │ • wrap into template   │
								  │ • build test harness   │
								  └──────────┬─────────────┘
											 │ call
											 ▼
								  ┌────────────────────────┐
								  │       go-exec          │
								  │   Go + Gin Executor    │
								  │ • run code (C/Java/JS  │
								  │   Python/Go)           │
								  │ • 3s time & mem limit  │
								  └──────────┬─────────────┘
											 │ results
											 ▼
	   ┌──────────────────────────┐      ┌────────────────────────────┐
	   │        Redis Cache       │◀────▶│        job-hub API         │
	   │ • job status/results     │      │ • persist to MongoDB       │
	   └──────────────────────────┘      │ • publish WS updates       │
										 └──────────┬─────────────────┘
													│
													▼
							   ┌──────────────────────────────────────┐
							   │          MongoDB Database           │
							   │ • Users • Problems • TestCases      │
							   │ • Submissions • Logs                │
							   └──────────────────────────────────────┘
```

1. 💻 **User writes code in the frontend (`code-portal`)**
	- LeetCode-style problem page with function signature.
	- Programiz-style “Run” and “Submit” options.

2. 🧩 **`job-hub` receives the request**
	 - REST API endpoint for running/submitting code.
	 - Auth middleware for user sessions (MongoDB + Redis).
	 - Enqueues an execution job onto **Kafka**.

3. 🐝 **`worker-bee` (Python) processes the job**
	 - Takes the user’s raw source code.
	 - **Sanitizes** it:
		 - Blocks dangerous imports (e.g. filesystem, networking, subprocess, etc.).
		 - Disallows direct filesystem access and network APIs.
	 - Wraps the code into a **language-specific template**:
		 - LeetCode-style function wrapper for test case execution.
		 - Programiz-style main function for ad-hoc runs.
	 - Sends the prepared code to **`go-exec`** for actual execution.

4. 🚀 **`go-exec` (Gin) executes the code**
	 - Runs the code in a constrained sandbox:
		 - Max **3 seconds** execution time.
		 - Limited memory.
		 - No outgoing network.
		 - No filesystem read/write (except internal temp if strictly needed, not exposed).
	 - Supports C, Java, JS, Python, and Go.
	 - Returns stdout/stderr, exit code, and metadata back to `worker-bee`.

5. 📡 **Result propagation**
	 - `worker-bee` validates results against test cases.
	 - `job-hub`:
		 - Stores logs / submissions in MongoDB.
		 - Caches job status/results in Redis.
		 - Pushes live updates via WebSocket/socket.io to the frontend.
	 - `code-portal` displays pass/fail, runtime, and error messages (LeetCode-style verdicts).

---

## 🛡️ Security & isolation

DockExec is built with security and resource isolation in mind:

- **Language-level sanitization (Python worker)**
	- Detects and blocks malicious imports: filesystem (`os`, `pathlib`), networking (`socket`, `requests`), process control (`subprocess`, `multiprocessing`), etc.
	- Strips or rejects code that tries to escape the intended function scope.

- **Sandboxed execution (Go exec service)**
	- Per-execution CPU time limit (3s) and memory cap.
	- No network access allowed from inside the sandbox.
	- No arbitrary disk access (no `/etc`, no host FS mounting).

- **Infrastructure constraints**
	- Each microservice is intended to run in its own Docker container.
	- Containers will be run with resource limits (CPU/mem) for extra protection.
	- Logs flow into `hive-logs/` for auditing.

> Note: The actual enforcement details depend on how you configure Docker, seccomp/AppArmor, and the runner. This repo focuses on the application logic and integrates cleanly with hardened container runtimes.

---

## 🧱 Services

### 1. 💻 `code-portal` – React frontend

- Built with **Vite + React**.
- LeetCode-style problem and editor pages (`Pages/LeetCode.jsx`, `Pages/WriteCode.jsx`).
- Programiz-like “Run code” experience for quick trials.
- Uses **Zustand** stores for socket and user state.
- Talks to `job-hub` over HTTP + WebSocket.

Key files:

- `code-portal/src/Pages/LeetCode.jsx` – problem solving view.
- `code-portal/src/Pages/WriteCode.jsx` – free-form code runner.
- `code-portal/src/ZustandStore/SocketStore.js` – socket connection handling.
- `code-portal/src/Utils/AxiosWrapper.js` – API client.

Run locally (frontend-only):

```bash
cd code-portal
npm install
npm run dev
```

### 2. 🧩 `job-hub` – API & socket gateway

- **Node.js + Express** backend.
- Responsibilities:
	- REST API for problems, submissions, and auth.
	- WebSocket / socket.io for real-time updates.
	- Integration with MongoDB, Kafka, Redis, and gRPC to the worker.
	- Houses business logic for LeetCode-style and Programiz-style runs.

Key pieces:

- `job-hub/src/Routes/*.js` – API routing.
- `job-hub/src/Controllers/*.js` – request controllers.
- `job-hub/src/Utils/CodeWrapper.js` – code wrapping utilities.
- `job-hub/src/Utils/KafkaProvider.js` – Kafka client & producers/consumers.
- `job-hub/src/Utils/RedisClient.js` / `RedisUtils.js` – caching helpers.
- `job-hub/src/Middlewares/AuthMiddelware.js` – authentication middleware.

Run locally (API only):

```bash
cd job-hub
npm install
node index.js
```

### 3. 🐝 `worker-bee` – Python judge & sanitizer

- Python service that:
	- Validates and sanitizes incoming code.
	- Generates language-specific wrappers (LeetCode-style function signatures).
	- Communicates with the Go execution service (gRPC / HTTP depending on config).
	- Evaluates test cases and aggregates results.

Key files:

- `worker-bee/judge.py` – core judging logic.
- `worker-bee/wrapper.py` – language wrappers/templates.
- `worker-bee/Ready.py`, `Ready2.py` – helpers / additional runners.
- `worker-bee/requirements.txt` – Python dependencies.

Run locally:

```bash
cd worker-bee
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 judge.py
```

### 4. 🚀 `go-exec` – Go Gin execution engine

- Go microservice using **Gin** framework.
- Accepts code + language + input, runs it inside isolated sandboxes.
- Enforces:
	- Max execution time: **3 seconds**.
	- Memory limits.
	- No network / FS abuse.

Key files:

- `go-exec/cmd/server/main.go` – entrypoint.
- `go-exec/internal/routes/routes.go` – HTTP/Gin routing.
- `go-exec/internal/handlers/executor.go` – code execution handler.
- `go-exec/internal/services/runner.go` – core runner logic.
- `go-exec/internal/utils/response.go` – response helpers.

Run locally:

```bash
cd go-exec
go mod tidy
go run ./cmd/server
```

---

## 🐳 Docker & docker-compose

This repo is designed to be run via Docker for local development and future deployment.

Top-level files:

- `docker-compose.yml` – main stack (frontend, job-hub, worker-bee, go-exec, MongoDB, Kafka, Redis, etc.).
- `docker-compose-go.yml` – minimal setup focusing on the Go execution service.

Typical workflow:

```bash
cd DockExec
docker compose up --build
```

Then open the frontend (usually on `http://localhost:5173` or as configured in `code-portal/Dockerfile` / `vite.config.js`).

> Exact ports and service names depend on your `docker-compose.yml`. Adjust accordingly if you change them.

---

## 🧰 Technologies used

**Frontend**

- React (Vite)
- Zustand
- Axios

**Backend / services**

- Node.js + Express (job-hub)
- Go + Gin (go-exec)
- Python (worker-bee)

**Data & infra**

- MongoDB – primary data store.
- Kafka – message broker for job distribution.
- Redis – caching, job status, and possibly rate limiting.
- Docker / docker-compose – service orchestration.

---

## 🧪 Development tips

- Start services one by one in dev mode when debugging:
	- Run `go-exec` directly to debug execution issues.
	- Run `worker-bee` with a small test payload from `test.py`.
	- Run `job-hub` with nodemon for quick backend iteration.
	- Run `code-portal` with Vite dev server for hot reload.
- Use separate Kafka topics per language or purpose if you scale out workers.
- Use Redis TTLs aggressively for ephemeral job caches.

---

## 🗺️ Roadmap / ideas

- Fully dockerize and harden each microservice with stricter resource limits.
- Add more languages and custom runtimes (e.g. Rust, C++17, TypeScript).
- Support interactive problems (stdin streaming) in a safe way.
- Add per-problem time/memory limits and detailed runtime metrics.
- Improve sandbox isolation with seccomp/AppArmor and cgroups.

---

## 📜 License

Specify your license here (e.g. MIT, Apache-2.0). If none is chosen yet, this project is currently "all rights reserved" by the author.
