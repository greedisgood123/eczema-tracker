#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
[ ! -d "node_modules" ] && npm install
[ ! -d "dist" ] && npm run build
(sleep 1.5 && open "http://localhost:3001") &
echo "Starting Eczema Tracker at http://localhost:3001"
node server.js
