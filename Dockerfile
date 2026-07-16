# ===== 后端 Dockerfile =====
# docker build -f Dockerfile -t datatrip-backend:latest .

FROM golang:1.25-alpine AS builder
WORKDIR /app

COPY server/go.mod server/go.sum ./
RUN go mod download

COPY server/ .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /app/srvadm ./main.go

FROM alpine:3.21
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /app/srvadm .
COPY server/config.example.yaml /app/config.yaml

EXPOSE 8080
ENTRYPOINT ["/app/srvadm", "start", "-c", "/app/config.yaml"]