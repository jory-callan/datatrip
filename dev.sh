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
# 启动
# ──────────────────────────────────────────
start_server() {
  mkdir -p "$RUN_DIR"
  kill_port $SERVER_PORT server
  [[ -f "$ROOT/server/config.yml" ]] || cp "$ROOT/server/config.example.yaml" "$ROOT/server/config.yml"
  echo "  start server (port $SERVER_PORT)..."
  cd "$ROOT/server" && go run . start -c config.yml >"$SERVER_LOG" 2>&1 &
  cd "$ROOT"
}

start_web() {
  mkdir -p "$RUN_DIR"
  kill_port $WEB_PORT web
  [[ -d "$ROOT/web/node_modules" ]] || (cd "$ROOT/web" && pnpm install)
  echo "  start web (port $WEB_PORT)..."
  cd "$ROOT/web" && pnpm dev >"$WEB_LOG" 2>&1 &
  cd "$ROOT"
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
    start_server
    start_web
    echo ""
    echo "  web:    http://127.0.0.1:$WEB_PORT"
    echo "  api:    http://127.0.0.1:$SERVER_PORT/api/v1"
    echo "  stop:   ./dev.sh stop"
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
    start_server
    start_web
    echo ""
    echo "  web:    http://127.0.0.1:$WEB_PORT"
    echo "  api:    http://127.0.0.1:$SERVER_PORT/api/v1"
    ;;

  web)
    echo "=== restart web ==="
    stop_web
    start_web
    ;;

  server)
    echo "=== restart server ==="
    stop_server
    start_server
    ;;

  status)
    echo "=== status ==="
    status
    ;;

  logs)
    tail -f "$SERVER_LOG" "$WEB_LOG"
    ;;

  *)
    echo "usage: ./dev.sh {start|stop|restart|web|server|status|logs}"
    exit 1
    ;;
esac
