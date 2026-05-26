#!/bin/bash
# J.A.R.V.I.S. Desktop Launcher

JARVIS_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="/tmp/jarvis.log"
PID_FILE="/tmp/jarvis.pid"

# Kill any existing instance
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  kill "$OLD_PID" 2>/dev/null
fi

# Start the server
cd "$JARVIS_DIR"
node server.js >> "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

# Wait for server to be ready
for i in $(seq 1 20); do
  sleep 0.5
  if curl -sf http://localhost:3000/api/status > /dev/null 2>&1; then
    break
  fi
done

# Open browser
xdg-open http://localhost:3000 2>/dev/null || \
  sensible-browser http://localhost:3000 2>/dev/null || \
  python3 -m webbrowser http://localhost:3000

echo "J.A.R.V.I.S. running (PID $(cat $PID_FILE)). Log: $LOG_FILE"
