# --- Build Stage ---
FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o executor ./cmd/server/main.go

# --- Runtime Stage ---
FROM golang:1.24-alpine

RUN adduser -D -g '' nonroot
WORKDIR /home/nonroot
COPY --from=builder /app/executor .
USER nonroot
EXPOSE 8080

ENTRYPOINT ["./executor"]
