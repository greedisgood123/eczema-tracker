#!/usr/bin/env bash
# -------------------------------------------------------
# Eczema Tracker — double-click launcher (macOS)
# -------------------------------------------------------

# Move to the script's own directory so relative paths work
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

echo ""
echo -e "${GREEN}🌿 Eczema Tracker${NC}"
echo "------------------------------"

# ── 1. Check Node.js ──────────────────────────────────
# Try common install locations in addition to PATH
for candidate in \
    "$(command -v node 2>/dev/null)" \
    "/usr/local/bin/node" \
    "/opt/homebrew/bin/node" \
    "$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | sort -V | tail -1)/bin/node"
do
    if [ -x "$candidate" ]; then
        NODE_BIN="$candidate"
        NPM_BIN="$(dirname "$NODE_BIN")/npm"
        break
    fi
done

if [ -z "$NODE_BIN" ]; then
    echo -e "${RED}✗ Node.js not found.${NC}"
    echo ""
    echo "Please install Node.js first:"
    echo "  • Homebrew:  brew install node"
    echo "  • Or visit:  https://nodejs.org"
    echo ""
    echo "After installing, double-click this file again."
    echo ""
    read -p "Press Enter to close..."
    exit 1
fi

NODE_VER="$("$NODE_BIN" --version)"
echo -e "${GREEN}✓ Node.js${NC} $NODE_VER found"

# ── 2. Install npm packages if needed ─────────────────
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}→ Installing dependencies (first run)...${NC}"
    "$NPM_BIN" install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies ready${NC}"
fi

# ── 3. Build frontend if needed ───────────────────────
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}→ Building app (first run)...${NC}"
    "$NPM_BIN" run build
    echo -e "${GREEN}✓ Build complete${NC}"
else
    echo -e "${GREEN}✓ Build ready${NC}"
fi

# ── 4. Open browser after short delay ─────────────────
echo ""
echo -e "${GREEN}Starting server → http://localhost:3001${NC}"
echo "Close this window to stop the app."
echo ""

(sleep 2 && open "http://localhost:3001") &

# ── 5. Start server ───────────────────────────────────
"$NODE_BIN" server.js
