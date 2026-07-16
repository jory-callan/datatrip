#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SERVER_PORT=8080
WEB_PORT=5173
RUN_DIR="$ROOT/.run"
SERVER_LOG="$RUN_DIR/server.log"
WEB_LOG="$RUN_DIR/web.log"

# ──────────────────────────────────────────
# 工具：根据端口杀进程
# ──────────────────────────────────────────
kill_port() {
  local port=$1 name=$2
  local pid
  pid=$(lsof -ti ":$port" 2>/dev/null || true)
  if [[ -n "$pid" ]]; then
    echo "  kill $name (pid $pid, port $port)"
    kill "$pid" 2>/dev/null || true
    # 等进程真正退出
    for _ in $(seq 1 20); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.2
    done
    kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
  fi
}

# ──────────────────────────────────────────
# 工具：等待端口监听，超时退出
# ──────────────────────────────────────────
wait_port() {
  local port=$1 name=$2 timeout=${3:-30}
  local i
  for i in $(seq 1 $timeout); do
    lsof -ti ":$port" 2>/dev/null && return 0
    sleep 1
  done
  echo "  ERROR: $name failed to listen on port $port after ${timeout}s" >&2
  return 1
}

# ──────────────────────────────────────────
# 启动
# ──────────────────────────────────────────

start_server() {
  mkdir -p "$RUN_DIR"
  kill_port $SERVER_PORT server
  sleep 1
  echo "  start server (port $SERVER_PORT)..."
  cd "$ROOT/server" && go run . start -c config.yml >"$SERVER_LOG" 2>&1 &
  cd "$ROOT"
  wait_port $SERVER_PORT server || return 1
}

start_web() {
  mkdir -p "$RUN_DIR"
  kill_port $WEB_PORT web
  sleep 1
  [[ -d "$ROOT/web/node_modules" ]] || (cd "$ROOT/web" && pnpm install)
  echo "  start web (port $WEB_PORT)..."
  cd "$ROOT/web" && pnpm dev >"$WEB_LOG" 2>&1 &
  cd "$ROOT"
  wait_port $WEB_PORT web || return 1
}

# ──────────────────────────────────────────
# 停止
# ──────────────────────────────────────────
stop_server() { kill_port $SERVER_PORT server; }
stop_web()    { kill_port $WEB_PORT    web;    }

# ──────────────────────────────────────────
# 状态
# ──────────────────────────────────────────
port_pid() {
  lsof -ti ":$1" 2>/dev/null || true
}

status() {
  local sp wp
  sp=$(port_pid $SERVER_PORT)
  wp=$(port_pid $WEB_PORT)
  [[ -n "$sp" ]] && echo "  server  running  pid $sp  port $SERVER_PORT" || echo "  server  stopped"
  [[ -n "$wp" ]] && echo "  web     running  pid $wp  port $WEB_PORT"    || echo "  web     stopped"
}

# ──────────────────────────────────────────
# 命令分发
# ──────────────────────────────────────────
case "${1:-start}" in
  start)
    echo "=== start all ==="
    start_server || { echo "  server failed to start" >&2; exit 1; }
    start_web || { echo "  web failed to start" >&2; exit 1; }
    echo ""
    echo "  web:    http://127.0.0.1:$WEB_PORT"
    echo "  api:    http://127.0.0.1:$SERVER_PORT/api/v1"
    echo "  stop:   ./dev.sh stop"
    echo ""
    tail -f "$SERVER_LOG" "$WEB_LOG"
    ;;

  stop)
    echo "=== stop all ==="
    stop_web
    stop_server
    ;;

  restart)
    echo "=== restart all ==="
    stop_web
    stop_server
    start_server || { echo "  server failed to start, aborting" >&2; exit 1; }
    start_web || { echo "  web failed to start, aborting" >&2; exit 1; }
    echo ""
    echo "  web:    http://127.0.0.1:$WEB_PORT"
    echo "  api:    http://127.0.0.1:$SERVER_PORT/api/v1"
    echo ""
    tail -f "$SERVER_LOG" "$WEB_LOG"
    ;;

  web)
    echo "=== restart web ==="
    stop_web
    start_web || { echo "  web failed to start" >&2; exit 1; }
    ;;

  server)
    echo "=== restart server ==="
    stop_server
    start_server || { echo "  server failed to start" >&2; exit 1; }
    ;;

  status)
    echo "=== status ==="
    status
    ;;

  logs)
    [[ -f "$SERVER_LOG" && -f "$WEB_LOG" ]] || { echo "  no log files found, run ./dev.sh start first" >&2; exit 1; }
    tail -f "$SERVER_LOG" "$WEB_LOG"
    ;;

  *)
    echo "usage: ./dev.sh {start|stop|restart|web|server|status|logs}"
    exit 1
    ;;
esac
