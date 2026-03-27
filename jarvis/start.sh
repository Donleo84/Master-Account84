#!/bin/bash
# J.A.R.V.I.S. Startup Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check for .env file
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo ""
    echo "  IMPORTANT: Edit jarvis/.env and add your ANTHROPIC_API_KEY"
    echo "  Get your key at: https://console.anthropic.com"
    echo ""
  fi
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the server
echo "Starting J.A.R.V.I.S...."
node server.js
